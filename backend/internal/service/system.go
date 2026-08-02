package service

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/kerntau/blog/cms-api/internal/config"
)

type Backup struct {
	ID         string     `json:"id"`
	FileName   string     `json:"fileName"`
	FileSize   int64      `json:"fileSize"`
	Checksum   string     `json:"checksum"`
	CreatedAt  time.Time  `json:"createdAt"`
	RestoredAt *time.Time `json:"restoredAt,omitempty"`
}
type GitStatus struct {
	Configured  bool   `json:"configured"`
	Branch      string `json:"branch"`
	Commit      string `json:"commit"`
	CommitTime  string `json:"commitTime"`
	Dirty       bool   `json:"dirty"`
	RemoteAhead int    `json:"remoteAhead"`
	Repository  string `json:"repository"`
}
type SystemService struct {
	database *sql.DB
	cfg      config.Config
}

func NewSystemService(database *sql.DB, cfg config.Config) *SystemService {
	return &SystemService{database: database, cfg: cfg}
}
func (service *SystemService) CreateBackup(ctx context.Context) (Backup, error) {
	if err := os.MkdirAll(service.cfg.BackupDirectory, 0o750); err != nil {
		return Backup{}, err
	}
	now := time.Now().UTC()
	id := newID()
	fileName := fmt.Sprintf("blog-%s-%s.sqlite", now.Format("20060102T150405Z"), id[:8])
	destination := filepath.Join(service.cfg.BackupDirectory, fileName)
	if err := service.snapshotDatabase(ctx, destination); err != nil {
		return Backup{}, err
	}
	checksum, size, err := fileChecksum(destination)
	if err != nil {
		return Backup{}, err
	}
	item := Backup{ID: id, FileName: fileName, FileSize: size, Checksum: checksum, CreatedAt: now}
	_, err = service.database.ExecContext(ctx, `INSERT INTO backups (id,file_name,file_size,checksum,created_at) VALUES (?,?,?,?,?)`, item.ID, item.FileName, item.FileSize, item.Checksum, item.CreatedAt.Format(time.RFC3339Nano))
	return item, err
}
func (service *SystemService) ListBackups(ctx context.Context) ([]Backup, error) {
	rows, err := service.database.QueryContext(ctx, `SELECT id,file_name,file_size,checksum,created_at,restored_at FROM backups ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Backup, 0)
	for rows.Next() {
		var item Backup
		var created string
		var restored sql.NullString
		if err := rows.Scan(&item.ID, &item.FileName, &item.FileSize, &item.Checksum, &created, &restored); err != nil {
			return nil, err
		}
		item.CreatedAt = parseTime(created)
		if restored.Valid {
			value := parseTime(restored.String)
			item.RestoredAt = &value
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
func (service *SystemService) RestoreBackup(ctx context.Context, id string) (Backup, error) {
	var item Backup
	var created string
	err := service.database.QueryRowContext(ctx, `SELECT id,file_name,file_size,checksum,created_at FROM backups WHERE id=?`, id).Scan(&item.ID, &item.FileName, &item.FileSize, &item.Checksum, &created)
	if err == sql.ErrNoRows {
		return Backup{}, ErrNotFound
	}
	if err != nil {
		return Backup{}, err
	}
	item.CreatedAt = parseTime(created)
	source := filepath.Join(service.cfg.BackupDirectory, item.FileName)
	checksum, _, err := fileChecksum(source)
	if err != nil {
		return Backup{}, err
	}
	if checksum != item.Checksum {
		return Backup{}, fmt.Errorf("backup checksum mismatch")
	}
	if _, err := service.CreateBackup(ctx); err != nil {
		return Backup{}, fmt.Errorf("create pre-restore backup: %w", err)
	}
	return Backup{}, fmt.Errorf("backup verified; restore requires the configured maintenance script while the API is stopped")
}
func (service *SystemService) GitStatus(ctx context.Context) (GitStatus, error) {
	result := GitStatus{Configured: service.cfg.RepositoryDir != "", Branch: service.cfg.GitBranch, Repository: service.cfg.RepositoryDir}
	if !result.Configured {
		return result, nil
	}
	if info, err := os.Stat(service.cfg.RepositoryDir); err != nil || !info.IsDir() {
		return result, fmt.Errorf("configured repository directory is unavailable")
	}
	commit, err := service.git(ctx, "rev-parse", "HEAD")
	if err != nil {
		return result, err
	}
	result.Commit = strings.TrimSpace(commit)
	result.CommitTime, _ = service.git(ctx, "show", "-s", "--format=%cI", "HEAD")
	dirty, err := service.git(ctx, "status", "--porcelain")
	if err != nil {
		return result, err
	}
	result.Dirty = strings.TrimSpace(dirty) != ""
	ahead, err := service.git(ctx, "rev-list", "--count", fmt.Sprintf("HEAD..%s/%s", service.cfg.GitRemote, service.cfg.GitBranch))
	if err == nil {
		fmt.Sscanf(strings.TrimSpace(ahead), "%d", &result.RemoteAhead)
	}
	return result, nil
}
func (service *SystemService) CheckUpdates(ctx context.Context) (GitStatus, error) {
	if service.cfg.RepositoryDir == "" {
		return GitStatus{}, ErrInvalidInput
	}
	if _, err := service.git(ctx, "fetch", service.cfg.GitRemote, service.cfg.GitBranch); err != nil {
		return GitStatus{}, err
	}
	return service.GitStatus(ctx)
}
func (service *SystemService) Update(ctx context.Context, report func(int, string)) error {
	if service.cfg.RepositoryDir == "" || service.cfg.DeployScript == "" {
		return ErrInvalidInput
	}
	previous, err := service.git(ctx, "rev-parse", "HEAD")
	if err != nil {
		return err
	}
	previous = strings.TrimSpace(previous)
	report(15, "正在拉取远程更新")
	if _, err := service.git(ctx, "fetch", service.cfg.GitRemote, service.cfg.GitBranch); err != nil {
		return err
	}
	status, err := service.GitStatus(ctx)
	if err != nil {
		return err
	}
	if status.Dirty {
		return fmt.Errorf("repository contains uncommitted changes")
	}
	report(35, "正在快进合并")
	if _, err := service.git(ctx, "pull", "--ff-only", service.cfg.GitRemote, service.cfg.GitBranch); err != nil {
		return err
	}
	report(65, "正在运行固定部署脚本")
	command := exec.CommandContext(ctx, service.cfg.DeployScript)
	command.Dir = service.cfg.RepositoryDir
	output, err := command.CombinedOutput()
	if err != nil {
		return fmt.Errorf("deploy script failed: %w: %s", err, string(output))
	}
	report(90, "部署脚本已完成，等待健康检查")
	target, err := service.git(ctx, "rev-parse", "HEAD")
	if err != nil {
		return err
	}
	_, err = service.database.ExecContext(ctx, `INSERT INTO git_deployments (id,previous_commit,target_commit,branch,status,created_at,completed_at,details) VALUES (?,?,?,?,?,?,?,?)`, newID(), previous, strings.TrimSpace(target), service.cfg.GitBranch, "succeeded", time.Now().UTC().Format(time.RFC3339Nano), time.Now().UTC().Format(time.RFC3339Nano), "fixed deploy script completed")
	if err != nil {
		return err
	}
	return nil
}

func (service *SystemService) Rollback(ctx context.Context, report func(int, string)) error {
	if service.cfg.RepositoryDir == "" || service.cfg.RollbackScript == "" {
		return ErrInvalidInput
	}
	var target string
	err := service.database.QueryRowContext(ctx, `SELECT previous_commit FROM git_deployments WHERE status='succeeded' AND previous_commit<>'' ORDER BY completed_at DESC LIMIT 1`).Scan(&target)
	if err == sql.ErrNoRows {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	status, err := service.GitStatus(ctx)
	if err != nil {
		return err
	}
	if status.Dirty {
		return fmt.Errorf("repository contains uncommitted changes")
	}
	report(20, "正在校验上一次稳定 Commit")
	if _, err := service.git(ctx, "cat-file", "-e", target+"^{commit}"); err != nil {
		return err
	}
	report(45, "正在回退到上一次稳定 Commit")
	if _, err := service.git(ctx, "reset", "--hard", target); err != nil {
		return err
	}
	report(70, "正在运行固定回滚脚本")
	command := exec.CommandContext(ctx, service.cfg.RollbackScript)
	command.Dir = service.cfg.RepositoryDir
	output, err := command.CombinedOutput()
	if err != nil {
		return fmt.Errorf("rollback script failed: %w: %s", err, string(output))
	}
	_, err = service.database.ExecContext(ctx, `INSERT INTO git_deployments (id,previous_commit,target_commit,branch,status,created_at,completed_at,details) VALUES (?,?,?,?,?,?,?,?)`, newID(), status.Commit, target, service.cfg.GitBranch, "rolled_back", time.Now().UTC().Format(time.RFC3339Nano), time.Now().UTC().Format(time.RFC3339Nano), "fixed rollback script completed")
	if err != nil {
		return err
	}
	report(90, "回滚脚本已完成，等待健康检查")
	return nil
}
func (service *SystemService) git(ctx context.Context, args ...string) (string, error) {
	command := exec.CommandContext(ctx, "git", args...)
	command.Dir = service.cfg.RepositoryDir
	output, err := command.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("git %s: %w: %s", strings.Join(args, " "), err, string(output))
	}
	return string(output), nil
}
func copyFile(source, destination string) error {
	input, err := os.Open(source)
	if err != nil {
		return err
	}
	defer input.Close()
	output, err := os.OpenFile(destination, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o600)
	if err != nil {
		return err
	}
	defer output.Close()
	_, err = io.Copy(output, input)
	return err
}
func fileChecksum(path string) (string, int64, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", 0, err
	}
	defer file.Close()
	hash := sha256.New()
	size, err := io.Copy(hash, file)
	if err != nil {
		return "", 0, err
	}
	return hex.EncodeToString(hash.Sum(nil)), size, nil
}
func (service *SystemService) snapshotDatabase(ctx context.Context, destination string) error {
	escaped := strings.ReplaceAll(destination, "'", "''")
	_, err := service.database.ExecContext(ctx, "VACUUM INTO '"+escaped+"'")
	return err
}
