package filestore

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/kerntau/blog/cms-api/internal/domain"
)

type Store struct {
	mu         sync.RWMutex
	contentDir string
}

func NewStore(contentDir string) *Store {
	return &Store{contentDir: filepath.Clean(contentDir)}
}

func (s *Store) ContentDir() string {
	return s.contentDir
}

// -----------------------------------------------------------------------------
// 通用 JSON 文件操作
// -----------------------------------------------------------------------------

func (s *Store) ReadJSON(filename string, target any) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	fullPath := filepath.Join(s.contentDir, filename)
	data, err := os.ReadFile(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	if len(bytes.TrimSpace(data)) == 0 {
		return nil
	}
	return json.Unmarshal(data, target)
}

func (s *Store) WriteJSON(filename string, data any) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	fullPath := filepath.Join(s.contentDir, filename)
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return err
	}
	raw, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(fullPath, append(raw, '\n'), 0644)
}

// -----------------------------------------------------------------------------
// MDX 文章 / 页面 文件解析与写入（无第三方 YAML 依赖）
// -----------------------------------------------------------------------------

func (s *Store) ReadPosts() ([]domain.Post, map[string][]string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.readPostsUnlocked()
}

func (s *Store) readPostsUnlocked() ([]domain.Post, map[string][]string, error) {
	blogDir := filepath.Join(s.contentDir, "blog")
	if _, err := os.Stat(blogDir); os.IsNotExist(err) {
		return []domain.Post{}, make(map[string][]string), nil
	}

	var posts []domain.Post
	postTagsMap := make(map[string][]string)

	err := filepath.Walk(blogDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() || (!strings.HasSuffix(info.Name(), ".mdx") && !strings.HasSuffix(info.Name(), ".md")) {
			return nil
		}
		content, err := os.ReadFile(path)
		if err != nil {
			return nil
		}
		kv, body := parseFrontmatterKV(content)

		id := kv["id"]
		slug := kv["slug"]
		if slug == "" {
			slug = strings.TrimSuffix(info.Name(), filepath.Ext(info.Name()))
		}
		if id == "" {
			id = sanitizeID(slug, info.Name())
		}

		title := kv["title"]
		summary := kv["summary"]
		coverUrl := kv["coverUrl"]
		language := kv["language"]
		if language == "" {
			language = "zh"
		}
		status := domain.PostStatus(kv["status"])
		if status == "" {
			status = domain.PostStatusPublished
		}

		var categoryID *string
		if cat, ok := kv["categoryId"]; ok && cat != "" {
			categoryID = &cat
		}

		seoTitle := kv["seoTitle"]
		seoDescription := kv["seoDescription"]

		publishedAt := parseTimePtr(kv["publishedAt"])
		scheduledAt := parseTimePtr(kv["scheduledAt"])
		createdAt := parseTimeVal(kv["createdAt"], info.ModTime())
		updatedAt := parseTimeVal(kv["updatedAt"], info.ModTime())
		deletedAt := parseTimePtr(kv["deletedAt"])

		tagIDs := parseSlice(kv["tagIds"])

		post := domain.Post{
			ID:             id,
			Title:          title,
			Slug:           slug,
			Summary:        summary,
			Content:        body,
			CoverURL:       coverUrl,
			Language:       language,
			Status:         status,
			CategoryID:     categoryID,
			SEOTitle:       seoTitle,
			SEODescription: seoDescription,
			PublishedAt:    publishedAt,
			ScheduledAt:    scheduledAt,
			CreatedAt:      createdAt,
			UpdatedAt:      updatedAt,
			DeletedAt:      deletedAt,
		}
		posts = append(posts, post)
		postTagsMap[id] = tagIDs
		return nil
	})

	if err != nil {
		return nil, nil, err
	}

	sort.Slice(posts, func(i, j int) bool {
		return posts[i].CreatedAt.After(posts[j].CreatedAt)
	})

	return posts, postTagsMap, nil
}

func (s *Store) SyncGeneratedStats() {
	posts, postTagsMap, err := s.readPostsUnlocked()
	if err != nil {
		return
	}
	categoryCounts := make(map[string]int)
	tagCounts := make(map[string]int)

	for _, p := range posts {
		if p.Status == domain.PostStatusPublished {
			if p.CategoryID != nil && *p.CategoryID != "" {
				categoryCounts[*p.CategoryID]++
			}
			if tags, ok := postTagsMap[p.ID]; ok {
				for _, t := range tags {
					if t != "" {
						tagCounts[t]++
					}
				}
			}
		}
	}

	rootDir := filepath.Dir(s.contentDir)

	genCatPath := filepath.Join(rootDir, "src", "generated", "content", "category-data.json")
	if err := os.MkdirAll(filepath.Dir(genCatPath), 0755); err == nil {
		raw, _ := json.MarshalIndent(categoryCounts, "", "  ")
		_ = os.WriteFile(genCatPath, append(raw, '\n'), 0644)
	}

	genTagPath := filepath.Join(rootDir, "src", "generated", "content", "tag-data.json")
	if err := os.MkdirAll(filepath.Dir(genTagPath), 0755); err == nil {
		raw, _ := json.MarshalIndent(tagCounts, "", "  ")
		_ = os.WriteFile(genTagPath, append(raw, '\n'), 0644)
	}
}

func (s *Store) WritePost(post domain.Post, tagIDs []string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	blogDir := filepath.Join(s.contentDir, "blog")
	if err := os.MkdirAll(blogDir, 0755); err != nil {
		return err
	}

	filename := post.Slug + ".mdx"
	if strings.Contains(filename, "/") {
		filename = strings.ReplaceAll(filename, "/", "_") + ".mdx"
	}
	filePath := filepath.Join(blogDir, filename)

	var buf bytes.Buffer
	buf.WriteString("---\n")
	buf.WriteString(fmt.Sprintf("id: %q\n", post.ID))
	buf.WriteString(fmt.Sprintf("title: %q\n", post.Title))
	buf.WriteString(fmt.Sprintf("slug: %q\n", post.Slug))
	if post.Summary != "" {
		buf.WriteString(fmt.Sprintf("summary: %q\n", post.Summary))
	}
	if post.CoverURL != "" {
		buf.WriteString(fmt.Sprintf("coverUrl: %q\n", post.CoverURL))
	}
	buf.WriteString(fmt.Sprintf("language: %q\n", post.Language))
	buf.WriteString(fmt.Sprintf("status: %q\n", string(post.Status)))
	if post.CategoryID != nil && *post.CategoryID != "" {
		buf.WriteString(fmt.Sprintf("categoryId: %q\n", *post.CategoryID))
	}
	if len(tagIDs) > 0 {
		buf.WriteString(fmt.Sprintf("tagIds: %s\n", formatSlice(tagIDs)))
	}
	if post.SEOTitle != "" {
		buf.WriteString(fmt.Sprintf("seoTitle: %q\n", post.SEOTitle))
	}
	if post.SEODescription != "" {
		buf.WriteString(fmt.Sprintf("seoDescription: %q\n", post.SEODescription))
	}
	if post.PublishedAt != nil {
		buf.WriteString(fmt.Sprintf("publishedAt: %q\n", post.PublishedAt.Format(time.RFC3339)))
	}
	if post.ScheduledAt != nil {
		buf.WriteString(fmt.Sprintf("scheduledAt: %q\n", post.ScheduledAt.Format(time.RFC3339)))
	}
	buf.WriteString(fmt.Sprintf("createdAt: %q\n", post.CreatedAt.Format(time.RFC3339)))
	buf.WriteString(fmt.Sprintf("updatedAt: %q\n", post.UpdatedAt.Format(time.RFC3339)))
	if post.DeletedAt != nil {
		buf.WriteString(fmt.Sprintf("deletedAt: %q\n", post.DeletedAt.Format(time.RFC3339)))
	}
	buf.WriteString("---\n\n")
	buf.WriteString(strings.TrimSpace(post.Content))
	buf.WriteString("\n")

	if err := os.WriteFile(filePath, buf.Bytes(), 0644); err != nil {
		return err
	}
	s.SyncGeneratedStats()
	return nil
}

func (s *Store) DeletePostFile(slug string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	blogDir := filepath.Join(s.contentDir, "blog")
	filename := slug + ".mdx"
	if strings.Contains(filename, "/") {
		filename = strings.ReplaceAll(filename, "/", "_") + ".mdx"
	}
	filePath := filepath.Join(blogDir, filename)
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return err
	}
	s.SyncGeneratedStats()
	return nil
}

func (s *Store) ReadPages() ([]domain.Page, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	pagesDir := filepath.Join(s.contentDir, "pages")
	if _, err := os.Stat(pagesDir); os.IsNotExist(err) {
		return []domain.Page{}, nil
	}

	var pages []domain.Page
	err := filepath.Walk(pagesDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() || (!strings.HasSuffix(info.Name(), ".mdx") && !strings.HasSuffix(info.Name(), ".md")) {
			return nil
		}
		content, err := os.ReadFile(path)
		if err != nil {
			return nil
		}
		kv, body := parseFrontmatterKV(content)

		id := kv["id"]
		slug := kv["slug"]
		if slug == "" {
			slug = strings.TrimSuffix(info.Name(), filepath.Ext(info.Name()))
		}
		if id == "" {
			id = sanitizeID(slug, info.Name())
		}

		page := domain.Page{
			ID:             id,
			Title:          kv["title"],
			Slug:           slug,
			Content:        body,
			Status:         domain.PostStatus(kv["status"]),
			SEOTitle:       kv["seoTitle"],
			SEODescription: kv["seoDescription"],
			PublishedAt:    parseTimePtr(kv["publishedAt"]),
			CreatedAt:      parseTimeVal(kv["createdAt"], info.ModTime()),
			UpdatedAt:      parseTimeVal(kv["updatedAt"], info.ModTime()),
		}
		if page.Status == "" {
			page.Status = domain.PostStatusPublished
		}
		pages = append(pages, page)
		return nil
	})

	if err != nil {
		return nil, err
	}

	sort.Slice(pages, func(i, j int) bool {
		return pages[i].CreatedAt.After(pages[j].CreatedAt)
	})

	return pages, nil
}

func (s *Store) WritePage(page domain.Page) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	pagesDir := filepath.Join(s.contentDir, "pages")
	if err := os.MkdirAll(pagesDir, 0755); err != nil {
		return err
	}

	filename := page.Slug + ".mdx"
	if strings.Contains(filename, "/") {
		filename = strings.ReplaceAll(filename, "/", "_") + ".mdx"
	}
	filePath := filepath.Join(pagesDir, filename)

	var buf bytes.Buffer
	buf.WriteString("---\n")
	buf.WriteString(fmt.Sprintf("id: %q\n", page.ID))
	buf.WriteString(fmt.Sprintf("title: %q\n", page.Title))
	buf.WriteString(fmt.Sprintf("slug: %q\n", page.Slug))
	buf.WriteString(fmt.Sprintf("status: %q\n", string(page.Status)))
	if page.SEOTitle != "" {
		buf.WriteString(fmt.Sprintf("seoTitle: %q\n", page.SEOTitle))
	}
	if page.SEODescription != "" {
		buf.WriteString(fmt.Sprintf("seoDescription: %q\n", page.SEODescription))
	}
	if page.PublishedAt != nil {
		buf.WriteString(fmt.Sprintf("publishedAt: %q\n", page.PublishedAt.Format(time.RFC3339)))
	}
	buf.WriteString(fmt.Sprintf("createdAt: %q\n", page.CreatedAt.Format(time.RFC3339)))
	buf.WriteString(fmt.Sprintf("updatedAt: %q\n", page.UpdatedAt.Format(time.RFC3339)))
	buf.WriteString("---\n\n")
	buf.WriteString(strings.TrimSpace(page.Content))
	buf.WriteString("\n")

	return os.WriteFile(filePath, buf.Bytes(), 0644)
}

// -----------------------------------------------------------------------------
// 内部纯标准库 Frontmatter 解析
// -----------------------------------------------------------------------------

func parseFrontmatterKV(content []byte) (map[string]string, string) {
	kv := make(map[string]string)
	str := string(content)
	if !strings.HasPrefix(str, "---") {
		return kv, str
	}
	parts := strings.SplitN(str[3:], "---", 2)
	if len(parts) < 2 {
		return kv, str
	}

	lines := strings.Split(parts[0], "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		idx := strings.Index(line, ":")
		if idx == -1 {
			continue
		}
		key := strings.TrimSpace(line[:idx])
		val := strings.TrimSpace(line[idx+1:])
		val = strings.Trim(val, `"'`)
		kv[key] = val
	}

	return kv, strings.TrimSpace(parts[1])
}

func sanitizeID(slug, fallback string) string {
	if slug != "" {
		return strings.ReplaceAll(slug, "/", "-")
	}
	return strings.TrimSuffix(fallback, filepath.Ext(fallback))
}

func parseTimePtr(val string) *time.Time {
	if val == "" {
		return nil
	}
	t, err := time.Parse(time.RFC3339, val)
	if err != nil {
		if t2, err2 := time.Parse("2006-01-02", val); err2 == nil {
			return &t2
		}
		return nil
	}
	return &t
}

func parseTimeVal(val string, fallback time.Time) time.Time {
	if p := parseTimePtr(val); p != nil {
		return *p
	}
	return fallback
}

func parseSlice(val string) []string {
	if val == "" {
		return []string{}
	}
	val = strings.Trim(val, "[]")
	parts := strings.Split(val, ",")
	res := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		p = strings.Trim(p, `"'`)
		if p != "" {
			res = append(res, p)
		}
	}
	return res
}

func formatSlice(slice []string) string {
	var escaped []string
	for _, s := range slice {
		escaped = append(escaped, strconv.Quote(s))
	}
	return "[" + strings.Join(escaped, ", ") + "]"
}
