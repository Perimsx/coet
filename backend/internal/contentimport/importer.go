package contentimport

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"
)

type Options struct {
	ContentDirectory string
	FriendsFile      string
	SiteTitle        string
	SiteDescription  string
	SiteURL          string
	Author           string
}

type Result struct {
	Posts      int
	Categories int
	Tags       int
	Friends    int
	Skipped    int
}

type document struct {
	Title, URL, Date         string
	Draft                    bool
	Summary                  string
	Tags, Categories, Images []string
}

type friend struct {
	Name        string `json:"name"`
	URL         string `json:"url"`
	Avatar      string `json:"avatar"`
	Description string `json:"description"`
	Group       string `json:"group"`
}

func Run(ctx context.Context, database *gorm.DB, options Options) (Result, error) {
	if strings.TrimSpace(options.ContentDirectory) == "" {
		return Result{}, fmt.Errorf("content directory is required")
	}

	result := Result{}
	err := database.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		err := filepath.WalkDir(options.ContentDirectory, func(path string, entry fs.DirEntry, walkErr error) error {
			if walkErr != nil {
				return walkErr
			}
			if entry.IsDir() || !strings.EqualFold(filepath.Ext(path), ".md") {
				return nil
			}
			imported, skipped, categoryCount, tagCount, importErr := importDocument(ctx, tx, path)
			if importErr != nil {
				return fmt.Errorf("import %s: %w", path, importErr)
			}
			result.Posts += imported
			result.Skipped += skipped
			result.Categories += categoryCount
			result.Tags += tagCount
			return nil
		})
		if err != nil {
			return err
		}
		if strings.TrimSpace(options.FriendsFile) != "" {
			count, importErr := importFriends(ctx, tx, options.FriendsFile)
			if importErr != nil {
				return importErr
			}
			result.Friends = count
		}
		if err := importSettings(ctx, tx, options); err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return Result{}, err
	}
	return result, nil
}

func importDocument(ctx context.Context, tx *gorm.DB, path string) (int, int, int, int, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return 0, 0, 0, 0, err
	}
	frontMatter, body, ok := splitFrontMatter(string(raw))
	if !ok {
		return 0, 1, 0, 0, nil
	}
	source := parseDocument(frontMatter)
	slug := normalizeSlug(source.URL)
	if source.Title == "" || slug == "" {
		return 0, 1, 0, 0, nil
	}
	var exists int64
	if err := tx.Raw(`SELECT COUNT(*) FROM posts WHERE slug=?`, slug).Scan(&exists).Error; err != nil {
		return 0, 0, 0, 0, err
	}
	if exists > 0 {
		return 0, 1, 0, 0, nil
	}
	now := time.Now().UTC()
	published := parseDate(source.Date, now)
	status := "published"
	if source.Draft {
		status = "draft"
	}
	categoryID, categories, err := categoryIDFor(ctx, tx, first(source.Categories), now)
	if err != nil {
		return 0, 0, 0, 0, err
	}
	postID := newID()
	coverURL := first(source.Images)
	err = tx.Exec(`INSERT INTO posts (id,title,slug,summary,content,cover_url,language,status,category_id,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, postID, strings.TrimSpace(source.Title), slug, strings.TrimSpace(source.Summary), body, coverURL, languageFor(slug), status, categoryID, published.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano)).Error
	if err != nil {
		return 0, 0, 0, 0, err
	}
	tags := 0
	for _, name := range source.Tags {
		tagID, created, tagErr := tagIDFor(ctx, tx, name, now)
		if tagErr != nil {
			return 0, 0, 0, 0, tagErr
		}
		tags += created
		if tagErr = tx.Exec(`INSERT OR IGNORE INTO post_tags (post_id,tag_id) VALUES (?,?)`, postID, tagID).Error; tagErr != nil {
			return 0, 0, 0, 0, tagErr
		}
	}
	return 1, 0, categories, tags, nil
}

func importFriends(ctx context.Context, tx *gorm.DB, source string) (int, error) {
	raw, err := os.ReadFile(source)
	if err != nil {
		return 0, err
	}
	var items []friend
	if err := json.Unmarshal(raw, &items); err != nil {
		return 0, err
	}
	now := time.Now().UTC().Format(time.RFC3339Nano)
	imported := 0
	for index, item := range items {
		if strings.TrimSpace(item.Name) == "" || strings.TrimSpace(item.URL) == "" {
			continue
		}
		res := tx.Exec(`INSERT OR IGNORE INTO friend_links (id,name,url,avatar_url,description,group_name,sort_order,enabled,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`, newID(), strings.TrimSpace(item.Name), strings.TrimSpace(item.URL), strings.TrimSpace(item.Avatar), strings.TrimSpace(item.Description), strings.TrimSpace(item.Group), index, 1, now, now)
		if res.Error != nil {
			return 0, res.Error
		}
		if res.RowsAffected > 0 {
			imported++
		}
	}
	return imported, nil
}

func importSettings(ctx context.Context, tx *gorm.DB, options Options) error {
	settings := map[string]string{"site.title": options.SiteTitle, "site.description": options.SiteDescription, "site.url": options.SiteURL, "site.author": options.Author}
	now := time.Now().UTC().Format(time.RFC3339Nano)
	for key, value := range settings {
		if strings.TrimSpace(value) == "" {
			continue
		}
		if err := tx.Exec(`INSERT OR IGNORE INTO site_settings (setting_key,setting_value,updated_at) VALUES (?,?,?)`, key, strings.TrimSpace(value), now).Error; err != nil {
			return err
		}
	}
	return nil
}

func categoryIDFor(ctx context.Context, tx *gorm.DB, name string, now time.Time) (interface{}, int, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, 0, nil
	}
	slug := normalizeSlug(name)
	var id string
	err := tx.Raw(`SELECT id FROM categories WHERE slug=?`, slug).Scan(&id).Error
	if err == nil && id != "" {
		return id, 0, nil
	}
	id = newID()
	err = tx.Exec(`INSERT INTO categories (id,slug,label_zh,label_en,description,sort_order,enabled,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`, id, slug, name, name, "", 0, 1, now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano)).Error
	return id, 1, err
}

func tagIDFor(ctx context.Context, tx *gorm.DB, name string, now time.Time) (string, int, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return "", 0, nil
	}
	slug := normalizeSlug(name)
	var id string
	err := tx.Raw(`SELECT id FROM tags WHERE slug=?`, slug).Scan(&id).Error
	if err == nil && id != "" {
		return id, 0, nil
	}
	id = newID()
	err = tx.Exec(`INSERT INTO tags (id,slug,name,description,created_at,updated_at) VALUES (?,?,?,?,?,?)`, id, slug, name, "", now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano)).Error
	return id, 1, err
}

func splitFrontMatter(source string) (string, string, bool) {
	source = strings.TrimPrefix(source, "\ufeff")
	if !strings.HasPrefix(source, "---\n") && !strings.HasPrefix(source, "---\r\n") {
		return "", source, false
	}
	lines := strings.Split(source, "\n")
	for index := 1; index < len(lines); index++ {
		if strings.TrimSpace(lines[index]) == "---" {
			return strings.Join(lines[1:index], "\n"), strings.Join(lines[index+1:], "\n"), true
		}
	}
	return "", source, false
}

func parseDocument(frontMatter string) document {
	result := document{}
	var listTarget *[]string
	for _, line := range strings.Split(frontMatter, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}
		if strings.HasPrefix(trimmed, "- ") && listTarget != nil {
			*listTarget = append(*listTarget, yamlValue(strings.TrimPrefix(trimmed, "- ")))
			continue
		}
		listTarget = nil
		parts := strings.SplitN(trimmed, ":", 2)
		if len(parts) != 2 {
			continue
		}
		key, value := strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
		switch key {
		case "title":
			result.Title = yamlValue(value)
		case "url", "slug":
			result.URL = yamlValue(value)
		case "date":
			result.Date = yamlValue(value)
		case "draft":
			result.Draft = strings.EqualFold(yamlValue(value), "true")
		case "summary":
			result.Summary = yamlValue(value)
		case "tags":
			result.Tags = yamlList(value)
			if value == "" {
				listTarget = &result.Tags
			}
		case "categories":
			result.Categories = yamlList(value)
			if value == "" {
				listTarget = &result.Categories
			}
		case "images":
			result.Images = yamlList(value)
			if value == "" {
				listTarget = &result.Images
			}
		}
	}
	return result
}

func yamlList(value string) []string {
	value = strings.TrimSpace(value)
	if !strings.HasPrefix(value, "[") || !strings.HasSuffix(value, "]") {
		return nil
	}
	values := strings.Split(strings.TrimSpace(strings.TrimSuffix(strings.TrimPrefix(value, "["), "]")), ",")
	result := make([]string, 0, len(values))
	for _, item := range values {
		if normalized := yamlValue(item); normalized != "" {
			result = append(result, normalized)
		}
	}
	return result
}

func yamlValue(value string) string { return strings.Trim(strings.TrimSpace(value), "\"'") }

func parseDate(value string, fallback time.Time) time.Time {
	for _, layout := range []string{time.RFC3339, "2006-01-02", "2006-01-02 15:04:05"} {
		if parsed, err := time.Parse(layout, strings.TrimSpace(value)); err == nil {
			return parsed.UTC()
		}
	}
	return fallback
}

func languageFor(slug string) string {
	if strings.HasPrefix(slug, "en/") {
		return "en"
	}
	return "zh"
}

func first(values []string) string {
	if len(values) == 0 {
		return ""
	}
	return strings.TrimSpace(values[0])
}

func normalizeSlug(value string) string {
	parts := strings.Split(strings.Trim(strings.ToLower(strings.TrimSpace(value)), "/"), "/")
	for index := range parts {
		parts[index] = strings.Trim(strings.ReplaceAll(strings.TrimSpace(parts[index]), " ", "-"), "-")
	}
	return strings.Join(parts, "/")
}

func newID() string {
	bytes := make([]byte, 12)
	if _, err := rand.Read(bytes); err != nil {
		panic(err)
	}
	return "imp_" + hex.EncodeToString(bytes)
}
