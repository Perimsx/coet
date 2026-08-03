package service_test

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/kerntau/blog/cms-api/internal/config"
	"github.com/kerntau/blog/cms-api/internal/database"
	"github.com/kerntau/blog/cms-api/internal/service"
)

func TestSystemServiceUpdatesAndRestoresCommitWhenDeploymentFails(t *testing.T) {
	if _, err := exec.LookPath("git"); err != nil {
		t.Skip("git is required")
	}
	if _, err := exec.LookPath("node"); err != nil {
		t.Skip("node is required")
	}

	temporaryDirectory := t.TempDir()
	remoteDirectory := filepath.Join(temporaryDirectory, "remote.git")
	publisherDirectory := filepath.Join(temporaryDirectory, "publisher")
	repositoryDirectory := filepath.Join(temporaryDirectory, "repository")

	runGit(t, temporaryDirectory, "init", "--bare", remoteDirectory)
	runGit(t, temporaryDirectory, "init", "-b", "main", publisherDirectory)
	runGit(t, publisherDirectory, "config", "user.email", "test@example.com")
	runGit(t, publisherDirectory, "config", "user.name", "Update Test")
	writeTestFile(t, filepath.Join(publisherDirectory, "version.txt"), "v1\n")
	writeTestFile(t, filepath.Join(publisherDirectory, "scripts", "deploy.mjs"), `console.log("test deployment completed");`+"\n")
	runGit(t, publisherDirectory, "add", ".")
	runGit(t, publisherDirectory, "commit", "-m", "initial")
	runGit(t, publisherDirectory, "remote", "add", "origin", remoteDirectory)
	runGit(t, publisherDirectory, "push", "-u", "origin", "main")
	runGit(t, temporaryDirectory, "clone", "--branch", "main", remoteDirectory, repositoryDirectory)

	databasePath := filepath.Join(temporaryDirectory, "blog.sqlite")
	databaseConnection, err := database.Open(databasePath)
	if err != nil {
		t.Fatal(err)
	}
	defer databaseConnection.Close()
	if err := database.Migrate(databaseConnection); err != nil {
		t.Fatal(err)
	}

	system := service.NewSystemService(databaseConnection, config.Config{
		DatabasePath:       databasePath,
		BackupDirectory:    filepath.Join(temporaryDirectory, "backups"),
		RepositoryDir:      repositoryDirectory,
		GitBranch:          "main",
		GitRemote:          "origin",
		DeployScript:       filepath.Join(repositoryDirectory, "scripts", "deploy.mjs"),
		RollbackScript:     filepath.Join(repositoryDirectory, "scripts", "deploy.mjs"),
		RestartAfterDeploy: false,
	})

	writeTestFile(t, filepath.Join(publisherDirectory, "version.txt"), "v2\n")
	runGit(t, publisherDirectory, "add", "version.txt")
	runGit(t, publisherDirectory, "commit", "-m", "version two")
	runGit(t, publisherDirectory, "push", "origin", "main")

	if err := system.Update(context.Background(), func(int, string) {}); err != nil {
		t.Fatalf("successful update failed: %v", err)
	}
	if got := strings.TrimSpace(readTestFile(t, filepath.Join(repositoryDirectory, "version.txt"))); got != "v2" {
		t.Fatalf("updated version = %q", got)
	}
	successfulCommit := strings.TrimSpace(runGit(t, repositoryDirectory, "rev-parse", "HEAD"))

	writeTestFile(t, filepath.Join(publisherDirectory, "version.txt"), "v3\n")
	writeTestFile(t, filepath.Join(publisherDirectory, "scripts", "deploy.mjs"), `console.error("test deployment failed"); process.exit(1);`+"\n")
	runGit(t, publisherDirectory, "add", ".")
	runGit(t, publisherDirectory, "commit", "-m", "broken deployment")
	runGit(t, publisherDirectory, "push", "origin", "main")

	if err := system.Update(context.Background(), func(int, string) {}); err == nil {
		t.Fatal("expected failed deployment")
	}
	if got := strings.TrimSpace(runGit(t, repositoryDirectory, "rev-parse", "HEAD")); got != successfulCommit {
		t.Fatalf("HEAD was not restored: got %q want %q", got, successfulCommit)
	}
	if got := strings.TrimSpace(readTestFile(t, filepath.Join(repositoryDirectory, "version.txt"))); got != "v2" {
		t.Fatalf("restored version = %q", got)
	}

	deployments, err := system.ListDeployments(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(deployments) != 2 || deployments[0].Status != "failed" || deployments[1].Status != "succeeded" {
		t.Fatalf("unexpected deployment history: %+v", deployments)
	}
}

func runGit(t *testing.T, directory string, args ...string) string {
	t.Helper()
	command := exec.Command("git", args...)
	command.Dir = directory
	output, err := command.CombinedOutput()
	if err != nil {
		t.Fatalf("git %s: %v: %s", strings.Join(args, " "), err, output)
	}
	return string(output)
}

func writeTestFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o750); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatal(err)
	}
}

func readTestFile(t *testing.T, path string) string {
	t.Helper()
	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return string(content)
}
