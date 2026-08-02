package service

import (
	"context"
	"database/sql"

	"github.com/kerntau/blog/cms-api/internal/config"
	"github.com/kerntau/blog/cms-api/internal/domain"
	"github.com/kerntau/blog/cms-api/internal/filestore"
)

type CategoryService struct {
	posts *PostService
}

func (s *CategoryService) List(ctx context.Context) ([]domain.Category, error) {
	return s.posts.ListCategories(ctx)
}
func (s *CategoryService) Create(ctx context.Context, input CategoryInput) (domain.Category, error) {
	return s.posts.CreateCategory(ctx, input)
}
func (s *CategoryService) Update(ctx context.Context, id string, input CategoryInput) (domain.Category, error) {
	return s.posts.UpdateCategory(ctx, id, input)
}
func (s *CategoryService) Delete(ctx context.Context, id string, reassignCategoryID string) error {
	return s.posts.DeleteCategory(ctx, id, reassignCategoryID)
}

type TagService struct {
	posts *PostService
}

func (s *TagService) List(ctx context.Context) ([]domain.Tag, error) {
	return s.posts.ListTags(ctx)
}
func (s *TagService) Create(ctx context.Context, input TagInput) (domain.Tag, error) {
	return s.posts.CreateTag(ctx, input)
}
func (s *TagService) Update(ctx context.Context, id string, input TagInput) (domain.Tag, error) {
	return s.posts.UpdateTag(ctx, id, input)
}
func (s *TagService) Delete(ctx context.Context, id string) error {
	return s.posts.DeleteTag(ctx, id)
}

type Services struct {
	Auth       *AuthService
	Posts      *PostService
	Pages      *PageService
	Categories *CategoryService
	Tags       *TagService
	Audit      *AuditService
	Dashboard  *DashboardService
	Jobs       *JobService
	System     *SystemService
	Site       *SiteService
	Engagement *EngagementService
	Public     *PublicService
	SEO        *SEOService
}

func NewServices(database *sql.DB, store *filestore.Store, cfg config.Config) *Services {
	audit := NewAuditService(database)
	jobs := NewJobService(database)
	site := NewSiteService(store)
	posts := NewPostService(store, audit)
	pages := NewPageService(store, audit)
	return &Services{
		Auth:       NewAuthService(database, cfg.AdminPassword, cfg.SessionDays, audit),
		Posts:      posts,
		Pages:      pages,
		Categories: &CategoryService{posts: posts},
		Tags:       &TagService{posts: posts},
		Audit:      audit,
		Dashboard:  NewDashboardService(database, store),
		Jobs:       jobs,
		System:     NewSystemService(database, cfg),
		Site:       site,
		Engagement: NewEngagementService(database),
		Public:     NewPublicService(database, posts, pages, site),
		SEO:        NewSEOService(site, posts, cfg),
	}
}
