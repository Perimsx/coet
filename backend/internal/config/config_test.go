package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestConfigLoadWithDefaultsAndEnvironment(t *testing.T) {
	tempDir := t.TempDir()
	envPath := filepath.Join(tempDir, ".env")
	if err := os.WriteFile(envPath, []byte("CMS_ADMIN_PASSWORD=test-password-123\nCMS_API_ADDR=127.0.0.1:9090\n"), 0600); err != nil {
		t.Fatal(err)
	}

	t.Setenv("CMS_ENV_FILE", envPath)
	t.Setenv("CMS_API_ADDR", "127.0.0.1:9091")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("failed to load config: %v", err)
	}

	if cfg.AdminPassword != "test-password-123" {
		t.Fatalf("expected admin password from file, got %q", cfg.AdminPassword)
	}

	if cfg.ListenAddress != "127.0.0.1:9091" {
		t.Fatalf("expected environment variable override for listen address, got %q", cfg.ListenAddress)
	}
}
