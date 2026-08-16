package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/kerntau/blog/cms-api/internal/database"
	"github.com/kerntau/blog/cms-api/internal/filestore"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type FriendLink struct {
	ID              string     `json:"id"`
	Name            string     `json:"name"`
	URL             string     `json:"url"`
	AvatarURL       string     `json:"avatarUrl"`
	Description     string     `json:"description"`
	GroupName       string     `json:"groupName"`
	SortOrder       int        `json:"sortOrder"`
	Enabled         bool       `json:"enabled"`
	LastCheckedAt   *time.Time `json:"lastCheckedAt,omitempty"`
	LastCheckStatus string     `json:"lastCheckStatus"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

type FriendLinkInput struct {
	Name        string `json:"name"`
	URL         string `json:"url"`
	AvatarURL   string `json:"avatarUrl"`
	Description string `json:"description"`
	GroupName   string `json:"groupName"`
	SortOrder   int    `json:"sortOrder"`
	Enabled     bool   `json:"enabled"`
}

type NavigationItem struct {
	ID        string           `json:"id"`
	ParentID  *string          `json:"parentId,omitempty"`
	Label     string           `json:"label"`
	Href      string           `json:"href"`
	SortOrder int              `json:"sortOrder"`
	Enabled   bool             `json:"enabled"`
	Children  []NavigationItem `json:"children,omitempty"`
}

type NavigationInput struct {
	ID        string  `json:"id,omitempty"`
	ParentID  *string `json:"parentId,omitempty"`
	Label     string  `json:"label"`
	Href      string  `json:"href"`
	SortOrder int     `json:"sortOrder"`
	Enabled   bool    `json:"enabled"`
}

type SiteService struct {
	database *gorm.DB
	store    *filestore.Store
}

func NewSiteService(db *gorm.DB, store *filestore.Store) *SiteService {
	return &SiteService{database: db, store: store}
}

func (service *SiteService) GetSettings(ctx context.Context) (map[string]string, error) {
	settings, err := service.loadAllSettingsFromDB(ctx)
	if err != nil {
		return nil, err
	}

	result := make(map[string]string, len(settings))
	for k, v := range settings {
		if !isProtectedSettingKey(k) {
			result[k] = v
		}
	}
	return result, nil
}

func (service *SiteService) GetSetting(ctx context.Context, key string) (string, error) {
	var row database.AppSetting
	if err := service.database.WithContext(ctx).First(&row, "key = ?", key).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", nil
		}
		return "", err
	}
	return row.Value, nil
}

func (service *SiteService) SetSetting(ctx context.Context, key, value string) error {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	row := database.AppSetting{
		Key:       key,
		Value:     value,
		UpdatedAt: now,
	}
	return service.database.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
	}).Create(&row).Error
}

func (service *SiteService) loadAllSettingsFromDB(ctx context.Context) (map[string]string, error) {
	var rows []database.AppSetting
	if err := service.database.WithContext(ctx).Find(&rows).Error; err != nil {
		return nil, err
	}

	if len(rows) == 0 {
		// 首次启动且数据库为空时，从初始 JSON 种子导入到数据库
		seed := make(map[string]string)
		if err := service.store.ReadJSON("site-settings.json", &seed); err == nil && len(seed) > 0 {
			now := time.Now().UTC().Format(time.RFC3339Nano)
			var toInsert []database.AppSetting
			for k, v := range seed {
				toInsert = append(toInsert, database.AppSetting{
					Key:       k,
					Value:     v,
					UpdatedAt: now,
				})
			}
			if len(toInsert) > 0 {
				_ = service.database.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&toInsert).Error
			}
			return seed, nil
		}
		return make(map[string]string), nil
	}

	result := make(map[string]string, len(rows))
	for _, row := range rows {
		result[row.Key] = row.Value
	}
	return result, nil
}

func (service *SiteService) UpdateSettings(ctx context.Context, values map[string]string) (map[string]string, error) {
	if len(values) > 100 {
		return nil, ErrInvalidInput
	}
	for key, value := range values {
		key = strings.TrimSpace(key)
		if key == "" || len(key) > 100 || len(value) > 10000 {
			return nil, ErrInvalidInput
		}
		if isProtectedSettingKey(key) {
			return nil, ErrInvalidInput
		}
	}

	now := time.Now().UTC().Format(time.RFC3339Nano)
	err := service.database.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for key, value := range values {
			row := database.AppSetting{
				Key:       strings.TrimSpace(key),
				Value:     strings.TrimSpace(value),
				UpdatedAt: now,
			}
			if err := tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "key"}},
				DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
			}).Create(&row).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	current, err := service.GetSettings(ctx)
	if err != nil {
		current = make(map[string]string)
	}

	// 同步落盘本地快照文件以备离线静态导出
	_ = service.store.WriteJSON("site-settings.json", current)
	storagePath := filepath.Join(filepath.Dir(service.store.ContentDir()), "storage", "settings", "site-settings.json")
	if err := os.MkdirAll(filepath.Dir(storagePath), 0755); err == nil {
		raw, _ := json.MarshalIndent(current, "", "  ")
		_ = os.WriteFile(storagePath, append(raw, '\n'), 0644)
	}

	return current, nil
}

// Push credentials are server-only configuration. Keep them out of the
// content settings file and out of both admin/public settings responses.
func isProtectedSettingKey(key string) bool {
	normalized := strings.ToLower(strings.NewReplacer("_", "", "-", "").Replace(strings.TrimSpace(key)))
	switch normalized {
	case "indexnowkey", "cmsindexnowkey", "baidutoken", "baidupushtoken", "cmsbaidupushtoken", "adminpassword", "cmsadminpassword":
		return true
	default:
		return false
	}
}

func (service *SiteService) ListFriends(ctx context.Context) ([]FriendLink, error) {
	var items []FriendLink
	if err := service.store.ReadJSON("friends.json", &items); err != nil {
		return nil, err
	}
	if items == nil {
		items = make([]FriendLink, 0)
	}
	sort.SliceStable(items, func(i, j int) bool {
		if items[i].SortOrder != items[j].SortOrder {
			return items[i].SortOrder < items[j].SortOrder
		}
		return items[i].Name < items[j].Name
	})
	return items, nil
}

func (service *SiteService) CreateFriend(ctx context.Context, input FriendLinkInput) (FriendLink, error) {
	if err := validateFriend(input); err != nil {
		return FriendLink{}, err
	}
	items, err := service.ListFriends(ctx)
	if err != nil {
		items = make([]FriendLink, 0)
	}
	now := time.Now().UTC()
	item := FriendLink{
		ID:          newID(),
		Name:        strings.TrimSpace(input.Name),
		URL:         strings.TrimSpace(input.URL),
		AvatarURL:   strings.TrimSpace(input.AvatarURL),
		Description: strings.TrimSpace(input.Description),
		GroupName:   strings.TrimSpace(input.GroupName),
		SortOrder:   input.SortOrder,
		Enabled:     input.Enabled,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	items = append(items, item)
	if err := service.store.WriteJSON("friends.json", items); err != nil {
		return FriendLink{}, err
	}
	return item, nil
}

func (service *SiteService) UpdateFriend(ctx context.Context, id string, input FriendLinkInput) (FriendLink, error) {
	if err := validateFriend(input); err != nil {
		return FriendLink{}, err
	}
	items, err := service.ListFriends(ctx)
	if err != nil {
		return FriendLink{}, err
	}
	found := false
	var updatedItem FriendLink
	now := time.Now().UTC()

	for i := range items {
		if items[i].ID == id {
			items[i].Name = strings.TrimSpace(input.Name)
			items[i].URL = strings.TrimSpace(input.URL)
			items[i].AvatarURL = strings.TrimSpace(input.AvatarURL)
			items[i].Description = strings.TrimSpace(input.Description)
			items[i].GroupName = strings.TrimSpace(input.GroupName)
			items[i].SortOrder = input.SortOrder
			items[i].Enabled = input.Enabled
			items[i].UpdatedAt = now
			updatedItem = items[i]
			found = true
			break
		}
	}
	if !found {
		return FriendLink{}, ErrNotFound
	}
	if err := service.store.WriteJSON("friends.json", items); err != nil {
		return FriendLink{}, err
	}
	return updatedItem, nil
}

func (service *SiteService) DeleteFriend(ctx context.Context, id string) error {
	items, err := service.ListFriends(ctx)
	if err != nil {
		return err
	}
	newItems := make([]FriendLink, 0, len(items))
	found := false
	for _, item := range items {
		if item.ID == id {
			found = true
			continue
		}
		newItems = append(newItems, item)
	}
	if !found {
		return ErrNotFound
	}
	return service.store.WriteJSON("friends.json", newItems)
}

func (service *SiteService) CheckFriend(ctx context.Context, id string) (FriendLink, error) {
	item, err := service.friend(ctx, id)
	if err != nil {
		return FriendLink{}, err
	}
	parsed, err := url.ParseRequestURI(item.URL)
	if err != nil || parsed.Hostname() == "" || isPrivateHost(parsed.Hostname()) {
		return FriendLink{}, ErrInvalidInput
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodHead, item.URL, nil)
	if err != nil {
		return FriendLink{}, err
	}
	client := &http.Client{
		Timeout: 8 * time.Second,
		CheckRedirect: func(request *http.Request, via []*http.Request) error {
			if len(via) >= 3 {
				return http.ErrUseLastResponse
			}
			if isPrivateHost(request.URL.Hostname()) {
				return fmt.Errorf("redirected to a private host")
			}
			return nil
		},
	}
	response, checkErr := client.Do(request)
	status := ""
	if checkErr != nil {
		status = "error: " + truncateStatus(checkErr.Error())
	} else {
		response.Body.Close()
		status = fmt.Sprintf("HTTP %d", response.StatusCode)
	}
	items, _ := service.ListFriends(ctx)
	now := time.Now().UTC()
	for i := range items {
		if items[i].ID == id {
			items[i].LastCheckedAt = &now
			items[i].LastCheckStatus = status
			items[i].UpdatedAt = now
			item = items[i]
			break
		}
	}
	_ = service.store.WriteJSON("friends.json", items)
	return item, checkErr
}

func (service *SiteService) friend(ctx context.Context, id string) (FriendLink, error) {
	items, err := service.ListFriends(ctx)
	if err != nil {
		return FriendLink{}, err
	}
	for _, item := range items {
		if item.ID == id {
			return item, nil
		}
	}
	return FriendLink{}, ErrNotFound
}

func (service *SiteService) Navigation(ctx context.Context) ([]NavigationItem, error) {
	var items []NavigationItem
	if err := service.store.ReadJSON("navigation.json", &items); err != nil {
		return nil, err
	}
	if items == nil {
		items = make([]NavigationItem, 0)
	}
	return buildNavigation(items), nil
}

func (service *SiteService) ReplaceNavigation(ctx context.Context, inputs []NavigationInput) ([]NavigationItem, error) {
	if len(inputs) > 50 {
		return nil, ErrInvalidInput
	}
	for _, item := range inputs {
		if strings.TrimSpace(item.Label) == "" || !validNavigationHref(item.Href) {
			return nil, ErrInvalidInput
		}
	}
	var newItems []NavigationItem
	for _, input := range inputs {
		id := input.ID
		if id == "" {
			id = newID()
		}
		newItems = append(newItems, NavigationItem{
			ID:        id,
			ParentID:  input.ParentID,
			Label:     strings.TrimSpace(input.Label),
			Href:      strings.TrimSpace(input.Href),
			SortOrder: input.SortOrder,
			Enabled:   input.Enabled,
		})
	}
	if err := service.store.WriteJSON("navigation.json", newItems); err != nil {
		return nil, err
	}
	return service.Navigation(ctx)
}

func validateFriend(input FriendLinkInput) error {
	if strings.TrimSpace(input.Name) == "" || len(input.Name) > 120 {
		return ErrInvalidInput
	}
	if !validExternalURL(input.URL) {
		return ErrInvalidInput
	}
	if input.AvatarURL != "" && !validExternalURL(input.AvatarURL) {
		return ErrInvalidInput
	}
	return nil
}

func validExternalURL(value string) bool {
	parsed, err := url.ParseRequestURI(strings.TrimSpace(value))
	return err == nil && (parsed.Scheme == "https" || parsed.Scheme == "http") && parsed.Host != ""
}

func validNavigationHref(value string) bool {
	value = strings.TrimSpace(value)
	if strings.HasPrefix(value, "/") {
		return !strings.HasPrefix(value, "//")
	}
	return validExternalURL(value)
}

func isPrivateHost(host string) bool {
	if strings.EqualFold(host, "localhost") {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && (ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() || ip.IsUnspecified())
}

func truncateStatus(value string) string {
	if len(value) > 200 {
		return value[:200]
	}
	return value
}

func buildNavigation(items []NavigationItem) []NavigationItem {
	byParent := map[string][]NavigationItem{}
	roots := make([]NavigationItem, 0)
	for _, item := range items {
		if item.ParentID == nil {
			roots = append(roots, item)
		} else {
			byParent[*item.ParentID] = append(byParent[*item.ParentID], item)
		}
	}
	var attach func([]NavigationItem) []NavigationItem
	attach = func(nodes []NavigationItem) []NavigationItem {
		for index := range nodes {
			nodes[index].Children = attach(byParent[nodes[index].ID])
		}
		sort.SliceStable(nodes, func(left, right int) bool { return nodes[left].SortOrder < nodes[right].SortOrder })
		return nodes
	}
	return attach(roots)
}
