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
}

func Load() (Config, error) {
	cfg := Config{
		ListenAddress:        env("CMS_API_ADDR", ":8080"),
		DatabasePath:         env("CMS_DATABASE_PATH", "../storage/db/blog.sqlite"),
		CookieSecure:         env("CMS_COOKIE_SECURE", "false") == "true",
		AdminPassword:        os.Getenv("CMS_ADMIN_PASSWORD"),
		SessionDays:          envInt("CMS_SESSION_DAYS", 30),
		RepositoryDir:        strings.TrimSpace(os.Getenv("CMS_REPOSITORY_DIR")),
		GitBranch:            env("CMS_GIT_BRANCH", "main"),
		NextRevalidateURL:    strings.TrimSpace(os.Getenv("CMS_NEXT_REVALIDATE_URL")),
		NextRevalidateSecret: strings.TrimSpace(os.Getenv("CMS_NEXT_REVALIDATE_SECRET")),
	}

	if cfg.DatabasePath == "" {
		return Config{}, fmt.Errorf("CMS_DATABASE_PATH cannot be empty")
	}
	cfg.DatabasePath = filepath.Clean(cfg.DatabasePath)
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
