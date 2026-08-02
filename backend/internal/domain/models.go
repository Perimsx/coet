package domain

import "time"

type PostStatus string

const (
	PostStatusDraft       PostStatus = "draft"
	PostStatusPublished   PostStatus = "published"
	PostStatusUnpublished PostStatus = "unpublished"
	PostStatusTrash       PostStatus = "trash"
)

type Post struct {
	ID             string     `json:"id"`
	Title          string     `json:"title"`
	Slug           string     `json:"slug"`
	Summary        string     `json:"summary"`
	Content        string     `json:"content"`
	CoverURL       string     `json:"coverUrl"`
	Language       string     `json:"language"`
	Status         PostStatus `json:"status"`
	CategoryID     *string    `json:"categoryId,omitempty"`
	CategoryName   string     `json:"categoryName,omitempty"`
	SEOTitle       string     `json:"seoTitle"`
	SEODescription string     `json:"seoDescription"`
	Tags           []Tag      `json:"tags"`
	PublishedAt    *time.Time `json:"publishedAt,omitempty"`
	ScheduledAt    *time.Time `json:"scheduledAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	DeletedAt      *time.Time `json:"deletedAt,omitempty"`
}

type Category struct {
	ID          string    `json:"id"`
	Slug        string    `json:"slug"`
	LabelZH     string    `json:"labelZh"`
	LabelEN     string    `json:"labelEn"`
	Description string    `json:"description"`
	SortOrder   int       `json:"sortOrder"`
	Enabled     bool      `json:"enabled"`
	PostCount   int       `json:"postCount"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Tag struct {
	ID          string    `json:"id"`
	Slug        string    `json:"slug"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	PostCount   int       `json:"postCount"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Page struct {
	ID             string     `json:"id"`
	Title          string     `json:"title"`
	Slug           string     `json:"slug"`
	Content        string     `json:"content"`
	Status         PostStatus `json:"status"`
	SEOTitle       string     `json:"seoTitle"`
	SEODescription string     `json:"seoDescription"`
	PublishedAt    *time.Time `json:"publishedAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}
