package service

import (
	"context"
	"strings"
	"time"

	"github.com/kerntau/blog/cms-api/internal/database"
	"github.com/kerntau/blog/cms-api/internal/domain"
	"gorm.io/gorm"
)

type Comment struct {
	ID          string    `json:"id"`
	PostID      string    `json:"postId"`
	ParentID    *string   `json:"parentId,omitempty"`
	AuthorName  string    `json:"authorName"`
	AuthorEmail string    `json:"authorEmail"`
	Content     string    `json:"content"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Suggestion struct {
	ID        string    `json:"id"`
	Contact   string    `json:"contact"`
	Content   string    `json:"content"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type EngagementService struct {
	database *gorm.DB
}

func NewEngagementService(db *gorm.DB) *EngagementService {
	return &EngagementService{database: db}
}

func (service *EngagementService) ListPages(ctx context.Context, page, pageSize int) ([]domain.Page, int, error) {
	var total int64
	query := service.database.WithContext(ctx).Model(&database.PageModel{}).Where("deleted_at IS NULL")
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var records []database.PageModel
	if err := query.Order("updated_at DESC").Limit(pageSize).Offset((page - 1) * pageSize).Find(&records).Error; err != nil {
		return nil, 0, err
	}

	items := make([]domain.Page, 0, len(records))
	for _, r := range records {
		items = append(items, pageModelToDomain(r))
	}
	return items, int(total), nil
}

func (service *EngagementService) GetPage(ctx context.Context, id string) (domain.Page, error) {
	var record database.PageModel
	if err := service.database.WithContext(ctx).Where("id = ? AND deleted_at IS NULL", id).First(&record).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return domain.Page{}, ErrNotFound
		}
		return domain.Page{}, err
	}
	return pageModelToDomain(record), nil
}

func (service *EngagementService) CreatePage(ctx context.Context, input PageInput) (domain.Page, error) {
	if err := validatePage(input); err != nil {
		return domain.Page{}, err
	}
	now := time.Now().UTC()
	record := database.PageModel{
		ID:             newID(),
		Title:          strings.TrimSpace(input.Title),
		Slug:           normalizeSlug(input.Slug),
		Content:        input.Content,
		Status:         string(domain.PostStatusDraft),
		SEOTitle:       strings.TrimSpace(input.SEOTitle),
		SEODescription: strings.TrimSpace(input.SEODescription),
		CreatedAt:      now.Format(time.RFC3339Nano),
		UpdatedAt:      now.Format(time.RFC3339Nano),
	}
	if err := service.database.WithContext(ctx).Create(&record).Error; err != nil {
		return domain.Page{}, mapConstraint(err)
	}
	return pageModelToDomain(record), nil
}

func (service *EngagementService) UpdatePage(ctx context.Context, id string, input PageInput) (domain.Page, error) {
	if err := validatePage(input); err != nil {
		return domain.Page{}, err
	}
	res := service.database.WithContext(ctx).Model(&database.PageModel{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Updates(map[string]interface{}{
			"title":           strings.TrimSpace(input.Title),
			"slug":            normalizeSlug(input.Slug),
			"content":         input.Content,
			"seo_title":       strings.TrimSpace(input.SEOTitle),
			"seo_description": strings.TrimSpace(input.SEODescription),
			"updated_at":      time.Now().UTC().Format(time.RFC3339Nano),
		})
	if res.Error != nil {
		return domain.Page{}, mapConstraint(res.Error)
	}
	if res.RowsAffected == 0 {
		return domain.Page{}, ErrNotFound
	}
	return service.GetPage(ctx, id)
}

func (service *EngagementService) SetPageStatus(ctx context.Context, id string, status domain.PostStatus) (domain.Page, error) {
	if status != domain.PostStatusDraft && status != domain.PostStatusPublished && status != domain.PostStatusUnpublished && status != domain.PostStatusTrash {
		return domain.Page{}, ErrInvalidInput
	}
	now := time.Now().UTC()
	nowStr := now.Format(time.RFC3339Nano)

	updates := map[string]interface{}{
		"status":     string(status),
		"updated_at": nowStr,
	}
	if status == domain.PostStatusPublished {
		updates["published_at"] = gorm.Expr("COALESCE(published_at, ?)", nowStr)
	}
	if status == domain.PostStatusTrash {
		updates["deleted_at"] = nowStr
	}

	res := service.database.WithContext(ctx).Model(&database.PageModel{}).Where("id = ?", id).Updates(updates)
	if res.Error != nil {
		return domain.Page{}, res.Error
	}
	if res.RowsAffected == 0 {
		return domain.Page{}, ErrNotFound
	}
	if status == domain.PostStatusTrash {
		return domain.Page{ID: id, Status: status}, nil
	}
	return service.GetPage(ctx, id)
}

func (service *EngagementService) ListComments(ctx context.Context, status string, page, pageSize int) ([]Comment, int, error) {
	query := service.database.WithContext(ctx).Model(&database.Comment{})
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var records []database.Comment
	if err := query.Order("created_at DESC").Limit(pageSize).Offset((page - 1) * pageSize).Find(&records).Error; err != nil {
		return nil, 0, err
	}

	items := make([]Comment, 0, len(records))
	for _, r := range records {
		items = append(items, Comment{
			ID:          r.ID,
			PostID:      r.PostID,
			ParentID:    r.ParentID,
			AuthorName:  r.AuthorName,
			AuthorEmail: r.AuthorEmail,
			Content:     r.Content,
			Status:      r.Status,
			CreatedAt:   parseTime(r.CreatedAt),
			UpdatedAt:   parseTime(r.UpdatedAt),
		})
	}
	return items, int(total), nil
}

func (service *EngagementService) SetCommentStatus(ctx context.Context, id, status string) error {
	if status != "approved" && status != "hidden" && status != "spam" && status != "deleted" {
		return ErrInvalidInput
	}
	res := service.database.WithContext(ctx).Model(&database.Comment{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     status,
		"updated_at": time.Now().UTC().Format(time.RFC3339Nano),
	})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func (service *EngagementService) ListSuggestions(ctx context.Context, status string, page, pageSize int) ([]Suggestion, int, error) {
	query := service.database.WithContext(ctx).Model(&database.Suggestion{})
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var records []database.Suggestion
	if err := query.Order("created_at DESC").Limit(pageSize).Offset((page - 1) * pageSize).Find(&records).Error; err != nil {
		return nil, 0, err
	}

	items := make([]Suggestion, 0, len(records))
	for _, r := range records {
		items = append(items, Suggestion{
			ID:        r.ID,
			Contact:   r.Contact,
			Content:   r.Content,
			Status:    r.Status,
			CreatedAt: parseTime(r.CreatedAt),
			UpdatedAt: parseTime(r.UpdatedAt),
		})
	}
	return items, int(total), nil
}

func (service *EngagementService) SetSuggestionStatus(ctx context.Context, id, status string) error {
	if status != "unread" && status != "read" && status != "archived" && status != "deleted" {
		return ErrInvalidInput
	}
	res := service.database.WithContext(ctx).Model(&database.Suggestion{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     status,
		"updated_at": time.Now().UTC().Format(time.RFC3339Nano),
	})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func validatePage(input PageInput) error {
	if strings.TrimSpace(input.Title) == "" || !slugPattern.MatchString(normalizeSlug(input.Slug)) || len(input.Content) > 2_000_000 {
		return ErrInvalidInput
	}
	return nil
}

func pageModelToDomain(r database.PageModel) domain.Page {
	var pub *time.Time
	if r.PublishedAt != nil && *r.PublishedAt != "" {
		t := parseTime(*r.PublishedAt)
		pub = &t
	}
	return domain.Page{
		ID:             r.ID,
		Title:          r.Title,
		Slug:           r.Slug,
		Content:        r.Content,
		Status:         domain.PostStatus(r.Status),
		SEOTitle:       r.SEOTitle,
		SEODescription: r.SEODescription,
		PublishedAt:    pub,
		CreatedAt:      parseTime(r.CreatedAt),
		UpdatedAt:      parseTime(r.UpdatedAt),
	}
}
