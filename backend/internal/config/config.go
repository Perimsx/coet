package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type Config struct {
	ListenAddress        string
	DatabasePath         string
	CookieSecure         bool
	AdminPassword        string
	SessionDays          int
	RepositoryDir        string
	GitBranch            string
	NextRevalidateURL    string
	NextRevalidateSecret string
	BackupDirectory      string
	GitRemote            string
	DeployScript         string
	RollbackScript       string
	ContentDirectory     string
	IndexNowKey          string
	BaiduPushToken       string
}

func Load() (Config, error) {
	cfg := Config{
		ListenAddress:        env("CMS_API_ADDR", ":8080"),
		DatabasePath:         env("CMS_DATABASE_PATH", "../storage/db/blog.sqlite"),
		ContentDirectory:     env("CMS_CONTENT_DIR", "../content"),
		CookieSecure:         env("CMS_COOKIE_SECURE", "false") == "true",
		AdminPassword:        env("CMS_ADMIN_PASSWORD", env("ADMIN_PASSWORD", "change-me-now")),
		SessionDays:          envInt("CMS_SESSION_DAYS", 30),
		RepositoryDir:        strings.TrimSpace(os.Getenv("CMS_REPOSITORY_DIR")),
		GitBranch:            env("CMS_GIT_BRANCH", "main"),
		NextRevalidateURL:    strings.TrimSpace(os.Getenv("CMS_NEXT_REVALIDATE_URL")),
		NextRevalidateSecret: strings.TrimSpace(os.Getenv("CMS_NEXT_REVALIDATE_SECRET")),
		BackupDirectory:      strings.TrimSpace(os.Getenv("CMS_BACKUP_DIRECTORY")),
		GitRemote:            env("CMS_GIT_REMOTE", "origin"),
		DeployScript:         strings.TrimSpace(os.Getenv("CMS_DEPLOY_SCRIPT")),
		RollbackScript:       strings.TrimSpace(os.Getenv("CMS_ROLLBACK_SCRIPT")),
		IndexNowKey:          strings.TrimSpace(os.Getenv("CMS_INDEXNOW_KEY")),
		BaiduPushToken:       strings.TrimSpace(os.Getenv("CMS_BAIDU_PUSH_TOKEN")),
	}

	if cfg.DatabasePath == "" {
		return Config{}, fmt.Errorf("CMS_DATABASE_PATH cannot be empty")
	}
	cfg.DatabasePath = filepath.Clean(cfg.DatabasePath)
	if cfg.BackupDirectory == "" {
		cfg.BackupDirectory = filepath.Join(filepath.Dir(cfg.DatabasePath), "backups")
	}
	cfg.BackupDirectory = filepath.Clean(cfg.BackupDirectory)
	return cfg, nil
}

func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func envInt(key string, fallback int) int {
	value, err := strconv.Atoi(strings.TrimSpace(os.Getenv(key)))
	if err != nil || value < 1 || value > 365 {
		return fallback
	}
	return value
}
