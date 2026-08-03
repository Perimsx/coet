package service

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/kerntau/blog/cms-api/internal/domain"
	"github.com/kerntau/blog/cms-api/internal/filestore"
)

func TestTagCRUDPersistsMirrorsAndSupportsUnicodeSlugs(t *testing.T) {
	root := t.TempDir()
	store := filestore.NewStore(filepath.Join(root, "content"))
	service := NewPostService(store, nil)

	created, err := service.CreateTag(context.Background(), TagInput{Name: "大数据"})
	if err != nil {
		t.Fatalf("create tag: %v", err)
	}
	if created.Slug != "大数据" {
		t.Fatalf("unexpected slug: %q", created.Slug)
	}
	post := domain.Post{
		ID:        "tag-reference-test",
		Title:     "标签引用测试",
		Slug:      "tag-reference-test",
		Content:   "内容",
		Language:  "zh",
		Status:    domain.PostStatusPublished,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}
	if err := store.WritePost(post, []string{created.Slug}); err != nil {
		t.Fatalf("write tag reference: %v", err)
	}

	for _, path := range []string{
		filepath.Join(root, "content", "tags.json"),
		filepath.Join(root, "storage", "settings", "tags.json"),
	} {
		if _, err := os.Stat(path); err != nil {
			t.Fatalf("tag mirror %s was not written: %v", path, err)
		}
	}

	updated, err := service.UpdateTag(context.Background(), created.ID, TagInput{Name: "大数据分析", Slug: "big-data"})
	if err != nil {
		t.Fatalf("update tag: %v", err)
	}
	if updated.Slug != "big-data" || updated.Name != "大数据分析" {
		t.Fatalf("unexpected updated tag: %+v", updated)
	}
	_, tagMap, err := store.ReadPosts()
	if err != nil {
		t.Fatalf("read updated tag reference: %v", err)
	}
	if got := tagMap[post.ID]; len(got) != 1 || got[0] != updated.ID {
		t.Fatalf("expected canonical tag ID reference, got %v", got)
	}

	if err := service.DeleteTag(context.Background(), created.ID); err != nil {
		t.Fatalf("delete tag: %v", err)
	}
	items, err := service.ListTags(context.Background())
	if err != nil {
		t.Fatalf("list tags: %v", err)
	}
	if len(items) != 0 {
		t.Fatalf("expected no tags after delete, got %d", len(items))
	}
}

func TestPostRevisionsCanRestoreContent(t *testing.T) {
	root := t.TempDir()
	store := filestore.NewStore(filepath.Join(root, "content"))
	service := NewPostService(store, nil)

	now := time.Now().UTC()
	post := domain.Post{
		ID:        "post-revision-test",
		Title:     "原始标题",
		Slug:      "original",
		Content:   "原始内容",
		Language:  "zh",
		Status:    domain.PostStatusDraft,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := store.WritePost(post, nil); err != nil {
		t.Fatalf("write post: %v", err)
	}

	updated, err := service.Update(context.Background(), post.ID, PostInput{
		Title:    "更新标题",
		Slug:     "updated",
		Content:  "更新内容",
		Language: "zh",
	})
	if err != nil {
		t.Fatalf("update post: %v", err)
	}
	if updated.Title != "更新标题" {
		t.Fatalf("unexpected updated post: %+v", updated)
	}

	revisions, err := service.Revisions(context.Background(), post.ID)
	if err != nil {
		t.Fatalf("list revisions: %v", err)
	}
	if len(revisions) != 1 || revisions[0].Title != "原始标题" {
		t.Fatalf("unexpected revisions: %+v", revisions)
	}

	restored, err := service.RestoreRevision(context.Background(), post.ID, revisions[0].ID)
	if err != nil {
		t.Fatalf("restore revision: %v", err)
	}
	if restored.Slug != "original" || restored.Content != "原始内容" {
		t.Fatalf("unexpected restored post: %+v", restored)
	}
}
