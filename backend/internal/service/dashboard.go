package service

import (
	"context"
	"database/sql"

	"github.com/kerntau/blog/cms-api/internal/domain"
	"github.com/kerntau/blog/cms-api/internal/filestore"
)

type DashboardSummary struct {
	PublishedPosts int `json:"publishedPosts"`
	DraftPosts     int `json:"draftPosts"`
	Categories     int `json:"categories"`
	Tags           int `json:"tags"`
}

type DashboardService struct {
	database *sql.DB
	store    *filestore.Store
}

func NewDashboardService(database *sql.DB, store *filestore.Store) *DashboardService {
	return &DashboardService{database: database, store: store}
}

func (service *DashboardService) Summary(ctx context.Context) (DashboardSummary, error) {
	var summary DashboardSummary
	posts, _, err := service.store.ReadPosts()
	if err != nil {
		return summary, err
	}

	for _, p := range posts {
		if p.DeletedAt != nil {
			continue
		}
		if p.Status == domain.PostStatusPublished {
			summary.PublishedPosts++
		} else if p.Status == domain.PostStatusDraft {
			summary.DraftPosts++
		}
	}

	var categories []domain.Category
	_ = service.store.ReadJSON("categories.json", &categories)
	summary.Categories = len(categories)

	var tags []domain.Tag
	_ = service.store.ReadJSON("tags.json", &tags)
	summary.Tags = len(tags)

	return summary, nil
}
