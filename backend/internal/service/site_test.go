package service

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/kerntau/blog/cms-api/internal/filestore"
)

func TestSiteSettingsProtectPushCredentials(t *testing.T) {
	contentDir := t.TempDir()
	settingsPath := filepath.Join(contentDir, "site-settings.json")
	if err := os.WriteFile(settingsPath, []byte(`{"siteUrl":"https://example.com","indexNowKey":"index-secret","baiduToken":"baidu-secret"}`), 0600); err != nil {
		t.Fatal(err)
	}

	service := NewSiteService(filestore.NewStore(contentDir))
	settings, err := service.GetSettings(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := settings["indexNowKey"]; ok {
		t.Fatal("IndexNow credentials must not be returned from site settings")
	}
	if _, ok := settings["baiduToken"]; ok {
		t.Fatal("Baidu credentials must not be returned from site settings")
	}

	if _, err := service.UpdateSettings(context.Background(), map[string]string{"indexNowKey": "new-secret"}); !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("expected protected setting rejection, got %v", err)
	}

	if _, err := service.UpdateSettings(context.Background(), map[string]string{"title": "Safe title"}); err != nil {
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

func TestUpdateEnvFilePreservesNonSecretSettings(t *testing.T) {
	filePath := filepath.Join(t.TempDir(), ".env")
	if err := os.WriteFile(filePath, []byte("CMS_API_ADDR=:8080\nCMS_INDEXNOW_KEY=old-value\n# keep this comment\n"), 0600); err != nil {
		t.Fatal(err)
	}

	if err := updateEnvFile(filePath, map[string]string{
		"CMS_INDEXNOW_KEY":     "new-value # safely quoted",
		"CMS_BAIDU_PUSH_TOKEN": "baidu-value",
	}); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filePath)
	if err != nil {
		t.Fatal(err)
	}
	content := string(raw)
	if !strings.Contains(content, "CMS_API_ADDR=:8080") || !strings.Contains(content, "# keep this comment") {
		t.Fatal("existing non-secret env content must be preserved")
	}
	if !strings.Contains(content, `CMS_INDEXNOW_KEY="new-value # safely quoted"`) || !strings.Contains(content, `CMS_BAIDU_PUSH_TOKEN="baidu-value"`) {
		t.Fatal("updated credentials must be written as quoted env values")
	}
}
