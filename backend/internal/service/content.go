package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/kerntau/blog/cms-api/internal/domain"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9]+)?$`)

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
	database *sql.DB
	audit    *AuditService
}

func NewPostService(database *sql.DB, audit *AuditService) *PostService {
	return &PostService{database: database, audit: audit}
}

func (service *PostService) Create(ctx context.Context, input PostInput) (domain.Post, error) {
	if err := validatePostInput(input); err != nil {
		return domain.Post{}, err
	}
	now := time.Now().UTC()
	post := domain.Post{ID: newID(), Title: strings.TrimSpace(input.Title), Slug: normalizeSlug(input.Slug), Summary: strings.TrimSpace(input.Summary), Content: input.Content, CoverURL: strings.TrimSpace(input.CoverURL), Language: normalizeLanguage(input.Language), Status: domain.PostStatusDraft, CategoryID: input.CategoryID, SEOTitle: strings.TrimSpace(input.SEOTitle), SEODescription: strings.TrimSpace(input.SEODescription), ScheduledAt: input.ScheduledAt, CreatedAt: now, UpdatedAt: now}
	if _, err := service.database.ExecContext(ctx, `INSERT INTO posts (id,title,slug,summary,content,cover_url,language,status,category_id,seo_title,seo_description,scheduled_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, post.ID, post.Title, post.Slug, post.Summary, post.Content, post.CoverURL, post.Language, post.Status, nullableString(post.CategoryID), post.SEOTitle, post.SEODescription, nullableTime(post.ScheduledAt), now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano)); err != nil {
		return domain.Post{}, mapConstraint(err)
	}
	if err := service.setTags(ctx, post.ID, input.TagIDs); err != nil {
		return domain.Post{}, err
	}
	return service.Get(ctx, post.ID)
}

func (service *PostService) List(ctx context.Context, filters PostFilters) ([]domain.Post, int, error) {
	where, args := postWhere(filters)
	var total int
	if err := service.database.QueryRowContext(ctx, `SELECT COUNT(DISTINCT p.id) FROM posts p LEFT JOIN post_tags pt ON pt.post_id = p.id `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, filters.PageSize, (filters.Page-1)*filters.PageSize)
	rows, err := service.database.QueryContext(ctx, `SELECT DISTINCT p.id FROM posts p LEFT JOIN post_tags pt ON pt.post_id = p.id `+where+` ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	posts := make([]domain.Post, 0)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, 0, err
		}
		item, err := service.Get(ctx, id)
		if err != nil {
			return nil, 0, err
		}
		posts = append(posts, item)
	}
	return posts, total, rows.Err()
}

func (service *PostService) Get(ctx context.Context, id string) (domain.Post, error) {
	row := service.database.QueryRowContext(ctx, `SELECT p.id,p.title,p.slug,p.summary,p.content,p.cover_url,p.language,p.status,p.category_id,COALESCE(c.label_zh,''),p.seo_title,p.seo_description,p.published_at,p.scheduled_at,p.created_at,p.updated_at,p.deleted_at FROM posts p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=?`, id)
	post, err := scanPost(row)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Post{}, ErrNotFound
	}
	if err != nil {
		return domain.Post{}, err
	}
	tags, err := service.tags(ctx, id)
	if err != nil {
		return domain.Post{}, err
	}
	post.Tags = tags
	return post, nil
}

func (service *PostService) Update(ctx context.Context, id string, input PostInput) (domain.Post, error) {
	if err := validatePostInput(input); err != nil {
		return domain.Post{}, err
	}
	previous, err := service.Get(ctx, id)
	if err != nil {
		return domain.Post{}, err
	}
	if err := service.saveRevision(ctx, previous); err != nil {
		return domain.Post{}, err
	}
	now := time.Now().UTC()
	result, err := service.database.ExecContext(ctx, `UPDATE posts SET title=?,slug=?,summary=?,content=?,cover_url=?,language=?,category_id=?,seo_title=?,seo_description=?,scheduled_at=?,updated_at=? WHERE id=?`, strings.TrimSpace(input.Title), normalizeSlug(input.Slug), strings.TrimSpace(input.Summary), input.Content, strings.TrimSpace(input.CoverURL), normalizeLanguage(input.Language), nullableString(input.CategoryID), strings.TrimSpace(input.SEOTitle), strings.TrimSpace(input.SEODescription), nullableTime(input.ScheduledAt), now.Format(time.RFC3339Nano), id)
	if err != nil {
		return domain.Post{}, mapConstraint(err)
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return domain.Post{}, ErrNotFound
	}
	if err := service.setTags(ctx, id, input.TagIDs); err != nil {
		return domain.Post{}, err
	}
	return service.Get(ctx, id)
}

func (service *PostService) Publish(ctx context.Context, id string) (domain.Post, error) {
	post, err := service.Get(ctx, id)
	if err != nil {
		return domain.Post{}, err
	}
	if strings.TrimSpace(post.Content) == "" {
		return domain.Post{}, ErrInvalidInput
	}
	return service.setStatus(ctx, id, domain.PostStatusPublished, false)
}
func (service *PostService) Unpublish(ctx context.Context, id string) (domain.Post, error) {
	return service.setStatus(ctx, id, domain.PostStatusUnpublished, false)
}
func (service *PostService) Trash(ctx context.Context, id string) (domain.Post, error) {
	return service.setStatus(ctx, id, domain.PostStatusTrash, true)
}
func (service *PostService) Restore(ctx context.Context, id string) (domain.Post, error) {
	return service.setStatus(ctx, id, domain.PostStatusDraft, false)
}

func (service *PostService) setStatus(ctx context.Context, id string, status domain.PostStatus, deleted bool) (domain.Post, error) {
	previous, err := service.Get(ctx, id)
	if err != nil {
		return domain.Post{}, err
	}
	if err := service.saveRevision(ctx, previous); err != nil {
		return domain.Post{}, err
	}
	now := time.Now().UTC()
	var publishedAt interface{} = nil
	if status == domain.PostStatusPublished {
		publishedAt = now.Format(time.RFC3339Nano)
	}
	var deletedAt interface{} = nil
	if deleted {
		deletedAt = now.Format(time.RFC3339Nano)
	}
	result, err := service.database.ExecContext(ctx, `UPDATE posts SET status=?,published_at=COALESCE(?,published_at),deleted_at=?,updated_at=? WHERE id=?`, status, publishedAt, deletedAt, now.Format(time.RFC3339Nano), id)
	if err != nil {
		return domain.Post{}, err
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return domain.Post{}, ErrNotFound
	}
	return service.Get(ctx, id)
}

func (service *PostService) Revisions(ctx context.Context, id string) ([]domain.Post, error) {
	rows, err := service.database.QueryContext(ctx, `SELECT id,title,slug,summary,content,cover_url,language,category_id,seo_title,seo_description,created_at FROM post_revisions WHERE post_id=? ORDER BY created_at DESC`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	revisions := make([]domain.Post, 0)
	for rows.Next() {
		var item domain.Post
		var categoryID sql.NullString
		var createdAt string
		if err := rows.Scan(&item.ID, &item.Title, &item.Slug, &item.Summary, &item.Content, &item.CoverURL, &item.Language, &categoryID, &item.SEOTitle, &item.SEODescription, &createdAt); err != nil {
			return nil, err
		}
		if categoryID.Valid {
			item.CategoryID = &categoryID.String
		}
		item.CreatedAt, _ = time.Parse(time.RFC3339Nano, createdAt)
		revisions = append(revisions, item)
	}
	return revisions, rows.Err()
}

func (service *PostService) RestoreRevision(ctx context.Context, postID, revisionID string) (domain.Post, error) {
	var input PostInput
	var categoryID sql.NullString
	err := service.database.QueryRowContext(ctx, `SELECT title,slug,summary,content,cover_url,language,category_id,seo_title,seo_description FROM post_revisions WHERE id=? AND post_id=?`, revisionID, postID).Scan(&input.Title, &input.Slug, &input.Summary, &input.Content, &input.CoverURL, &input.Language, &categoryID, &input.SEOTitle, &input.SEODescription)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Post{}, ErrNotFound
	}
	if err != nil {
		return domain.Post{}, err
	}
	if categoryID.Valid {
		input.CategoryID = &categoryID.String
	}
	current, err := service.Get(ctx, postID)
	if err != nil {
		return domain.Post{}, err
	}
	input.TagIDs = tagIDs(current.Tags)
	return service.Update(ctx, postID, input)
}

func (service *PostService) saveRevision(ctx context.Context, post domain.Post) error {
	_, err := service.database.ExecContext(ctx, `INSERT INTO post_revisions (id,post_id,title,slug,summary,content,cover_url,language,category_id,seo_title,seo_description,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, newID(), post.ID, post.Title, post.Slug, post.Summary, post.Content, post.CoverURL, post.Language, nullableString(post.CategoryID), post.SEOTitle, post.SEODescription, time.Now().UTC().Format(time.RFC3339Nano))
	return err
}
func (service *PostService) tags(ctx context.Context, postID string) ([]domain.Tag, error) {
	rows, err := service.database.QueryContext(ctx, `SELECT t.id,t.slug,t.name,t.description,t.created_at,t.updated_at FROM tags t JOIN post_tags pt ON pt.tag_id=t.id WHERE pt.post_id=? ORDER BY t.name`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tags := make([]domain.Tag, 0)
	for rows.Next() {
		var item domain.Tag
		var created, updated string
		if err := rows.Scan(&item.ID, &item.Slug, &item.Name, &item.Description, &created, &updated); err != nil {
			return nil, err
		}
		item.CreatedAt, _ = time.Parse(time.RFC3339Nano, created)
		item.UpdatedAt, _ = time.Parse(time.RFC3339Nano, updated)
		tags = append(tags, item)
	}
	return tags, rows.Err()
}
func (service *PostService) setTags(ctx context.Context, postID string, tagIDs []string) error {
	tx, err := service.database.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err = tx.ExecContext(ctx, `DELETE FROM post_tags WHERE post_id=?`, postID); err != nil {
		return err
	}
	for _, tagID := range uniqueIDs(tagIDs) {
		var exists int
		if err = tx.QueryRowContext(ctx, `SELECT COUNT(*) FROM tags WHERE id=?`, tagID).Scan(&exists); err != nil {
			return err
		}
		if exists == 0 {
			return ErrNotFound
		}
		if _, err = tx.ExecContext(ctx, `INSERT INTO post_tags (post_id,tag_id) VALUES (?,?)`, postID, tagID); err != nil {
			return err
		}
	}
	return tx.Commit()
}

type CategoryService struct {
	database *sql.DB
	audit    *AuditService
}

func NewCategoryService(database *sql.DB, audit *AuditService) *CategoryService {
	return &CategoryService{database, audit}
}
func (service *CategoryService) List(ctx context.Context) ([]domain.Category, error) {
	rows, err := service.database.QueryContext(ctx, `SELECT c.id,c.slug,c.label_zh,c.label_en,c.description,c.sort_order,c.enabled,(SELECT COUNT(*) FROM posts p WHERE p.category_id=c.id AND p.deleted_at IS NULL),c.created_at,c.updated_at FROM categories c ORDER BY c.sort_order,c.label_zh`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]domain.Category, 0)
	for rows.Next() {
		var item domain.Category
		var enabled int
		var created, updated string
		if err := rows.Scan(&item.ID, &item.Slug, &item.LabelZH, &item.LabelEN, &item.Description, &item.SortOrder, &enabled, &item.PostCount, &created, &updated); err != nil {
			return nil, err
		}
		item.Enabled = enabled == 1
		item.CreatedAt, _ = time.Parse(time.RFC3339Nano, created)
		item.UpdatedAt, _ = time.Parse(time.RFC3339Nano, updated)
		items = append(items, item)
	}
	return items, rows.Err()
}
func (service *CategoryService) Create(ctx context.Context, input CategoryInput) (domain.Category, error) {
	if err := validateCategory(input); err != nil {
		return domain.Category{}, err
	}
	now := time.Now().UTC()
	item := domain.Category{ID: newID(), Slug: normalizeSlug(input.Slug), LabelZH: strings.TrimSpace(input.LabelZH), LabelEN: strings.TrimSpace(input.LabelEN), Description: strings.TrimSpace(input.Description), SortOrder: input.SortOrder, Enabled: input.Enabled, CreatedAt: now, UpdatedAt: now}
	_, err := service.database.ExecContext(ctx, `INSERT INTO categories (id,slug,label_zh,label_en,description,sort_order,enabled,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`, item.ID, item.Slug, item.LabelZH, item.LabelEN, item.Description, item.SortOrder, boolInt(item.Enabled), now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano))
	if err != nil {
		return domain.Category{}, mapConstraint(err)
	}
	return item, nil
}
func (service *CategoryService) Update(ctx context.Context, id string, input CategoryInput) (domain.Category, error) {
	if err := validateCategory(input); err != nil {
		return domain.Category{}, err
	}
	now := time.Now().UTC()
	result, err := service.database.ExecContext(ctx, `UPDATE categories SET slug=?,label_zh=?,label_en=?,description=?,sort_order=?,enabled=?,updated_at=? WHERE id=?`, normalizeSlug(input.Slug), strings.TrimSpace(input.LabelZH), strings.TrimSpace(input.LabelEN), strings.TrimSpace(input.Description), input.SortOrder, boolInt(input.Enabled), now.Format(time.RFC3339Nano), id)
	if err != nil {
		return domain.Category{}, mapConstraint(err)
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return domain.Category{}, ErrNotFound
	}
	return service.get(ctx, id)
}
func (service *CategoryService) Delete(ctx context.Context, id, replacementID string) error {
	tx, err := service.database.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var postCount int
	if err = tx.QueryRowContext(ctx, `SELECT COUNT(*) FROM posts WHERE category_id=? AND deleted_at IS NULL`, id).Scan(&postCount); err != nil {
		return err
	}
	if postCount > 0 && replacementID == "" {
		return ErrConflict
	}
	if replacementID != "" {
		if _, err = tx.ExecContext(ctx, `UPDATE posts SET category_id=?,updated_at=? WHERE category_id=?`, replacementID, time.Now().UTC().Format(time.RFC3339Nano), id); err != nil {
			return err
		}
	}
	result, err := tx.ExecContext(ctx, `DELETE FROM categories WHERE id=?`, id)
	if err != nil {
		return err
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return ErrNotFound
	}
	return tx.Commit()
}
func (service *CategoryService) get(ctx context.Context, id string) (domain.Category, error) {
	items, err := service.List(ctx)
	if err != nil {
		return domain.Category{}, err
	}
	for _, item := range items {
		if item.ID == id {
			return item, nil
		}
	}
	return domain.Category{}, ErrNotFound
}

type TagService struct {
	database *sql.DB
	audit    *AuditService
}

func NewTagService(database *sql.DB, audit *AuditService) *TagService {
	return &TagService{database, audit}
}
func (service *TagService) List(ctx context.Context) ([]domain.Tag, error) {
	rows, err := service.database.QueryContext(ctx, `SELECT t.id,t.slug,t.name,t.description,(SELECT COUNT(*) FROM post_tags pt WHERE pt.tag_id=t.id),t.created_at,t.updated_at FROM tags t ORDER BY t.name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]domain.Tag, 0)
	for rows.Next() {
		var item domain.Tag
		var created, updated string
		if err := rows.Scan(&item.ID, &item.Slug, &item.Name, &item.Description, &item.PostCount, &created, &updated); err != nil {
			return nil, err
		}
		item.CreatedAt, _ = time.Parse(time.RFC3339Nano, created)
		item.UpdatedAt, _ = time.Parse(time.RFC3339Nano, updated)
		items = append(items, item)
	}
	return items, rows.Err()
}
func (service *TagService) Create(ctx context.Context, input TagInput) (domain.Tag, error) {
	if err := validateTag(input); err != nil {
		return domain.Tag{}, err
	}
	now := time.Now().UTC()
	item := domain.Tag{ID: newID(), Slug: normalizeSlug(input.Slug), Name: strings.TrimSpace(input.Name), Description: strings.TrimSpace(input.Description), CreatedAt: now, UpdatedAt: now}
	_, err := service.database.ExecContext(ctx, `INSERT INTO tags (id,slug,name,description,created_at,updated_at) VALUES (?,?,?,?,?,?)`, item.ID, item.Slug, item.Name, item.Description, now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano))
	if err != nil {
		return domain.Tag{}, mapConstraint(err)
	}
	return item, nil
}
func (service *TagService) Update(ctx context.Context, id string, input TagInput) (domain.Tag, error) {
	if err := validateTag(input); err != nil {
		return domain.Tag{}, err
	}
	result, err := service.database.ExecContext(ctx, `UPDATE tags SET slug=?,name=?,description=?,updated_at=? WHERE id=?`, normalizeSlug(input.Slug), strings.TrimSpace(input.Name), strings.TrimSpace(input.Description), time.Now().UTC().Format(time.RFC3339Nano), id)
	if err != nil {
		return domain.Tag{}, mapConstraint(err)
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return domain.Tag{}, ErrNotFound
	}
	return service.get(ctx, id)
}
func (service *TagService) Delete(ctx context.Context, id string) error {
	result, err := service.database.ExecContext(ctx, `DELETE FROM tags WHERE id=?`, id)
	if err != nil {
		return err
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return ErrNotFound
	}
	return nil
}
func (service *TagService) get(ctx context.Context, id string) (domain.Tag, error) {
	items, err := service.List(ctx)
	if err != nil {
		return domain.Tag{}, err
	}
	for _, item := range items {
		if item.ID == id {
			return item, nil
		}
	}
	return domain.Tag{}, ErrNotFound
}

func validatePostInput(input PostInput) error {
	if len(strings.TrimSpace(input.Title)) == 0 || len(strings.TrimSpace(input.Title)) > 180 {
		return ErrInvalidInput
	}
	if !slugPattern.MatchString(normalizeSlug(input.Slug)) {
		return ErrInvalidInput
	}
	if len(input.Content) > 2_000_000 {
		return ErrInvalidInput
	}
	if input.CoverURL != "" {
		if _, err := url.ParseRequestURI(input.CoverURL); err != nil {
			return ErrInvalidInput
		}
	}
	language := normalizeLanguage(input.Language)
	if language != "zh" && language != "en" {
		return ErrInvalidInput
	}
	return nil
}
func validateCategory(input CategoryInput) error {
	if !slugPattern.MatchString(normalizeSlug(input.Slug)) || strings.TrimSpace(input.LabelZH) == "" || strings.TrimSpace(input.LabelEN) == "" {
		return ErrInvalidInput
	}
	return nil
}
func validateTag(input TagInput) error {
	if !slugPattern.MatchString(normalizeSlug(input.Slug)) || strings.TrimSpace(input.Name) == "" {
		return ErrInvalidInput
	}
	return nil
}
func normalizeSlug(value string) string {
	return strings.Trim(strings.ToLower(strings.ReplaceAll(strings.TrimSpace(value), " ", "-")), "-")
}
func normalizeLanguage(value string) string {
	if strings.TrimSpace(value) == "" {
		return "zh"
	}
	return strings.ToLower(strings.TrimSpace(value))
}
func nullableString(value *string) interface{} {
	if value == nil || strings.TrimSpace(*value) == "" {
		return nil
	}
	return *value
}
func nullableTime(value *time.Time) interface{} {
	if value == nil {
		return nil
	}
	return value.UTC().Format(time.RFC3339Nano)
}
func boolInt(value bool) int {
	if value {
		return 1
	}
	return 0
}
func tagIDs(tags []domain.Tag) []string {
	ids := make([]string, 0, len(tags))
	for _, tag := range tags {
		ids = append(ids, tag.ID)
	}
	return ids
}
func uniqueIDs(ids []string) []string {
	seen := map[string]bool{}
	result := make([]string, 0, len(ids))
	for _, id := range ids {
		if id != "" && !seen[id] {
			seen[id] = true
			result = append(result, id)
		}
	}
	return result
}
func postWhere(filters PostFilters) (string, []interface{}) {
	clauses := []string{"WHERE 1=1"}
	args := []interface{}{}
	if filters.Keyword != "" {
		clauses = append(clauses, "AND (p.title LIKE ? OR p.slug LIKE ?)")
		keyword := "%" + filters.Keyword + "%"
		args = append(args, keyword, keyword)
	}
	if filters.Status != "" {
		clauses = append(clauses, "AND p.status=?")
		args = append(args, filters.Status)
	} else {
		clauses = append(clauses, "AND p.deleted_at IS NULL")
	}
	if filters.Language != "" {
		clauses = append(clauses, "AND p.language=?")
		args = append(args, filters.Language)
	}
	if filters.CategoryID != "" {
		clauses = append(clauses, "AND p.category_id=?")
		args = append(args, filters.CategoryID)
	}
	if filters.TagID != "" {
		clauses = append(clauses, "AND pt.tag_id=?")
		args = append(args, filters.TagID)
	}
	return strings.Join(clauses, " "), args
}

type scanner interface{ Scan(...interface{}) error }

func scanPost(row scanner) (domain.Post, error) {
	var post domain.Post
	var categoryID sql.NullString
	var published, scheduled, created, updated, deleted sql.NullString
	err := row.Scan(&post.ID, &post.Title, &post.Slug, &post.Summary, &post.Content, &post.CoverURL, &post.Language, &post.Status, &categoryID, &post.CategoryName, &post.SEOTitle, &post.SEODescription, &published, &scheduled, &created, &updated, &deleted)
	if err != nil {
		return domain.Post{}, err
	}
	if categoryID.Valid {
		post.CategoryID = &categoryID.String
	}
	post.PublishedAt = parseNullableTime(published)
	post.ScheduledAt = parseNullableTime(scheduled)
	post.CreatedAt = parseTime(created.String)
	post.UpdatedAt = parseTime(updated.String)
	post.DeletedAt = parseNullableTime(deleted)
	return post, nil
}
func parseTime(value string) time.Time {
	parsed, _ := time.Parse(time.RFC3339Nano, value)
	return parsed
}
func parseNullableTime(value sql.NullString) *time.Time {
	if !value.Valid {
		return nil
	}
	parsed, err := time.Parse(time.RFC3339Nano, value.String)
	if err != nil {
		return nil
	}
	return &parsed
}
func mapConstraint(err error) error {
	if strings.Contains(strings.ToLower(err.Error()), "unique constraint") {
		return ErrConflict
	}
	return err
}
func _unused(v ...interface{}) { _ = fmt.Sprint(v...) }
