package service

import (
	"context"
	"database/sql"
	"strings"

	"github.com/kerntau/blog/cms-api/internal/domain"
)

type PublicService struct {
	database *sql.DB
	posts    *PostService
	pages    *PageService
	site     *SiteService
}

func NewPublicService(database *sql.DB, posts *PostService, pages *PageService, site *SiteService) *PublicService {
	return &PublicService{database: database, posts: posts, pages: pages, site: site}
}

func (service *PublicService) ListPosts(ctx context.Context, filters PostFilters) ([]domain.Post, int, error) {
	filters.Status = string(domain.PostStatusPublished)
	return service.posts.List(ctx, filters)
}

func (service *PublicService) PostBySlug(ctx context.Context, slug string) (domain.Post, error) {
	norm := normalizeSlug(slug)
	if !slugPattern.MatchString(norm) {
		return domain.Post{}, ErrNotFound
	}
	posts, _, err := service.posts.List(ctx, PostFilters{Status: string(domain.PostStatusPublished)})
	if err != nil {
		return domain.Post{}, err
	}
	for _, p := range posts {
		if p.Slug == norm {
			return p, nil
		}
	}
	return domain.Post{}, ErrNotFound
}

func (service *PublicService) PageBySlug(ctx context.Context, slug string) (domain.Page, error) {
	norm := normalizeSlug(slug)
	if !slugPattern.MatchString(norm) {
		return domain.Page{}, ErrNotFound
	}
	return service.pages.GetBySlug(ctx, norm)
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
	categories, err := service.posts.ListCategories(ctx)
	if err != nil {
		return nil, err
	}
	posts, _, _ := service.posts.List(ctx, PostFilters{Status: string(domain.PostStatusPublished)})

	catCounts := make(map[string]int)
	for _, p := range posts {
		if p.CategoryID != nil {
			catCounts[*p.CategoryID]++
		}
	}

	result := make([]domain.Category, 0)
	for _, c := range categories {
		if c.Enabled {
			c.PostCount = catCounts[c.ID]
			result = append(result, c)
		}
	}
	return result, nil
}

func (service *PublicService) Tags(ctx context.Context) ([]domain.Tag, error) {
	tags, err := service.posts.ListTags(ctx)
	if err != nil {
		return nil, err
	}
	posts, _, _ := service.posts.List(ctx, PostFilters{Status: string(domain.PostStatusPublished)})

	tagCounts := make(map[string]int)
	for _, p := range posts {
		for _, t := range p.Tags {
			if t.ID != "" {
				tagCounts[t.ID]++
			}
			if t.Name != "" {
				tagCounts[t.Name]++
			}
			if t.Slug != "" {
				tagCounts[t.Slug]++
			}
		}
	}

	result := make([]domain.Tag, 0)
	for _, t := range tags {
		count := tagCounts[t.ID]
		if count == 0 {
			count = tagCounts[t.Name]
		}
		if count == 0 {
			count = tagCounts[t.Slug]
		}
		t.PostCount = count
		result = append(result, t)
	}
	return result, nil
}

func publicSlug(value string) string { return strings.Trim(value, "/") }
