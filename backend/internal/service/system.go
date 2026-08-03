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
	"runtime"
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
	Configured         bool   `json:"configured"`
	DeployConfigured   bool   `json:"deployConfigured"`
	RollbackConfigured bool   `json:"rollbackConfigured"`
	Branch             string `json:"branch"`
	Commit             string `json:"commit"`
	CommitTime         string `json:"commitTime"`
	Dirty              bool   `json:"dirty"`
	LocalAhead         int    `json:"localAhead"`
	RemoteAhead        int    `json:"remoteAhead"`
	Diverged           bool   `json:"diverged"`
	Repository         string `json:"repository"`
}
type GitCommitItem struct {
	Hash      string `json:"hash"`
	ShortHash string `json:"shortHash"`
	Subject   string `json:"subject"`
	Author    string `json:"author"`
	Time      string `json:"time"`
	IsCurrent bool   `json:"isCurrent"`
}
type DeploymentRecord struct {
	ID             string `json:"id"`
	PreviousCommit string `json:"previousCommit"`
	TargetCommit   string `json:"targetCommit"`
	Branch         string `json:"branch"`
	Status         string `json:"status"`
	CreatedAt      string `json:"createdAt"`
	CompletedAt    string `json:"completedAt"`
	Details        string `json:"details"`
}
type SystemInfo struct {
	OS             string  `json:"os"`
	Arch           string  `json:"arch"`
	Hostname       string  `json:"hostname"`
	GoVersion      string  `json:"goVersion"`
	NumCPU         int     `json:"numCPU"`
	Goroutines     int     `json:"goroutines"`
	AllocMemMB     float64 `json:"allocMemMB"`
	SysMemMB       float64 `json:"sysMemMB"`
	NumGC          uint32  `json:"numGC"`
	PID            int     `json:"pid"`
	UptimeSeconds  int64   `json:"uptimeSeconds"`
	DatabaseSizeMB float64 `json:"databaseSizeMB"`
}
type SystemService struct {
	database  *sql.DB
	cfg       config.Config
	startTime time.Time
}

func NewSystemService(database *sql.DB, cfg config.Config) *SystemService {
	return &SystemService{database: database, cfg: cfg, startTime: time.Now()}
}

func (service *SystemService) GetSystemInfo(ctx context.Context) SystemInfo {
	hostname, _ := os.Hostname()
	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)

	var dbSizeMB float64
	if fi, err := os.Stat(service.cfg.DatabasePath); err == nil {
		dbSizeMB = float64(fi.Size()) / (1024 * 1024)
	}

	return SystemInfo{
		OS:             runtime.GOOS,
		Arch:           runtime.GOARCH,
		Hostname:       hostname,
		GoVersion:      runtime.Version(),
		NumCPU:         runtime.NumCPU(),
		Goroutines:     runtime.NumGoroutine(),
		AllocMemMB:     float64(mem.Alloc) / (1024 * 1024),
		SysMemMB:       float64(mem.Sys) / (1024 * 1024),
		NumGC:          mem.NumGC,
		PID:            os.Getpid(),
		UptimeSeconds:  int64(time.Since(service.startTime).Seconds()),
		DatabaseSizeMB: dbSizeMB,
	}
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
	if filepath.Base(item.FileName) != item.FileName {
		return Backup{}, ErrInvalidInput
	}
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
	if _, err := service.database.ExecContext(ctx, "PRAGMA foreign_keys=OFF"); err != nil {
		return Backup{}, err
	}
	defer service.database.ExecContext(context.Background(), "PRAGMA foreign_keys=ON")
	if _, err := service.database.ExecContext(ctx, "ATTACH DATABASE ? AS restore_source", source); err != nil {
		return Backup{}, err
	}
	defer service.database.ExecContext(context.Background(), "DETACH DATABASE restore_source")
	tables, err := service.tableNames(ctx, "restore_source")
	if err != nil {
		return Backup{}, err
	}
	transaction, err := service.database.BeginTx(ctx, nil)
	if err != nil {
		return Backup{}, err
	}
	for _, table := range tables {
		if restoreExcludedTable(table) {
			continue
		}
		quoted := quoteIdentifier(table)
		if _, err := transaction.ExecContext(ctx, "DELETE FROM main."+quoted); err != nil {
			transaction.Rollback()
			return Backup{}, err
		}
		if _, err := transaction.ExecContext(ctx, "INSERT INTO main."+quoted+" SELECT * FROM restore_source."+quoted); err != nil {
			transaction.Rollback()
			return Backup{}, err
		}
	}
	if err := transaction.Commit(); err != nil {
		return Backup{}, err
	}
	if _, err := service.database.ExecContext(ctx, `UPDATE backups SET restored_at=? WHERE id=?`, time.Now().UTC().Format(time.RFC3339Nano), id); err != nil {
		return Backup{}, err
	}
	restoredAt := time.Now().UTC()
	item.RestoredAt = &restoredAt
	return item, nil
}

func restoreExcludedTable(table string) bool {
	switch table {
	case "backups", "audit_logs", "system_jobs", "admin_sessions", "git_deployments":
		return true
	default:
		return false
	}
}

func (service *SystemService) tableNames(ctx context.Context, schema string) ([]string, error) {
	rows, err := service.database.QueryContext(ctx, "SELECT name FROM "+schema+`.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		names = append(names, name)
	}
	return names, rows.Err()
}

func quoteIdentifier(value string) string {
	return `"` + strings.ReplaceAll(value, `"`, `""`) + `"`
}
func (service *SystemService) GitStatus(ctx context.Context) (GitStatus, error) {
	result := GitStatus{
		Configured:         service.cfg.RepositoryDir != "",
		DeployConfigured:   scriptAvailable(service.cfg.DeployScript),
		RollbackConfigured: scriptAvailable(service.cfg.RollbackScript),
		Branch:             service.cfg.GitBranch,
		Repository:         service.cfg.RepositoryDir,
	}
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
	branch, err := service.git(ctx, "branch", "--show-current")
	if err != nil {
		return result, err
	}
	result.Branch = strings.TrimSpace(branch)
	result.CommitTime, _ = service.git(ctx, "show", "-s", "--format=%cI", "HEAD")
	dirty, err := service.git(ctx, "status", "--porcelain")
	if err != nil {
		return result, err
	}
	result.Dirty = strings.TrimSpace(dirty) != ""
	counts, err := service.git(ctx, "rev-list", "--left-right", "--count", fmt.Sprintf("HEAD...%s/%s", service.cfg.GitRemote, service.cfg.GitBranch))
	if err == nil {
		fmt.Sscanf(strings.TrimSpace(counts), "%d\t%d", &result.LocalAhead, &result.RemoteAhead)
		result.Diverged = result.LocalAhead > 0 && result.RemoteAhead > 0
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
	status, err := service.GitStatus(ctx)
	if err != nil {
		return GitStatus{}, err
	}
	if status.Branch != service.cfg.GitBranch {
		return GitStatus{}, fmt.Errorf("当前分支 %q 与配置分支 %q 不一致", status.Branch, service.cfg.GitBranch)
	}
	return status, nil
}
func (service *SystemService) Update(ctx context.Context, report func(int, string)) error {
	if service.cfg.RepositoryDir == "" || !scriptAvailable(service.cfg.DeployScript) {
		return ErrInvalidInput
	}
	previous, err := service.git(ctx, "rev-parse", "HEAD")
	if err != nil {
		return err
	}
	previous = strings.TrimSpace(previous)
	status, err := service.GitStatus(ctx)
	if err != nil {
		return err
	}
	if status.Branch != service.cfg.GitBranch {
		return fmt.Errorf("当前分支 %q 与配置分支 %q 不一致", status.Branch, service.cfg.GitBranch)
	}
	if status.Dirty {
		return fmt.Errorf("repository contains uncommitted changes")
	}
	report(10, "正在拉取远程更新")
	if _, err := service.git(ctx, "fetch", service.cfg.GitRemote, service.cfg.GitBranch); err != nil {
		return err
	}
	status, err = service.GitStatus(ctx)
	if err != nil {
		return err
	}
	if status.Dirty {
		return fmt.Errorf("repository contains uncommitted changes")
	}
	if status.Diverged {
		return fmt.Errorf("本地分支与远程分支已经分叉，拒绝自动更新")
	}
	if status.LocalAhead > 0 {
		return fmt.Errorf("本地分支领先远程 %d 个提交，拒绝自动更新", status.LocalAhead)
	}
	if status.RemoteAhead == 0 {
		report(90, "当前已是最新版本，无需重新部署")
		return nil
	}
	target, err := service.git(ctx, "rev-parse", service.cfg.GitRemote+"/"+service.cfg.GitBranch)
	if err != nil {
		return err
	}
	target = strings.TrimSpace(target)

	report(20, "正在创建更新前数据库备份")
	backup, err := service.CreateBackup(ctx)
	if err != nil {
		return fmt.Errorf("create pre-deploy backup: %w", err)
	}

	report(35, "正在快进合并")
	if _, err := service.git(ctx, "merge", "--ff-only", service.cfg.GitRemote+"/"+service.cfg.GitBranch); err != nil {
		return err
	}
	report(55, "正在安装依赖并构建新版本")
	output, err := service.runDeploymentScript(ctx, service.cfg.DeployScript, "update", previous, target)
	if err != nil {
		report(80, "部署失败，正在恢复更新前代码")
		_, resetErr := service.git(ctx, "reset", "--hard", previous)
		details := fmt.Sprintf("backup=%s; deploy failed: %v; output=%s", backup.FileName, err, deploymentDetails(output))
		if resetErr != nil {
			details += "; reset failed: " + resetErr.Error()
		}
		_ = service.recordDeployment(ctx, previous, target, "failed", details)
		if resetErr != nil {
			return fmt.Errorf("deploy script failed: %w; repository recovery failed: %v", err, resetErr)
		}
		return fmt.Errorf("deploy script failed and code was restored: %w: %s", err, output)
	}
	report(90, "新版本构建完成，正在记录部署结果")
	details := fmt.Sprintf("backup=%s; %s", backup.FileName, deploymentDetails(output))
	if err := service.recordDeployment(ctx, previous, target, "succeeded", details); err != nil {
		return err
	}
	service.scheduleRestart(report)
	return nil
}

func (service *SystemService) Rollback(ctx context.Context, report func(int, string)) error {
	if service.cfg.RepositoryDir == "" || !scriptAvailable(service.cfg.RollbackScript) {
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
	report(15, "正在创建回滚前数据库备份")
	backup, err := service.CreateBackup(ctx)
	if err != nil {
		return fmt.Errorf("create pre-rollback backup: %w", err)
	}
	report(25, "正在校验上一次稳定 Commit")
	if _, err := service.git(ctx, "cat-file", "-e", target+"^{commit}"); err != nil {
		return err
	}
	report(40, "正在回退到上一次稳定 Commit")
	if _, err := service.git(ctx, "reset", "--hard", target); err != nil {
		return err
	}
	report(55, "正在构建回滚版本")
	output, err := service.runDeploymentScript(ctx, service.cfg.RollbackScript, "rollback", status.Commit, target)
	if err != nil {
		report(80, "回滚构建失败，正在恢复原版本")
		_, resetErr := service.git(ctx, "reset", "--hard", status.Commit)
		details := fmt.Sprintf("backup=%s; rollback failed: %v; output=%s", backup.FileName, err, deploymentDetails(output))
		if resetErr != nil {
			details += "; reset failed: " + resetErr.Error()
		}
		_ = service.recordDeployment(ctx, status.Commit, target, "rollback_failed", details)
		if resetErr != nil {
			return fmt.Errorf("rollback script failed: %w; repository recovery failed: %v", err, resetErr)
		}
		return fmt.Errorf("rollback script failed and code was restored: %w: %s", err, output)
	}
	details := fmt.Sprintf("backup=%s; %s", backup.FileName, deploymentDetails(output))
	if err := service.recordDeployment(ctx, status.Commit, target, "rolled_back", details); err != nil {
		return err
	}
	service.scheduleRestart(report)
	return nil
}
func (service *SystemService) GitLog(ctx context.Context, count int) ([]GitCommitItem, error) {
	if service.cfg.RepositoryDir == "" {
		return nil, ErrInvalidInput
	}
	if count <= 0 || count > 100 {
		count = 30
	}
	output, err := service.git(ctx, "log", fmt.Sprintf("-n%d", count), "--format=%H|%s|%an|%cI")
	if err != nil {
		return nil, err
	}
	head, _ := service.git(ctx, "rev-parse", "HEAD")
	head = strings.TrimSpace(head)

	var items []GitCommitItem
	lines := strings.Split(strings.ReplaceAll(output, "\r\n", "\n"), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.Split(line, "|")
		if len(parts) < 4 {
			continue
		}
		hash := parts[0]
		short := hash
		if len(hash) >= 7 {
			short = hash[:7]
		}
		items = append(items, GitCommitItem{
			Hash:      hash,
			ShortHash: short,
			Subject:   parts[1],
			Author:    parts[2],
			Time:      parts[3],
			IsCurrent: hash == head,
		})
	}
	return items, nil
}

func (service *SystemService) ListDeployments(ctx context.Context) ([]DeploymentRecord, error) {
	rows, err := service.database.QueryContext(ctx, `SELECT id, previous_commit, target_commit, branch, status, created_at, completed_at, details FROM git_deployments ORDER BY created_at DESC LIMIT 20`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DeploymentRecord, 0)
	for rows.Next() {
		var item DeploymentRecord
		if err := rows.Scan(&item.ID, &item.PreviousCommit, &item.TargetCommit, &item.Branch, &item.Status, &item.CreatedAt, &item.CompletedAt, &item.Details); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *SystemService) runDeploymentScript(ctx context.Context, scriptPath, action, previous, target string) (string, error) {
	var command *exec.Cmd
	switch strings.ToLower(filepath.Ext(scriptPath)) {
	case ".js", ".mjs", ".cjs":
		command = exec.CommandContext(ctx, "node", scriptPath)
	case ".sh":
		command = exec.CommandContext(ctx, "sh", scriptPath)
	case ".ps1":
		command = exec.CommandContext(ctx, "pwsh", "-NoProfile", "-File", scriptPath)
	default:
		command = exec.CommandContext(ctx, scriptPath)
	}
	command.Dir = service.cfg.RepositoryDir
	command.Env = append(os.Environ(),
		"CMS_DEPLOY_ACTION="+action,
		"CMS_PREVIOUS_COMMIT="+previous,
		"CMS_TARGET_COMMIT="+target,
		"CMS_REPOSITORY_DIR="+service.cfg.RepositoryDir,
	)
	output, err := command.CombinedOutput()
	if err != nil {
		return string(output), err
	}
	return string(output), nil
}

func (service *SystemService) recordDeployment(ctx context.Context, previous, target, status, details string) error {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	_, err := service.database.ExecContext(ctx, `INSERT INTO git_deployments (id,previous_commit,target_commit,branch,status,created_at,completed_at,details) VALUES (?,?,?,?,?,?,?,?)`, newID(), previous, target, service.cfg.GitBranch, status, now, now, details)
	return err
}

func (service *SystemService) scheduleRestart(report func(int, string)) {
	if !service.cfg.RestartAfterDeploy {
		report(95, "部署完成；API 未由进程管理器托管，请手动重启 API")
		return
	}
	report(95, "部署完成；API 将由进程管理器自动重启")
	go func() {
		time.Sleep(3 * time.Second)
		os.Exit(0)
	}()
}

func scriptAvailable(path string) bool {
	if strings.TrimSpace(path) == "" {
		return false
	}
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

func deploymentDetails(output string) string {
	value := strings.TrimSpace(output)
	if value == "" {
		return "deployment script completed"
	}
	const maxLength = 8000
	if len(value) > maxLength {
		return value[len(value)-maxLength:]
	}
	return value
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
