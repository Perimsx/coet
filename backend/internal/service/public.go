package service

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/kerntau/blog/cms-api/internal/domain"
)

type PublicService struct {
	database *sql.DB
	posts    *PostService
	site     *SiteService
}

func NewPublicService(database *sql.DB, posts *PostService, site *SiteService) *PublicService {
	return &PublicService{database: database, posts: posts, site: site}
}

func (service *PublicService) ListPosts(ctx context.Context, filters PostFilters) ([]domain.Post, int, error) {
	filters.Status = string(domain.PostStatusPublished)
	return service.posts.List(ctx, filters)
}

func (service *PublicService) PostBySlug(ctx context.Context, slug string) (domain.Post, error) {
	slug = normalizeSlug(slug)
	if !slugPattern.MatchString(slug) {
		return domain.Post{}, ErrNotFound
	}
	var id string
	err := service.database.QueryRowContext(ctx, `SELECT id FROM posts WHERE slug=? AND status='published' AND deleted_at IS NULL`, slug).Scan(&id)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Post{}, ErrNotFound
	}
	if err != nil {
		return domain.Post{}, err
	}
	return service.posts.Get(ctx, id)
}

func (service *PublicService) PageBySlug(ctx context.Context, slug string) (domain.Page, error) {
	slug = normalizeSlug(slug)
	if !slugPattern.MatchString(slug) {
		return domain.Page{}, ErrNotFound
	}
	item, err := scanPage(service.database.QueryRowContext(ctx, `SELECT id,title,slug,content,status,seo_title,seo_description,published_at,created_at,updated_at FROM pages WHERE slug=? AND status='published' AND deleted_at IS NULL`, slug))
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Page{}, ErrNotFound
	}
	return item, err
}

func (service *PublicService) PublishedFriends(ctx context.Context) ([]FriendLink, error) {
	items, err := service.site.ListFriends(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]FriendLink, 0, len(items))
	for _, item := range items {
		if item.Enabled {
			result = append(result, item)
		}
	}
	return result, nil
}

func (service *PublicService) Settings(ctx context.Context) (map[string]string, error) {
	return service.site.GetSettings(ctx)
}

func (service *PublicService) Navigation(ctx context.Context) ([]NavigationItem, error) {
	items, err := service.site.Navigation(ctx)
	if err != nil {
		return nil, err
	}
	return filterNavigation(items), nil
}

func filterNavigation(items []NavigationItem) []NavigationItem {
	result := make([]NavigationItem, 0, len(items))
	for _, item := range items {
		if !item.Enabled {
			continue
		}
		item.Children = filterNavigation(item.Children)
		result = append(result, item)
	}
	return result
}

func (service *PublicService) Categories(ctx context.Context) ([]domain.Category, error) {
	items, err := service.database.QueryContext(ctx, `SELECT c.id,c.slug,c.label_zh,c.label_en,c.description,c.sort_order,c.enabled,(SELECT COUNT(*) FROM posts p WHERE p.category_id=c.id AND p.status='published' AND p.deleted_at IS NULL),c.created_at,c.updated_at FROM categories c WHERE c.enabled=1 ORDER BY c.sort_order,c.label_zh`)
	if err != nil {
		return nil, err
	}
	defer items.Close()
	result := make([]domain.Category, 0)
	for items.Next() {
		var item domain.Category
		var enabled int
		var created, updated string
		if err := items.Scan(&item.ID, &item.Slug, &item.LabelZH, &item.LabelEN, &item.Description, &item.SortOrder, &enabled, &item.PostCount, &created, &updated); err != nil {
			return nil, err
		}
		item.Enabled = enabled == 1
		item.CreatedAt, item.UpdatedAt = parseTime(created), parseTime(updated)
		result = append(result, item)
	}
	return result, items.Err()
}

func (service *PublicService) Tags(ctx context.Context) ([]domain.Tag, error) {
	items, err := service.database.QueryContext(ctx, `SELECT t.id,t.slug,t.name,t.description,(SELECT COUNT(*) FROM post_tags pt JOIN posts p ON p.id=pt.post_id WHERE pt.tag_id=t.id AND p.status='published' AND p.deleted_at IS NULL),t.created_at,t.updated_at FROM tags t ORDER BY t.name`)
	if err != nil {
		return nil, err
	}
	defer items.Close()
	result := make([]domain.Tag, 0)
	for items.Next() {
		var item domain.Tag
		var created, updated string
		if err := items.Scan(&item.ID, &item.Slug, &item.Name, &item.Description, &item.PostCount, &created, &updated); err != nil {
			return nil, err
		}
		item.CreatedAt, item.UpdatedAt = parseTime(created), parseTime(updated)
		result = append(result, item)
	}
	return result, items.Err()
}

func publicSlug(value string) string { return strings.Trim(value, "/") }
