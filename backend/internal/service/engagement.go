package service

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"github.com/kerntau/blog/cms-api/internal/domain"
)

type PageInput struct {
	Title          string `json:"title"`
	Slug           string `json:"slug"`
	Content        string `json:"content"`
	SEOTitle       string `json:"seoTitle"`
	SEODescription string `json:"seoDescription"`
}
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
type EngagementService struct{ database *sql.DB }

func NewEngagementService(database *sql.DB) *EngagementService {
	return &EngagementService{database: database}
}
func (service *EngagementService) ListPages(ctx context.Context, page, pageSize int) ([]domain.Page, int, error) {
	var total int
	if err := service.database.QueryRowContext(ctx, `SELECT COUNT(*) FROM pages WHERE deleted_at IS NULL`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := service.database.QueryContext(ctx, `SELECT id,title,slug,content,status,seo_title,seo_description,published_at,created_at,updated_at FROM pages WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT ? OFFSET ?`, pageSize, (page-1)*pageSize)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	items := make([]domain.Page, 0)
	for rows.Next() {
		item, err := scanPage(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	return items, total, rows.Err()
}
func (service *EngagementService) GetPage(ctx context.Context, id string) (domain.Page, error) {
	item, err := scanPage(service.database.QueryRowContext(ctx, `SELECT id,title,slug,content,status,seo_title,seo_description,published_at,created_at,updated_at FROM pages WHERE id=? AND deleted_at IS NULL`, id))
	if err == sql.ErrNoRows {
		return domain.Page{}, ErrNotFound
	}
	return item, err
}
func (service *EngagementService) CreatePage(ctx context.Context, input PageInput) (domain.Page, error) {
	if err := validatePage(input); err != nil {
		return domain.Page{}, err
	}
	now := time.Now().UTC()
	item := domain.Page{ID: newID(), Title: strings.TrimSpace(input.Title), Slug: normalizeSlug(input.Slug), Content: input.Content, Status: domain.PostStatusDraft, SEOTitle: strings.TrimSpace(input.SEOTitle), SEODescription: strings.TrimSpace(input.SEODescription), CreatedAt: now, UpdatedAt: now}
	_, err := service.database.ExecContext(ctx, `INSERT INTO pages (id,title,slug,content,status,seo_title,seo_description,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`, item.ID, item.Title, item.Slug, item.Content, item.Status, item.SEOTitle, item.SEODescription, now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano))
	if err != nil {
		return domain.Page{}, mapConstraint(err)
	}
	return item, nil
}
func (service *EngagementService) UpdatePage(ctx context.Context, id string, input PageInput) (domain.Page, error) {
	if err := validatePage(input); err != nil {
		return domain.Page{}, err
	}
	result, err := service.database.ExecContext(ctx, `UPDATE pages SET title=?,slug=?,content=?,seo_title=?,seo_description=?,updated_at=? WHERE id=? AND deleted_at IS NULL`, strings.TrimSpace(input.Title), normalizeSlug(input.Slug), input.Content, strings.TrimSpace(input.SEOTitle), strings.TrimSpace(input.SEODescription), time.Now().UTC().Format(time.RFC3339Nano), id)
	if err != nil {
		return domain.Page{}, mapConstraint(err)
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return domain.Page{}, ErrNotFound
	}
	return service.GetPage(ctx, id)
}
func (service *EngagementService) SetPageStatus(ctx context.Context, id string, status domain.PostStatus) (domain.Page, error) {
	if status != domain.PostStatusDraft && status != domain.PostStatusPublished && status != domain.PostStatusUnpublished && status != domain.PostStatusTrash {
		return domain.Page{}, ErrInvalidInput
	}
	now := time.Now().UTC()
	var published interface{} = nil
	var deleted interface{} = nil
	if status == domain.PostStatusPublished {
		published = now.Format(time.RFC3339Nano)
	}
	if status == domain.PostStatusTrash {
		deleted = now.Format(time.RFC3339Nano)
	}
	result, err := service.database.ExecContext(ctx, `UPDATE pages SET status=?,published_at=COALESCE(?,published_at),deleted_at=?,updated_at=? WHERE id=?`, status, published, deleted, now.Format(time.RFC3339Nano), id)
	if err != nil {
		return domain.Page{}, err
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return domain.Page{}, ErrNotFound
	}
	if status == domain.PostStatusTrash {
		return domain.Page{ID: id, Status: status}, nil
	}
	return service.GetPage(ctx, id)
}
func (service *EngagementService) ListComments(ctx context.Context, status string, page, pageSize int) ([]Comment, int, error) {
	where := ""
	args := []interface{}{}
	if status != "" {
		where = " WHERE status=?"
		args = append(args, status)
	}
	var total int
	if err := service.database.QueryRowContext(ctx, `SELECT COUNT(*) FROM comments`+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, pageSize, (page-1)*pageSize)
	rows, err := service.database.QueryContext(ctx, `SELECT id,post_id,parent_id,author_name,author_email,content,status,created_at,updated_at FROM comments`+where+` ORDER BY created_at DESC LIMIT ? OFFSET ?`, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	items := make([]Comment, 0)
	for rows.Next() {
		var item Comment
		var parent sql.NullString
		var created, updated string
		if err := rows.Scan(&item.ID, &item.PostID, &parent, &item.AuthorName, &item.AuthorEmail, &item.Content, &item.Status, &created, &updated); err != nil {
			return nil, 0, err
		}
		if parent.Valid {
			item.ParentID = &parent.String
		}
		item.CreatedAt = parseTime(created)
		item.UpdatedAt = parseTime(updated)
		items = append(items, item)
	}
	return items, total, rows.Err()
}
func (service *EngagementService) SetCommentStatus(ctx context.Context, id, status string) error {
	if status != "approved" && status != "hidden" && status != "spam" && status != "deleted" {
		return ErrInvalidInput
	}
	result, err := service.database.ExecContext(ctx, `UPDATE comments SET status=?,updated_at=? WHERE id=?`, status, time.Now().UTC().Format(time.RFC3339Nano), id)
	if err != nil {
		return err
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return ErrNotFound
	}
	return nil
}
func (service *EngagementService) ListSuggestions(ctx context.Context, status string, page, pageSize int) ([]Suggestion, int, error) {
	where := ""
	args := []interface{}{}
	if status != "" {
		where = " WHERE status=?"
		args = append(args, status)
	}
	var total int
	if err := service.database.QueryRowContext(ctx, `SELECT COUNT(*) FROM suggestions`+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, pageSize, (page-1)*pageSize)
	rows, err := service.database.QueryContext(ctx, `SELECT id,contact,content,status,created_at,updated_at FROM suggestions`+where+` ORDER BY created_at DESC LIMIT ? OFFSET ?`, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	items := make([]Suggestion, 0)
	for rows.Next() {
		var item Suggestion
		var created, updated string
		if err := rows.Scan(&item.ID, &item.Contact, &item.Content, &item.Status, &created, &updated); err != nil {
			return nil, 0, err
		}
		item.CreatedAt = parseTime(created)
		item.UpdatedAt = parseTime(updated)
		items = append(items, item)
	}
	return items, total, rows.Err()
}
func (service *EngagementService) SetSuggestionStatus(ctx context.Context, id, status string) error {
	if status != "unread" && status != "read" && status != "archived" && status != "deleted" {
		return ErrInvalidInput
	}
	result, err := service.database.ExecContext(ctx, `UPDATE suggestions SET status=?,updated_at=? WHERE id=?`, status, time.Now().UTC().Format(time.RFC3339Nano), id)
	if err != nil {
		return err
	}
	count, _ := result.RowsAffected()
	if count == 0 {
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

type pageScanner interface{ Scan(...interface{}) error }

func scanPage(row pageScanner) (domain.Page, error) {
	var item domain.Page
	var published sql.NullString
	var created, updated string
	err := row.Scan(&item.ID, &item.Title, &item.Slug, &item.Content, &item.Status, &item.SEOTitle, &item.SEODescription, &published, &created, &updated)
	if err != nil {
		return domain.Page{}, err
	}
	item.PublishedAt = parseNullableTime(published)
	item.CreatedAt = parseTime(created)
	item.UpdatedAt = parseTime(updated)
	return item, nil
}
