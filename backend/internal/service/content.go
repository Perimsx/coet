package service

import (
	"context"
	"encoding/json"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/kerntau/blog/cms-api/internal/domain"
	"github.com/kerntau/blog/cms-api/internal/filestore"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9]+)?(?:/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9]+)?)*$`)

type Pagination struct{ Page, PageSize int }
type PostFilters struct {
	Pagination
	Keyword, Status, Language, CategoryID, TagID string
}
type PostInput struct {
	Title          string     `json:"title"`
	Slug           string     `json:"slug"`
	Summary        string     `json:"summary"`
	Content        string     `json:"content"`
	CoverURL       string     `json:"coverUrl"`
	Language       string     `json:"language"`
	CategoryID     *string    `json:"categoryId"`
	TagIDs         []string   `json:"tagIds"`
	SEOTitle       string     `json:"seoTitle"`
	SEODescription string     `json:"seoDescription"`
	ScheduledAt    *time.Time `json:"scheduledAt"`
}
type CategoryInput struct {
	Slug        string `json:"slug"`
	LabelZH     string `json:"labelZh"`
	LabelEN     string `json:"labelEn"`
	Description string `json:"description"`
	SortOrder   int    `json:"sortOrder"`
	Enabled     bool   `json:"enabled"`
}
type TagInput struct {
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type PostService struct {
	store *filestore.Store
	audit *AuditService
}

func NewPostService(store *filestore.Store, audit *AuditService) *PostService {
	return &PostService{store: store, audit: audit}
}

func (service *PostService) Create(ctx context.Context, input PostInput) (domain.Post, error) {
	if err := validatePostInput(input); err != nil {
		return domain.Post{}, err
	}
	posts, tagMap, err := service.store.ReadPosts()
	if err != nil {
		return domain.Post{}, err
	}
	slug := normalizeSlug(input.Slug)
	for _, p := range posts {
		if p.Slug == slug {
			return domain.Post{}, ErrConflict
		}
	}

	now := time.Now().UTC()
	post := domain.Post{
		ID:             newID(),
		Title:          strings.TrimSpace(input.Title),
		Slug:           slug,
		Summary:        strings.TrimSpace(input.Summary),
		Content:        input.Content,
		CoverURL:       strings.TrimSpace(input.CoverURL),
		Language:       normalizeLanguage(input.Language),
		Status:         domain.PostStatusDraft,
		CategoryID:     input.CategoryID,
		SEOTitle:       strings.TrimSpace(input.SEOTitle),
		SEODescription: strings.TrimSpace(input.SEODescription),
		ScheduledAt:    input.ScheduledAt,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	tagIDs := input.TagIDs
	if tagIDs == nil {
		tagIDs = []string{}
	}

	if err := service.store.WritePost(post, tagIDs); err != nil {
		return domain.Post{}, err
	}
	_ = tagMap

	return service.Get(ctx, post.ID)
}

func (service *PostService) List(ctx context.Context, filters PostFilters) ([]domain.Post, int, error) {
	posts, tagMap, err := service.store.ReadPosts()
	if err != nil {
		return nil, 0, err
	}

	categories, _ := service.ListCategories(ctx)
	catMap := make(map[string]domain.Category)
	for _, c := range categories {
		catMap[c.ID] = c
	}
	tags, _ := service.ListTags(ctx)
	tmap := make(map[string]domain.Tag)
	for _, t := range tags {
		tmap[t.ID] = t
	}

	var filtered []domain.Post
	for _, p := range posts {
		if filters.Status != "" && string(p.Status) != filters.Status {
			continue
		}
		if filters.Status == "" && p.Status == domain.PostStatusTrash {
			continue
		}
		if filters.Language != "" && p.Language != filters.Language {
			continue
		}
		if filters.CategoryID != "" && (p.CategoryID == nil || *p.CategoryID != filters.CategoryID) {
			continue
		}
		if filters.TagID != "" {
			tids := tagMap[p.ID]
			hasTag := false
			for _, tid := range tids {
				if tid == filters.TagID {
					hasTag = true
					break
				}
			}
			if !hasTag {
				continue
			}
		}
		if filters.Keyword != "" {
			kw := strings.ToLower(filters.Keyword)
			if !strings.Contains(strings.ToLower(p.Title), kw) && !strings.Contains(strings.ToLower(p.Summary), kw) && !strings.Contains(strings.ToLower(p.Content), kw) {
				continue
			}
		}

		if p.CategoryID != nil {
			if cat, ok := catMap[*p.CategoryID]; ok {
				p.CategoryName = cat.LabelZH
			}
		}
		ptags := make([]domain.Tag, 0)
		for _, tid := range tagMap[p.ID] {
			if t, ok := tmap[tid]; ok {
				ptags = append(ptags, t)
			}
		}
		p.Tags = ptags

		filtered = append(filtered, p)
	}

	total := len(filtered)
	if filters.Page <= 0 {
		filters.Page = 1
	}
	if filters.PageSize <= 0 {
		filters.PageSize = 20
	}

	start := (filters.Page - 1) * filters.PageSize
	if start >= total {
		return []domain.Post{}, total, nil
	}
	end := start + filters.PageSize
	if end > total {
		end = total
	}

	return filtered[start:end], total, nil
}

func (service *PostService) Get(ctx context.Context, id string) (domain.Post, error) {
	posts, tagMap, err := service.store.ReadPosts()
	if err != nil {
		return domain.Post{}, err
	}
	categories, _ := service.ListCategories(ctx)
	catMap := make(map[string]domain.Category)
	for _, c := range categories {
		catMap[c.ID] = c
	}
	tags, _ := service.ListTags(ctx)
	tmap := make(map[string]domain.Tag)
	for _, t := range tags {
		tmap[t.ID] = t
	}

	for _, p := range posts {
		if p.ID == id {
			if p.CategoryID != nil {
				if cat, ok := catMap[*p.CategoryID]; ok {
					p.CategoryName = cat.LabelZH
				}
			}
			ptags := make([]domain.Tag, 0)
			for _, tid := range tagMap[p.ID] {
				if t, ok := tmap[tid]; ok {
					ptags = append(ptags, t)
				}
			}
			p.Tags = ptags
			return p, nil
		}
	}
	return domain.Post{}, ErrNotFound
}

func (service *PostService) Update(ctx context.Context, id string, input PostInput) (domain.Post, error) {
	if err := validatePostInput(input); err != nil {
		return domain.Post{}, err
	}
	post, err := service.Get(ctx, id)
	if err != nil {
		return domain.Post{}, err
	}

	posts, _, _ := service.store.ReadPosts()
	slug := normalizeSlug(input.Slug)
	for _, p := range posts {
		if p.ID != id && p.Slug == slug {
			return domain.Post{}, ErrConflict
		}
	}

	oldSlug := post.Slug
	post.Title = strings.TrimSpace(input.Title)
	post.Slug = slug
	post.Summary = strings.TrimSpace(input.Summary)
	post.Content = input.Content
	post.CoverURL = strings.TrimSpace(input.CoverURL)
	post.Language = normalizeLanguage(input.Language)
	post.CategoryID = input.CategoryID
	post.SEOTitle = strings.TrimSpace(input.SEOTitle)
	post.SEODescription = strings.TrimSpace(input.SEODescription)
	post.ScheduledAt = input.ScheduledAt
	post.UpdatedAt = time.Now().UTC()

	if oldSlug != slug {
		_ = service.store.DeletePostFile(oldSlug)
	}

	tagIDs := input.TagIDs
	if tagIDs == nil {
		tagIDs = []string{}
	}

	if err := service.store.WritePost(post, tagIDs); err != nil {
		return domain.Post{}, err
	}

	return service.Get(ctx, id)
}

func (service *PostService) Trash(ctx context.Context, id string) (domain.Post, error) {
	post, err := service.Get(ctx, id)
	if err != nil {
		return domain.Post{}, err
	}
	_, tagMap, _ := service.store.ReadPosts()
	now := time.Now().UTC()
	post.Status = domain.PostStatusTrash
	post.DeletedAt = &now
	post.UpdatedAt = now
	if err := service.store.WritePost(post, tagMap[id]); err != nil {
		return domain.Post{}, err
	}
	return service.Get(ctx, id)
}

type PostRevision struct {
	ID             string    `json:"id"`
	PostID         string    `json:"postId"`
	Title          string    `json:"title"`
	Slug           string    `json:"slug"`
	Summary        string    `json:"summary"`
	Content        string    `json:"content"`
	CoverURL       string    `json:"coverUrl"`
	Language       string    `json:"language"`
	CategoryID     *string   `json:"categoryId,omitempty"`
	SEOTitle       string    `json:"seoTitle"`
	SEODescription string    `json:"seoDescription"`
	CreatedAt      time.Time `json:"createdAt"`
}

func (service *PostService) Revisions(ctx context.Context, postID string) ([]PostRevision, error) {
	return []PostRevision{}, nil
}

func (service *PostService) RestoreRevision(ctx context.Context, postID, revisionID string) (domain.Post, error) {
	return service.Get(ctx, postID)
}

func (service *PostService) Delete(ctx context.Context, id string) error {
	post, err := service.Get(ctx, id)
	if err != nil {
		return err
	}
	return service.store.DeletePostFile(post.Slug)
}

func (service *PostService) Publish(ctx context.Context, id string) (domain.Post, error) {
	post, err := service.Get(ctx, id)
	if err != nil {
		return domain.Post{}, err
	}
	_, tagMap, _ := service.store.ReadPosts()
	now := time.Now().UTC()
	post.Status = domain.PostStatusPublished
	post.PublishedAt = &now
	post.UpdatedAt = now
	if err := service.store.WritePost(post, tagMap[id]); err != nil {
		return domain.Post{}, err
	}
	return service.Get(ctx, id)
}

func (service *PostService) Unpublish(ctx context.Context, id string) (domain.Post, error) {
	post, err := service.Get(ctx, id)
	if err != nil {
		return domain.Post{}, err
	}
	_, tagMap, _ := service.store.ReadPosts()
	now := time.Now().UTC()
	post.Status = domain.PostStatusUnpublished
	post.UpdatedAt = now
	if err := service.store.WritePost(post, tagMap[id]); err != nil {
		return domain.Post{}, err
	}
	return service.Get(ctx, id)
}

func (service *PostService) Restore(ctx context.Context, id string) (domain.Post, error) {
	post, err := service.Get(ctx, id)
	if err != nil {
		return domain.Post{}, err
	}
	_, tagMap, _ := service.store.ReadPosts()
	now := time.Now().UTC()
	post.Status = domain.PostStatusDraft
	post.DeletedAt = nil
	post.UpdatedAt = now
	if err := service.store.WritePost(post, tagMap[id]); err != nil {
		return domain.Post{}, err
	}
	return service.Get(ctx, id)
}

// -----------------------------------------------------------------------------
// 分类 (Categories) & 标签 (Tags)
// -----------------------------------------------------------------------------

func (service *PostService) ListCategories(ctx context.Context) ([]domain.Category, error) {
	var items []domain.Category
	_ = service.store.ReadJSON("categories.json", &items)
	if items == nil {
		items = make([]domain.Category, 0)
	}
	sort.SliceStable(items, func(i, j int) bool {
		return items[i].SortOrder < items[j].SortOrder
	})
	return items, nil
}

func (service *PostService) CreateCategory(ctx context.Context, input CategoryInput) (domain.Category, error) {
	if err := validateCategoryInput(input); err != nil {
		return domain.Category{}, err
	}
	items, _ := service.ListCategories(ctx)
	slug := normalizeSlug(input.Slug)
	for _, c := range items {
		if c.Slug == slug {
			return domain.Category{}, ErrConflict
		}
	}
	now := time.Now().UTC()
	cat := domain.Category{
		ID:          newID(),
		Slug:        slug,
		LabelZH:     strings.TrimSpace(input.LabelZH),
		LabelEN:     strings.TrimSpace(input.LabelEN),
		Description: strings.TrimSpace(input.Description),
		SortOrder:   input.SortOrder,
		Enabled:     input.Enabled,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	items = append(items, cat)
	if err := service.saveCategories(items); err != nil {
		return domain.Category{}, err
	}
	return cat, nil
}

func (service *PostService) UpdateCategory(ctx context.Context, id string, input CategoryInput) (domain.Category, error) {
	if err := validateCategoryInput(input); err != nil {
		return domain.Category{}, err
	}
	items, _ := service.ListCategories(ctx)
	slug := normalizeSlug(input.Slug)
	found := false
	var updated domain.Category
	now := time.Now().UTC()

	for i := range items {
		if items[i].ID != id && items[i].Slug == slug {
			return domain.Category{}, ErrConflict
		}
		if items[i].ID == id {
			items[i].Slug = slug
			items[i].LabelZH = strings.TrimSpace(input.LabelZH)
			items[i].LabelEN = strings.TrimSpace(input.LabelEN)
			items[i].Description = strings.TrimSpace(input.Description)
			items[i].SortOrder = input.SortOrder
			items[i].Enabled = input.Enabled
			items[i].UpdatedAt = now
			updated = items[i]
			found = true
		}
	}
	if !found {
		return domain.Category{}, ErrNotFound
	}
	if err := service.saveCategories(items); err != nil {
		return domain.Category{}, err
	}
	return updated, nil
}

func (service *PostService) DeleteCategory(ctx context.Context, id string, reassignCategoryID string) error {
	items, _ := service.ListCategories(ctx)
	var newItems []domain.Category
	found := false
	for _, c := range items {
		if c.ID == id {
			found = true
			continue
		}
		newItems = append(newItems, c)
	}
	if !found {
		return ErrNotFound
	}
	return service.saveCategories(newItems)
}

func (service *PostService) ListTags(ctx context.Context) ([]domain.Tag, error) {
	var items []domain.Tag
	_ = service.store.ReadJSON("tags.json", &items)
	if items == nil {
		items = make([]domain.Tag, 0)
	}
	return items, nil
}

func (service *PostService) CreateTag(ctx context.Context, input TagInput) (domain.Tag, error) {
	if err := validateTagInput(input); err != nil {
		return domain.Tag{}, err
	}
	items, _ := service.ListTags(ctx)
	slug := normalizeSlug(input.Slug)
	for _, t := range items {
		if t.Slug == slug {
			return domain.Tag{}, ErrConflict
		}
	}
	now := time.Now().UTC()
	tag := domain.Tag{
		ID:          newID(),
		Slug:        slug,
		Name:        strings.TrimSpace(input.Name),
		Description: strings.TrimSpace(input.Description),
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	items = append(items, tag)
	if err := service.saveTags(items); err != nil {
		return domain.Tag{}, err
	}
	return tag, nil
}

func (service *PostService) UpdateTag(ctx context.Context, id string, input TagInput) (domain.Tag, error) {
	if err := validateTagInput(input); err != nil {
		return domain.Tag{}, err
	}
	items, _ := service.ListTags(ctx)
	slug := normalizeSlug(input.Slug)
	found := false
	var updated domain.Tag
	now := time.Now().UTC()

	for i := range items {
		if items[i].ID != id && items[i].Slug == slug {
			return domain.Tag{}, ErrConflict
		}
		if items[i].ID == id {
			items[i].Slug = slug
			items[i].Name = strings.TrimSpace(input.Name)
			items[i].Description = strings.TrimSpace(input.Description)
			items[i].UpdatedAt = now
			updated = items[i]
			found = true
		}
	}
	if !found {
		return domain.Tag{}, ErrNotFound
	}
	if err := service.saveTags(items); err != nil {
		return domain.Tag{}, err
	}
	return updated, nil
}



func (service *PostService) saveCategories(items []domain.Category) error {
	if err := service.store.WriteJSON("categories.json", items); err != nil {
		return err
	}
	storagePath := filepath.Join(filepath.Dir(service.store.ContentDir()), "storage", "settings", "categories.json")
	if err := os.MkdirAll(filepath.Dir(storagePath), 0755); err == nil {
		raw, _ := json.MarshalIndent(items, "", "  ")
		_ = os.WriteFile(storagePath, append(raw, '\n'), 0644)
	}

	labelsMap := make(map[string]map[string]string)
	for _, c := range items {
		if c.Slug != "" {
			zh := c.LabelZH
			if zh == "" {
				zh = c.Slug
			}
			en := c.LabelEN
			if en == "" {
				en = c.Slug
			}
			labelsMap[c.Slug] = map[string]string{
				"zh": zh,
				"en": en,
			}
		}
	}

	genLabelsPath := filepath.Join(filepath.Dir(service.store.ContentDir()), "src", "generated", "content", "category-labels.json")
	if err := os.MkdirAll(filepath.Dir(genLabelsPath), 0755); err == nil {
		raw, _ := json.MarshalIndent(labelsMap, "", "  ")
		_ = os.WriteFile(genLabelsPath, append(raw, '\n'), 0644)
	}

	return nil
}

func (service *PostService) saveTags(items []domain.Tag) error {
	if err := service.store.WriteJSON("tags.json", items); err != nil {
		return err
	}
	storagePath := filepath.Join(filepath.Dir(service.store.ContentDir()), "storage", "settings", "tags.json")
	if err := os.MkdirAll(filepath.Dir(storagePath), 0755); err == nil {
		raw, _ := json.MarshalIndent(items, "", "  ")
		_ = os.WriteFile(storagePath, append(raw, '\n'), 0644)
	}
	return nil
}

func (service *PostService) DeleteTag(ctx context.Context, id string) error {
	items, _ := service.ListTags(ctx)
	var newItems []domain.Tag
	found := false
	for _, t := range items {
		if t.ID == id {
			found = true
			continue
		}
		newItems = append(newItems, t)
	}
	if !found {
		return ErrNotFound
	}
	return service.store.WriteJSON("tags.json", newItems)
}

// -----------------------------------------------------------------------------
// 页面服务 (PageService)
// -----------------------------------------------------------------------------

type PageInput struct {
	Title          string `json:"title"`
	Slug           string `json:"slug"`
	Content        string `json:"content"`
	SEOTitle       string `json:"seoTitle"`
	SEODescription string `json:"seoDescription"`
}

type PageService struct {
	store *filestore.Store
	audit *AuditService
}

func NewPageService(store *filestore.Store, audit *AuditService) *PageService {
	return &PageService{store: store, audit: audit}
}

func (service *PageService) Create(ctx context.Context, input PageInput) (domain.Page, error) {
	if err := validatePageInput(input); err != nil {
		return domain.Page{}, err
	}
	pages, err := service.store.ReadPages()
	if err != nil {
		return domain.Page{}, err
	}
	slug := normalizeSlug(input.Slug)
	for _, p := range pages {
		if p.Slug == slug {
			return domain.Page{}, ErrConflict
		}
	}

	now := time.Now().UTC()
	page := domain.Page{
		ID:             newID(),
		Title:          strings.TrimSpace(input.Title),
		Slug:           slug,
		Content:        input.Content,
		Status:         domain.PostStatusDraft,
		SEOTitle:       strings.TrimSpace(input.SEOTitle),
		SEODescription: strings.TrimSpace(input.SEODescription),
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := service.store.WritePage(page); err != nil {
		return domain.Page{}, err
	}

	return service.Get(ctx, page.ID)
}

func (service *PageService) List(ctx context.Context) ([]domain.Page, error) {
	return service.store.ReadPages()
}

func (service *PageService) Get(ctx context.Context, id string) (domain.Page, error) {
	pages, err := service.store.ReadPages()
	if err != nil {
		return domain.Page{}, err
	}
	for _, p := range pages {
		if p.ID == id {
			return p, nil
		}
	}
	return domain.Page{}, ErrNotFound
}

func (service *PageService) GetBySlug(ctx context.Context, slug string) (domain.Page, error) {
	pages, err := service.store.ReadPages()
	if err != nil {
		return domain.Page{}, err
	}
	norm := normalizeSlug(slug)
	for _, p := range pages {
		if p.Slug == norm {
			return p, nil
		}
	}
	return domain.Page{}, ErrNotFound
}

func (service *PageService) Update(ctx context.Context, id string, input PageInput) (domain.Page, error) {
	if err := validatePageInput(input); err != nil {
		return domain.Page{}, err
	}
	page, err := service.Get(ctx, id)
	if err != nil {
		return domain.Page{}, err
	}

	pages, _ := service.store.ReadPages()
	slug := normalizeSlug(input.Slug)
	for _, p := range pages {
		if p.ID != id && p.Slug == slug {
			return domain.Page{}, ErrConflict
		}
	}

	page.Title = strings.TrimSpace(input.Title)
	page.Slug = slug
	page.Content = input.Content
	page.SEOTitle = strings.TrimSpace(input.SEOTitle)
	page.SEODescription = strings.TrimSpace(input.SEODescription)
	page.UpdatedAt = time.Now().UTC()

	if err := service.store.WritePage(page); err != nil {
		return domain.Page{}, err
	}

	return service.Get(ctx, id)
}

func (service *PageService) Trash(ctx context.Context, id string) error {
	page, err := service.Get(ctx, id)
	if err != nil {
		return err
	}
	page.Status = domain.PostStatusTrash
	page.UpdatedAt = time.Now().UTC()
	return service.store.WritePage(page)
}

func (service *PageService) Publish(ctx context.Context, id string) (domain.Page, error) {
	page, err := service.Get(ctx, id)
	if err != nil {
		return domain.Page{}, err
	}
	now := time.Now().UTC()
	page.Status = domain.PostStatusPublished
	page.PublishedAt = &now
	page.UpdatedAt = now
	if err := service.store.WritePage(page); err != nil {
		return domain.Page{}, err
	}
	return service.Get(ctx, id)
}

func (service *PageService) Unpublish(ctx context.Context, id string) (domain.Page, error) {
	page, err := service.Get(ctx, id)
	if err != nil {
		return domain.Page{}, err
	}
	now := time.Now().UTC()
	page.Status = domain.PostStatusUnpublished
	page.UpdatedAt = now
	if err := service.store.WritePage(page); err != nil {
		return domain.Page{}, err
	}
	return service.Get(ctx, id)
}

// -----------------------------------------------------------------------------
// 辅助校验函数
// -----------------------------------------------------------------------------

func validatePostInput(input PostInput) error {
	if strings.TrimSpace(input.Title) == "" || len(input.Title) > 300 {
		return ErrInvalidInput
	}
	if !slugPattern.MatchString(normalizeSlug(input.Slug)) {
		return ErrInvalidInput
	}
	if input.CoverURL != "" && !validExternalURL(input.CoverURL) {
		return ErrInvalidInput
	}
	return nil
}

func validateCategoryInput(input CategoryInput) error {
	if strings.TrimSpace(input.LabelZH) == "" || len(input.LabelZH) > 100 {
		return ErrInvalidInput
	}
	if !slugPattern.MatchString(normalizeSlug(input.Slug)) {
		return ErrInvalidInput
	}
	return nil
}

func validateTagInput(input TagInput) error {
	if strings.TrimSpace(input.Name) == "" || len(input.Name) > 100 {
		return ErrInvalidInput
	}
	if !slugPattern.MatchString(normalizeSlug(input.Slug)) {
		return ErrInvalidInput
	}
	return nil
}

func validatePageInput(input PageInput) error {
	if strings.TrimSpace(input.Title) == "" || len(input.Title) > 300 {
		return ErrInvalidInput
	}
	if !slugPattern.MatchString(normalizeSlug(input.Slug)) {
		return ErrInvalidInput
	}
	return nil
}

func normalizeSlug(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	value = strings.Trim(value, "/")
	if unquoted, err := url.PathUnescape(value); err == nil {
		value = unquoted
	}
	return value
}

func normalizeLanguage(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "en" {
		return "en"
	}
	return "zh"
}
