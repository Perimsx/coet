package service_test

import (
	"context"
	"path/filepath"
	"strings"
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

func TestSystemServiceChecksRemoteCommitWithoutLocalRepository(t *testing.T) {
	temporaryDirectory := t.TempDir()
	remoteDirectory := filepath.Join(temporaryDirectory, "remote.git")
	publisherDirectory := filepath.Join(temporaryDirectory, "publisher")
	markerPath := filepath.Join(temporaryDirectory, "runtime", "deployed-commit")

	runGit(t, temporaryDirectory, "init", "--bare", remoteDirectory)
	runGit(t, temporaryDirectory, "init", "-b", "main", publisherDirectory)
	runGit(t, publisherDirectory, "config", "user.email", "test@example.com")
	runGit(t, publisherDirectory, "config", "user.name", "Remote Check")
	writeTestFile(t, filepath.Join(publisherDirectory, "version.txt"), "v1\n")
	runGit(t, publisherDirectory, "add", ".")
	runGit(t, publisherDirectory, "commit", "-m", "initial")
	runGit(t, publisherDirectory, "remote", "add", "origin", remoteDirectory)
	runGit(t, publisherDirectory, "push", "-u", "origin", "main")
	currentCommit := strings.TrimSpace(runGit(t, publisherDirectory, "rev-parse", "HEAD"))
	writeTestFile(t, markerPath, currentCommit+"\n")

	databaseConnection, err := database.Open(filepath.Join(temporaryDirectory, "blog.sqlite"))
	if err != nil {
		t.Fatal(err)
	}
	defer databaseConnection.Close()
	if err := database.Migrate(databaseConnection); err != nil {
		t.Fatal(err)
	}

	system := service.NewSystemService(databaseConnection, config.Config{
		GitRepositoryURL:   remoteDirectory,
		GitBranch:          "main",
		DeployedCommitFile: markerPath,
	})
	status, err := system.CheckUpdates(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if status.Commit != currentCommit || status.RemoteCommit != currentCommit || status.RemoteAhead != 0 {
		t.Fatalf("expected remote and deployed commits to match: %+v", status)
	}

	writeTestFile(t, filepath.Join(publisherDirectory, "version.txt"), "v2\n")
	runGit(t, publisherDirectory, "add", "version.txt")
	runGit(t, publisherDirectory, "commit", "-m", "version two")
	runGit(t, publisherDirectory, "push", "origin", "main")
	status, err = system.CheckUpdates(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if status.RemoteCommit == currentCommit || status.RemoteAhead != 1 {
		t.Fatalf("expected remote update to be detected: %+v", status)
	}
}

func TestSystemServiceRestoresDataWithoutLosingOperationalHistory(t *testing.T) {
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

	if _, err := databaseConnection.Exec(`INSERT INTO suggestions (id,content,status,created_at,updated_at) VALUES ('before','before','unread','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')`); err != nil {
		t.Fatal(err)
	}
	system := service.NewSystemService(databaseConnection, config.Config{DatabasePath: databasePath, BackupDirectory: filepath.Join(temporaryDirectory, "backups")})
	backup, err := system.CreateBackup(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if _, err := databaseConnection.Exec(`INSERT INTO suggestions (id,content,status,created_at,updated_at) VALUES ('after','after','unread','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')`); err != nil {
		t.Fatal(err)
	}

	if _, err := system.RestoreBackup(context.Background(), backup.ID); err != nil {
		t.Fatal(err)
	}
	var count int
	if err := databaseConnection.QueryRow(`SELECT COUNT(*) FROM suggestions WHERE id='after'`).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 0 {
		t.Fatal("restore should remove data created after the snapshot")
	}
	if err := databaseConnection.QueryRow(`SELECT COUNT(*) FROM suggestions WHERE id='before'`).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Fatal("restore should keep data present in the snapshot")
	}
	items, err := system.ListBackups(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 2 {
		t.Fatalf("expected original and pre-restore backups, got %d", len(items))
	}
}
