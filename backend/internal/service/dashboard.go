package service

import (
	"context"
	"database/sql"
)

type DashboardSummary struct {
	PublishedPosts int `json:"publishedPosts"`
	DraftPosts     int `json:"draftPosts"`
	Categories     int `json:"categories"`
	Tags           int `json:"tags"`
}

type DashboardService struct{ database *sql.DB }

func NewDashboardService(database *sql.DB) *DashboardService {
	return &DashboardService{database: database}
}

func (service *DashboardService) Summary(ctx context.Context) (DashboardSummary, error) {
	var summary DashboardSummary
	err := service.database.QueryRowContext(ctx, `SELECT
		COALESCE(SUM(CASE WHEN status = 'published' AND deleted_at IS NULL THEN 1 ELSE 0 END), 0),
		COALESCE(SUM(CASE WHEN status = 'draft' AND deleted_at IS NULL THEN 1 ELSE 0 END), 0),
		(SELECT COUNT(*) FROM categories),
		(SELECT COUNT(*) FROM tags)
		FROM posts`).Scan(&summary.PublishedPosts, &summary.DraftPosts, &summary.Categories, &summary.Tags)
	return summary, err
}
