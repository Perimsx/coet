package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadDotEnvDoesNotOverrideProcessEnvironment(t *testing.T) {
	filePath := filepath.Join(t.TempDir(), ".env")
	if err := os.WriteFile(filePath, []byte("CMS_TEST_QUOTED=\"quoted value\"\nCMS_TEST_SHELL=file-value\n"), 0600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("CMS_TEST_SHELL", "shell-value")

	if err := loadDotEnv(filePath); err != nil {
		t.Fatal(err)
	}
	if got := os.Getenv("CMS_TEST_QUOTED"); got != "quoted value" {
		t.Fatalf("quoted dotenv value = %q", got)
	}
	if got := os.Getenv("CMS_TEST_SHELL"); got != "shell-value" {
		t.Fatalf("process environment was overridden: %q", got)
	}
}
