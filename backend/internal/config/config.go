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
	RestartAfterDeploy   bool
	ContentDirectory     string
	EnvFilePath          string
	IndexNowKey          string
	BaiduPushToken       string
}

func Load() (Config, error) {
	envFilePath := env("CMS_ENV_FILE", ".env")
	if err := loadDotEnv(envFilePath); err != nil && !os.IsNotExist(err) {
		return Config{}, fmt.Errorf("load %s: %w", envFilePath, err)
	}
	_ = loadDotEnv("../.env")
	managedProcess := strings.TrimSpace(os.Getenv("pm_id")) != "" ||
		strings.TrimSpace(os.Getenv("INVOCATION_ID")) != "" ||
		envBool("CMS_MANAGED_PROCESS", false)

	cfg := Config{
		ListenAddress:        env("CMS_API_ADDR", "127.0.0.1:8080"),
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
		RestartAfterDeploy:   envBool("CMS_RESTART_AFTER_DEPLOY", true) && managedProcess,
		EnvFilePath:          env("CMS_ENV_FILE", envFilePath),
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

	// 智能 RepositoryDir 解析与自动探测兜底
	if cfg.RepositoryDir == "" {
		if info, err := os.Stat(".git"); err == nil && info.IsDir() {
			if cwd, err := os.Getwd(); err == nil {
				cfg.RepositoryDir = cwd
			}
		} else if info, err := os.Stat("../.git"); err == nil && info.IsDir() {
			if abs, err := filepath.Abs(".."); err == nil {
				cfg.RepositoryDir = abs
			}
		}
	} else {
		if abs, err := filepath.Abs(cfg.RepositoryDir); err == nil {
			cfg.RepositoryDir = abs
		} else {
			cfg.RepositoryDir = filepath.Clean(cfg.RepositoryDir)
		}
	}

	cfg.DeployScript = resolveRepositoryPath(cfg.RepositoryDir, cfg.DeployScript, filepath.Join("scripts", "deploy.mjs"))
	cfg.RollbackScript = resolveRepositoryPath(cfg.RepositoryDir, cfg.RollbackScript, filepath.Join("scripts", "deploy.mjs"))

	return cfg, nil
}

func resolveRepositoryPath(repositoryDir, configuredPath, fallback string) string {
	value := strings.TrimSpace(configuredPath)
	if value == "" {
		value = fallback
	}
	if filepath.IsAbs(value) || repositoryDir == "" {
		return filepath.Clean(value)
	}
	return filepath.Join(repositoryDir, filepath.Clean(value))
}

func loadDotEnv(filePath string) error {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}
	for _, line := range strings.Split(strings.ReplaceAll(string(content), "\r\n", "\n"), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if strings.HasPrefix(line, "export ") {
			line = strings.TrimSpace(strings.TrimPrefix(line, "export "))
		}
		separator := strings.IndexByte(line, '=')
		if separator < 1 {
			continue
		}
		key := strings.TrimSpace(line[:separator])
		if key == "" {
			continue
		}
		if _, exists := os.LookupEnv(key); exists {
			continue
		}
		value := strings.TrimSpace(line[separator+1:])
		if len(value) >= 2 && value[0] == '"' && value[len(value)-1] == '"' {
			if unquoted, unquoteErr := strconv.Unquote(value); unquoteErr == nil {
				value = unquoted
			}
		}
		if err := os.Setenv(key, value); err != nil {
			return err
		}
	}
	return nil
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

func envBool(key string, fallback bool) bool {
	value := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if value == "" {
		return fallback
	}
	return value == "1" || value == "true" || value == "yes" || value == "on"
}
