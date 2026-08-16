package database

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// GORM 数据实体定义，与已有 SQLite 表结构完全对应

type AdminCredential struct {
	ID           int    `gorm:"primaryKey"`
	PasswordHash string `gorm:"column:password_hash;not null"`
	UpdatedAt    string `gorm:"column:updated_at;not null"`
}

func (AdminCredential) TableName() string { return "admin_credentials" }

type AdminSession struct {
	ID        string `gorm:"primaryKey"`
	CSRFToken string `gorm:"column:csrf_token;not null"`
	ExpiresAt string `gorm:"column:expires_at;not null"`
	CreatedAt string `gorm:"column:created_at;not null"`
	LastSeenAt string `gorm:"column:last_seen_at;not null"`
}

func (AdminSession) TableName() string { return "admin_sessions" }

type Comment struct {
	ID          string  `gorm:"primaryKey"`
	PostID      string  `gorm:"column:post_id;not null"`
	ParentID    *string `gorm:"column:parent_id"`
	AuthorName  string  `gorm:"column:author_name;not null"`
	AuthorEmail string  `gorm:"column:author_email;not null;default:''"`
	Content     string  `gorm:"column:content;not null"`
	Status      string  `gorm:"column:status;not null;default:'pending'"`
	CreatedAt   string  `gorm:"column:created_at;not null"`
	UpdatedAt   string  `gorm:"column:updated_at;not null"`
}

func (Comment) TableName() string { return "comments" }

type Suggestion struct {
	ID        string `gorm:"primaryKey"`
	Contact   string `gorm:"column:contact;not null;default:''"`
	Content   string `gorm:"column:content;not null"`
	Status    string `gorm:"column:status;not null;default:'unread'"`
	CreatedAt string `gorm:"column:created_at;not null"`
	UpdatedAt string `gorm:"column:updated_at;not null"`
}

func (Suggestion) TableName() string { return "suggestions" }

type Backup struct {
	ID         string  `gorm:"primaryKey"`
	FileName   string  `gorm:"column:file_name;not null;unique"`
	FileSize   int64   `gorm:"column:file_size;not null"`
	Checksum   string  `gorm:"column:checksum;not null"`
	CreatedAt  string  `gorm:"column:created_at;not null"`
	RestoredAt *string `gorm:"column:restored_at"`
}

func (Backup) TableName() string { return "backups" }

type GitDeployment struct {
	ID             string  `gorm:"primaryKey"`
	PreviousCommit string  `gorm:"column:previous_commit;not null;default:''"`
	TargetCommit   string  `gorm:"column:target_commit;not null;default:''"`
	Branch         string  `gorm:"column:branch;not null;default:''"`
	Status         string  `gorm:"column:status;not null"`
	JobID          string  `gorm:"column:job_id;not null;default:''"`
	CreatedAt      string  `gorm:"column:created_at;not null"`
	CompletedAt    *string `gorm:"column:completed_at"`
	Details        string  `gorm:"column:details;not null;default:''"`
}

func (GitDeployment) TableName() string { return "git_deployments" }

type AuditLog struct {
	ID         string `gorm:"primaryKey"`
	Action     string `gorm:"column:action;not null"`
	TargetType string `gorm:"column:target_type;not null;default:''"`
	TargetID   string `gorm:"column:target_id;not null;default:''"`
	Status     string `gorm:"column:status;not null"`
	RequestID  string `gorm:"column:request_id;not null"`
	Details    string `gorm:"column:details;not null;default:''"`
	CreatedAt  string `gorm:"column:created_at;not null"`
}

func (AuditLog) TableName() string { return "audit_logs" }

type SystemJob struct {
	ID          string  `gorm:"primaryKey"`
	JobType     string  `gorm:"column:job_type;not null"`
	Status      string  `gorm:"column:status;not null"`
	Progress    int     `gorm:"column:progress;not null;default:0"`
	Message     string  `gorm:"column:message;not null;default:''"`
	Logs        string  `gorm:"column:logs;not null;default:''"`
	CreatedAt   string  `gorm:"column:created_at;not null"`
	StartedAt   *string `gorm:"column:started_at"`
	CompletedAt *string `gorm:"column:completed_at"`
}

func (SystemJob) TableName() string { return "system_jobs" }

type PageModel struct {
	ID             string  `gorm:"primaryKey"`
	Title          string  `gorm:"column:title;not null"`
	Slug           string  `gorm:"column:slug;not null"`
	Content        string  `gorm:"column:content;not null"`
	Status         string  `gorm:"column:status;not null;default:'draft'"`
	SEOTitle       string  `gorm:"column:seo_title;not null;default:''"`
	SEODescription string  `gorm:"column:seo_description;not null;default:''"`
	PublishedAt    *string `gorm:"column:published_at"`
	CreatedAt      string  `gorm:"column:created_at;not null"`
	UpdatedAt      string  `gorm:"column:updated_at;not null"`
	DeletedAt      *string `gorm:"column:deleted_at"`
}

func (PageModel) TableName() string { return "pages" }

type AppSetting struct {
	Key       string `gorm:"primaryKey;column:key;size:128"`
	Value     string `gorm:"column:value;type:text;not null;default:''"`
	UpdatedAt string `gorm:"column:updated_at;not null"`
}

func (AppSetting) TableName() string { return "app_settings" }

func Open(databasePath string) (*gorm.DB, error) {
	if err := os.MkdirAll(filepath.Dir(databasePath), 0o750); err != nil {
		return nil, fmt.Errorf("create database directory: %w", err)
	}

	dsn := databasePath + "?_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)"
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("open gorm sqlite database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("get sql.DB from gorm: %w", err)
	}
	sqlDB.SetMaxOpenConns(1)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if err := sqlDB.Ping(); err != nil {
		sqlDB.Close()
		return nil, fmt.Errorf("ping sqlite database: %w", err)
	}

	return db, nil
}

func Migrate(db *gorm.DB) error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)`,
		`CREATE TABLE IF NOT EXISTS admin_credentials (id INTEGER PRIMARY KEY CHECK (id = 1), password_hash TEXT NOT NULL, updated_at TEXT NOT NULL)`,
		`CREATE TABLE IF NOT EXISTS admin_sessions (id TEXT PRIMARY KEY, csrf_token TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, last_seen_at TEXT NOT NULL)`,
		`CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE, author_name TEXT NOT NULL, author_email TEXT NOT NULL DEFAULT '', content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
		`CREATE INDEX IF NOT EXISTS idx_comments_status_created ON comments(status, created_at DESC)`,
		`CREATE TABLE IF NOT EXISTS suggestions (id TEXT PRIMARY KEY, contact TEXT NOT NULL DEFAULT '', content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'unread', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
		`CREATE TABLE IF NOT EXISTS backups (id TEXT PRIMARY KEY, file_name TEXT NOT NULL UNIQUE, file_size INTEGER NOT NULL, checksum TEXT NOT NULL, created_at TEXT NOT NULL, restored_at TEXT)`,
		`CREATE TABLE IF NOT EXISTS git_deployments (id TEXT PRIMARY KEY, previous_commit TEXT NOT NULL DEFAULT '', target_commit TEXT NOT NULL DEFAULT '', branch TEXT NOT NULL DEFAULT '', status TEXT NOT NULL, job_id TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, completed_at TEXT, details TEXT NOT NULL DEFAULT '')`,
		`CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, action TEXT NOT NULL, target_type TEXT NOT NULL DEFAULT '', target_id TEXT NOT NULL DEFAULT '', status TEXT NOT NULL, request_id TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL)`,
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`,
		`CREATE TABLE IF NOT EXISTS system_jobs (id TEXT PRIMARY KEY, job_type TEXT NOT NULL, status TEXT NOT NULL, progress INTEGER NOT NULL DEFAULT 0, message TEXT NOT NULL DEFAULT '', logs TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, started_at TEXT, completed_at TEXT)`,
		`CREATE TABLE IF NOT EXISTS pages (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL, content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', seo_title TEXT NOT NULL DEFAULT '', seo_description TEXT NOT NULL DEFAULT '', published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT)`,
		`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL)`,
	}
	for _, statement := range statements {
		if err := db.Exec(statement).Error; err != nil {
			return fmt.Errorf("run migration statement: %w", err)
		}
	}
	return nil
}
