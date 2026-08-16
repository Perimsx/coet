package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	ListenAddress        string `env:"CMS_API_ADDR" env-default:"127.0.0.1:8080"`
	DatabasePath         string `env:"CMS_DATABASE_PATH" env-default:"../storage/db/blog.sqlite"`
	CookieSecure         bool   `env:"CMS_COOKIE_SECURE" env-default:"false"`
	AdminPassword        string `env:"CMS_ADMIN_PASSWORD" env-default:"change-me-now"`
	SessionDays          int    `env:"CMS_SESSION_DAYS" env-default:"30"`
	RepositoryDir        string `env:"CMS_REPOSITORY_DIR"`
	GitBranch            string `env:"CMS_GIT_BRANCH" env-default:"main"`
	GitRepositoryURL     string `env:"CMS_GIT_REPOSITORY_URL"`
	DeployedCommitFile   string `env:"CMS_DEPLOYED_COMMIT_FILE"`
	NextRevalidateURL    string `env:"CMS_NEXT_REVALIDATE_URL"`
	NextRevalidateSecret string `env:"CMS_NEXT_REVALIDATE_SECRET"`
	BackupDirectory      string `env:"CMS_BACKUP_DIRECTORY"`
	GitRemote            string `env:"CMS_GIT_REMOTE" env-default:"origin"`
	DeployScript         string `env:"CMS_DEPLOY_SCRIPT"`
	RollbackScript       string `env:"CMS_ROLLBACK_SCRIPT"`
	RestartAfterDeploy   bool   `env:"CMS_RESTART_AFTER_DEPLOY" env-default:"true"`
	ContentDirectory     string `env:"CMS_CONTENT_DIR" env-default:"../content"`
	IndexNowKey          string `env:"CMS_INDEXNOW_KEY"`
	BaiduPushToken       string `env:"CMS_BAIDU_PUSH_TOKEN"`
}

func parseDotEnv(path string) map[string]string {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil
	}
	result := make(map[string]string)
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.Trim(strings.TrimSpace(parts[1]), "\"'`")
			result[key] = val
		}
	}
	return result
}

func Load() (Config, error) {
	envFile := os.Getenv("CMS_ENV_FILE")
	if envFile == "" {
		envFile = ".env"
	}

	// 尝试加载指定或父目录的 .env 文件内容（不覆盖已存在的进程环境变量）
	dotEnvValues := parseDotEnv(envFile)
	if dotEnvValues == nil && envFile == ".env" {
		dotEnvValues = parseDotEnv("../.env")
	}
	for k, v := range dotEnvValues {
		if os.Getenv(k) == "" {
			_ = os.Setenv(k, v)
		}
	}

	var cfg Config
	if err := cleanenv.ReadEnv(&cfg); err != nil {
		return Config{}, fmt.Errorf("read environment config: %w", err)
	}

	// 兼容旧环境变量 ADMIN_PASSWORD
	if adminPass := os.Getenv("ADMIN_PASSWORD"); adminPass != "" && os.Getenv("CMS_ADMIN_PASSWORD") == "" {
		cfg.AdminPassword = adminPass
	}

	managedProcess := strings.TrimSpace(os.Getenv("pm_id")) != "" ||
		strings.TrimSpace(os.Getenv("INVOCATION_ID")) != "" ||
		cfg.RestartAfterDeploy

	cfg.RestartAfterDeploy = cfg.RestartAfterDeploy && managedProcess

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
	cfg.DeployedCommitFile = resolveRepositoryPath(cfg.RepositoryDir, cfg.DeployedCommitFile, filepath.Join("storage", "runtime", "deployed-commit"))

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
