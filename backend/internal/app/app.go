package app

import (
	"database/sql"

	"github.com/kerntau/blog/cms-api/internal/config"
	"github.com/kerntau/blog/cms-api/internal/database"
	"github.com/kerntau/blog/cms-api/internal/httpapi"
)

type Application struct {
	database *sql.DB
	router   *httpapi.Router
}

func New(cfg config.Config) (*Application, error) {
	databaseConnection, err := database.Open(cfg.DatabasePath)
	if err != nil {
		return nil, err
	}
	if err := database.Migrate(databaseConnection); err != nil {
		databaseConnection.Close()
		return nil, err
	}
	return &Application{database: databaseConnection, router: httpapi.NewRouter(cfg, databaseConnection)}, nil
}

func (application *Application) Router() *httpapi.Router { return application.router }

func (application *Application) Close() error { return application.database.Close() }
