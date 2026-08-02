package service

import (
	"context"
	"database/sql"
	"net/url"
	"sort"
	"strings"
	"time"
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
type SiteService struct{ database *sql.DB }

func NewSiteService(database *sql.DB) *SiteService { return &SiteService{database: database} }
func (service *SiteService) GetSettings(ctx context.Context) (map[string]string, error) {
	rows, err := service.database.QueryContext(ctx, `SELECT setting_key,setting_value FROM site_settings ORDER BY setting_key`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := map[string]string{}
	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return nil, err
		}
		result[key] = value
	}
	return result, rows.Err()
}
func (service *SiteService) UpdateSettings(ctx context.Context, values map[string]string) (map[string]string, error) {
	if len(values) > 100 {
		return nil, ErrInvalidInput
	}
	now := time.Now().UTC().Format(time.RFC3339Nano)
	tx, err := service.database.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	for key, value := range values {
		key = strings.TrimSpace(key)
		if key == "" || len(key) > 100 || len(value) > 10000 {
			return nil, ErrInvalidInput
		}
		if _, err := tx.ExecContext(ctx, `INSERT INTO site_settings (setting_key,setting_value,updated_at) VALUES (?,?,?) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=excluded.updated_at`, key, strings.TrimSpace(value), now); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return service.GetSettings(ctx)
}
func (service *SiteService) ListFriends(ctx context.Context) ([]FriendLink, error) {
	rows, err := service.database.QueryContext(ctx, `SELECT id,name,url,avatar_url,description,group_name,sort_order,enabled,last_checked_at,last_check_status,created_at,updated_at FROM friend_links ORDER BY sort_order,name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]FriendLink, 0)
	for rows.Next() {
		var item FriendLink
		var enabled int
		var checked sql.NullString
		var created, updated string
		if err := rows.Scan(&item.ID, &item.Name, &item.URL, &item.AvatarURL, &item.Description, &item.GroupName, &item.SortOrder, &enabled, &checked, &item.LastCheckStatus, &created, &updated); err != nil {
			return nil, err
		}
		item.Enabled = enabled == 1
		item.CreatedAt = parseTime(created)
		item.UpdatedAt = parseTime(updated)
		if checked.Valid {
			value := parseTime(checked.String)
			item.LastCheckedAt = &value
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
func (service *SiteService) CreateFriend(ctx context.Context, input FriendLinkInput) (FriendLink, error) {
	if err := validateFriend(input); err != nil {
		return FriendLink{}, err
	}
	now := time.Now().UTC()
	item := FriendLink{ID: newID(), Name: strings.TrimSpace(input.Name), URL: strings.TrimSpace(input.URL), AvatarURL: strings.TrimSpace(input.AvatarURL), Description: strings.TrimSpace(input.Description), GroupName: strings.TrimSpace(input.GroupName), SortOrder: input.SortOrder, Enabled: input.Enabled, CreatedAt: now, UpdatedAt: now}
	_, err := service.database.ExecContext(ctx, `INSERT INTO friend_links (id,name,url,avatar_url,description,group_name,sort_order,enabled,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`, item.ID, item.Name, item.URL, item.AvatarURL, item.Description, item.GroupName, item.SortOrder, boolInt(item.Enabled), now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano))
	if err != nil {
		return FriendLink{}, mapConstraint(err)
	}
	return item, nil
}
func (service *SiteService) UpdateFriend(ctx context.Context, id string, input FriendLinkInput) (FriendLink, error) {
	if err := validateFriend(input); err != nil {
		return FriendLink{}, err
	}
	now := time.Now().UTC()
	result, err := service.database.ExecContext(ctx, `UPDATE friend_links SET name=?,url=?,avatar_url=?,description=?,group_name=?,sort_order=?,enabled=?,updated_at=? WHERE id=?`, strings.TrimSpace(input.Name), strings.TrimSpace(input.URL), strings.TrimSpace(input.AvatarURL), strings.TrimSpace(input.Description), strings.TrimSpace(input.GroupName), input.SortOrder, boolInt(input.Enabled), now.Format(time.RFC3339Nano), id)
	if err != nil {
		return FriendLink{}, mapConstraint(err)
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return FriendLink{}, ErrNotFound
	}
	return service.friend(ctx, id)
}
func (service *SiteService) DeleteFriend(ctx context.Context, id string) error {
	result, err := service.database.ExecContext(ctx, `DELETE FROM friend_links WHERE id=?`, id)
	if err != nil {
		return err
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return ErrNotFound
	}
	return nil
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
	rows, err := service.database.QueryContext(ctx, `SELECT id,parent_id,label,href,sort_order,enabled FROM navigation_items ORDER BY sort_order,label`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]NavigationItem, 0)
	for rows.Next() {
		var item NavigationItem
		var parent sql.NullString
		var enabled int
		if err := rows.Scan(&item.ID, &parent, &item.Label, &item.Href, &item.SortOrder, &enabled); err != nil {
			return nil, err
		}
		if parent.Valid {
			item.ParentID = &parent.String
		}
		item.Enabled = enabled == 1
		items = append(items, item)
	}
	return buildNavigation(items), rows.Err()
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
	tx, err := service.database.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, `DELETE FROM navigation_items`); err != nil {
		return nil, err
	}
	now := time.Now().UTC().Format(time.RFC3339Nano)
	for _, input := range inputs {
		id := input.ID
		if id == "" {
			id = newID()
		}
		if _, err := tx.ExecContext(ctx, `INSERT INTO navigation_items (id,parent_id,label,href,sort_order,enabled,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`, id, nullableString(input.ParentID), strings.TrimSpace(input.Label), strings.TrimSpace(input.Href), input.SortOrder, boolInt(input.Enabled), now, now); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(); err != nil {
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
