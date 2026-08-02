package service

import (
	"database/sql"
	"github.com/kerntau/blog/cms-api/internal/config"
)

type Services struct {
	Auth       *AuthService
	Posts      *PostService
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

func NewServices(database *sql.DB, cfg config.Config) *Services {
	audit := NewAuditService(database)
	jobs := NewJobService(database)
	site := NewSiteService(database)
	posts := NewPostService(database, audit)
	return &Services{
		Auth:       NewAuthService(database, cfg.AdminPassword, cfg.SessionDays, audit),
		Posts:      posts,
		Categories: NewCategoryService(database, audit),
		Tags:       NewTagService(database, audit),
		Audit:      audit,
		Dashboard:  NewDashboardService(database),
		Jobs:       jobs,
		System:     NewSystemService(database, cfg),
		Site:       site,
		Engagement: NewEngagementService(database),
		Public:     NewPublicService(database, posts, site),
		SEO:        NewSEOService(site, posts, cfg),
	}
}
