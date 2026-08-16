package service_test

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/kerntau/blog/cms-api/internal/database"
	"github.com/kerntau/blog/cms-api/internal/filestore"
	"github.com/kerntau/blog/cms-api/internal/service"
)

func TestSiteSettingsProtectPushCredentials(t *testing.T) {
	tempDir := t.TempDir()
	dbPath := filepath.Join(tempDir, "test.db")
	db, err := database.Open(dbPath)
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	defer sqlDB.Close()
	if err := database.Migrate(db); err != nil {
		t.Fatal(err)
	}

	contentDir := filepath.Join(tempDir, "content")
	if err := os.MkdirAll(contentDir, 0755); err != nil {
		t.Fatal(err)
	}
	settingsPath := filepath.Join(contentDir, "site-settings.json")
	if err := os.WriteFile(settingsPath, []byte(`{"siteUrl":"https://example.com","indexNowKey":"index-secret","baiduToken":"baidu-secret"}`), 0600); err != nil {
		t.Fatal(err)
	}

	siteService := service.NewSiteService(db, filestore.NewStore(contentDir))
	settings, err := siteService.GetSettings(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := settings["indexNowKey"]; ok {
		t.Fatal("IndexNow credentials must not be returned from site settings")
	}
	if _, ok := settings["baiduToken"]; ok {
		t.Fatal("Baidu credentials must not be returned from site settings")
	}

	if _, err := siteService.UpdateSettings(context.Background(), map[string]string{"indexNowKey": "new-secret"}); !errors.Is(err, service.ErrInvalidInput) {
		t.Fatalf("expected protected setting rejection, got %v", err)
	}

	if _, err := siteService.UpdateSettings(context.Background(), map[string]string{"title": "Safe title"}); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(settingsPath)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(raw), "index-secret") || strings.Contains(string(raw), "baidu-secret") {
		t.Fatal("protected credentials must be removed when settings are persisted")
	}
}

func TestDatabaseSettingsPersistence(t *testing.T) {
	tempDir := t.TempDir()
	dbPath := filepath.Join(tempDir, "test.db")
	db, err := database.Open(dbPath)
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	defer sqlDB.Close()
	if err := database.Migrate(db); err != nil {
		t.Fatal(err)
	}

	contentDir := filepath.Join(tempDir, "content")
	siteService := service.NewSiteService(db, filestore.NewStore(contentDir))

	ctx := context.Background()
	if err := siteService.SetSetting(ctx, "CMS_INDEXNOW_KEY", "db-secret-key"); err != nil {
		t.Fatal(err)
	}
	val, err := siteService.GetSetting(ctx, "CMS_INDEXNOW_KEY")
	if err != nil {
		t.Fatal(err)
	}
	if val != "db-secret-key" {
		t.Fatalf("expected db-secret-key, got %s", val)
	}
}
