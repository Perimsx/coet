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
}

func NewServices(database *sql.DB, cfg config.Config) *Services {
	audit := NewAuditService(database)
	jobs := NewJobService(database)
	return &Services{
		Auth:       NewAuthService(database, cfg.AdminPassword, cfg.SessionDays, audit),
		Posts:      NewPostService(database, audit),
		Categories: NewCategoryService(database, audit),
		Tags:       NewTagService(database, audit),
		Audit:      audit,
		Dashboard:  NewDashboardService(database),
		Jobs:       jobs,
		System:     NewSystemService(database, cfg),
	}
}
