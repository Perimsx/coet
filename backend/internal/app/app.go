package app

import (
	"github.com/kerntau/blog/cms-api/internal/config"
	"github.com/kerntau/blog/cms-api/internal/database"
	"github.com/kerntau/blog/cms-api/internal/httpapi"
	"gorm.io/gorm"
)

type Application struct {
	db     *gorm.DB
	router *httpapi.Router
}

func New(cfg config.Config) (*Application, error) {
	db, err := database.Open(cfg.DatabasePath)
	if err != nil {
		return nil, err
	}
	if err := database.Migrate(db); err != nil {
		sqlDB, _ := db.DB()
		if sqlDB != nil {
			_ = sqlDB.Close()
		}
		return nil, err
	}
	return &Application{
		db:     db,
		router: httpapi.NewRouter(cfg, db),
	}, nil
}

func (application *Application) Router() *httpapi.Router {
	return application.router
}

func (application *Application) Close() error {
	sqlDB, err := application.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
