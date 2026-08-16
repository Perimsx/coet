package service_test

import (
	"context"
	"errors"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/kerntau/blog/cms-api/internal/database"
	"github.com/kerntau/blog/cms-api/internal/service"
)

func TestJobServicePersistsProgressAndFailureLogs(t *testing.T) {
	databaseConnection, err := database.Open(filepath.Join(t.TempDir(), "blog.sqlite"))
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, err := databaseConnection.DB()
	if err != nil {
		t.Fatal(err)
	}
	defer sqlDB.Close()

	if err := database.Migrate(databaseConnection); err != nil {
		t.Fatal(err)
	}

	completion := make(chan service.Job, 1)
	jobs := service.NewJobService(databaseConnection)
	job, err := jobs.StartWithCompletion(context.Background(), "git_check", func(_ context.Context, report func(int, string)) error {
		report(25, "正在访问远程仓库")
		return errors.New("remote repository unavailable")
	}, func(_ context.Context, final service.Job, runErr error) {
		if runErr == nil {
			t.Errorf("expected job failure")
		}
		completion <- final
	})
	if err != nil {
		t.Fatal(err)
	}

	select {
	case final := <-completion:
		if final.ID != job.ID || final.Status != "failed" {
			t.Fatalf("unexpected completion: %+v", final)
		}
		if !strings.Contains(final.Logs, "正在访问远程仓库") || !strings.Contains(final.Logs, "remote repository unavailable") {
			t.Fatalf("failure logs do not contain progress and error: %q", final.Logs)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for job completion")
	}
}
