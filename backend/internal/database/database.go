package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

func Open(databasePath string) (*sql.DB, error) {
	if err := os.MkdirAll(filepath.Dir(databasePath), 0o750); err != nil {
		return nil, fmt.Errorf("create database directory: %w", err)
	}

	database, err := sql.Open("sqlite", databasePath+"?_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)")
	if err != nil {
		return nil, fmt.Errorf("open sqlite database: %w", err)
	}
	database.SetMaxOpenConns(1)
	if err := database.Ping(); err != nil {
		database.Close()
		return nil, fmt.Errorf("ping sqlite database: %w", err)
	}
	return database, nil
}

func Migrate(database *sql.DB) error {
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
	}
	for _, statement := range statements {
		if _, err := database.Exec(statement); err != nil {
			return fmt.Errorf("run migration: %w", err)
		}
	}
	return nil
}
