package service_test

import (
	"context"
	"path/filepath"
	"testing"

	"github.com/kerntau/blog/cms-api/internal/config"
	"github.com/kerntau/blog/cms-api/internal/database"
	"github.com/kerntau/blog/cms-api/internal/service"
)

func TestSystemServiceCreatesVerifiedSQLiteSnapshot(t *testing.T) {
	temporaryDirectory := t.TempDir()
	databasePath := filepath.Join(temporaryDirectory, "blog.sqlite")
	databaseConnection, err := database.Open(databasePath)
	if err != nil {
		t.Fatal(err)
	}
	defer databaseConnection.Close()
	if err := database.Migrate(databaseConnection); err != nil {
		t.Fatal(err)
	}

	system := service.NewSystemService(databaseConnection, config.Config{DatabasePath: databasePath, BackupDirectory: filepath.Join(temporaryDirectory, "backups")})
	backup, err := system.CreateBackup(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if backup.FileSize == 0 || backup.Checksum == "" || backup.FileName == "" {
		t.Fatalf("unexpected backup: %+v", backup)
	}
	items, err := system.ListBackups(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 1 || items[0].ID != backup.ID {
		t.Fatalf("unexpected backups: %+v", items)
	}
}

func TestSystemServiceDoesNotAllowUnconfiguredGitOperations(t *testing.T) {
	databaseConnection, err := database.Open(filepath.Join(t.TempDir(), "blog.sqlite"))
	if err != nil {
		t.Fatal(err)
	}
	defer databaseConnection.Close()
	if err := database.Migrate(databaseConnection); err != nil {
		t.Fatal(err)
	}

	system := service.NewSystemService(databaseConnection, config.Config{})
	status, err := system.GitStatus(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if status.Configured {
		t.Fatal("expected Git to be unconfigured")
	}
	if _, err := system.CheckUpdates(context.Background()); err == nil {
		t.Fatal("expected unconfigured Git check to fail")
	}
}
