package service

import (
	"database/sql"
)

type Services struct {
	Auth       *AuthService
	Posts      *PostService
	Categories *CategoryService
	Tags       *TagService
	Audit      *AuditService
	Dashboard  *DashboardService
}

func NewServices(database *sql.DB, adminPassword string, sessionDays int) *Services {
	audit := NewAuditService(database)
	return &Services{
		Auth:       NewAuthService(database, adminPassword, sessionDays, audit),
		Posts:      NewPostService(database, audit),
		Categories: NewCategoryService(database, audit),
		Tags:       NewTagService(database, audit),
		Audit:      audit,
		Dashboard:  NewDashboardService(database),
	}
}
