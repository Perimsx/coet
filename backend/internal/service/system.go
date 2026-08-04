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
	RemoteCommit       string `json:"remoteCommit"`
	CommitTime         string `json:"commitTime"`
	Dirty              bool   `json:"dirty"`
	ContentDirty       bool   `json:"contentDirty"`
	CodeDirty          bool   `json:"codeDirty"`
	LocalAhead         int    `json:"localAhead"`
	RemoteAhead        int    `json:"remoteAhead"`
	Diverged           bool   `json:"diverged"`
	Repository         string `json:"repository"`
	RepositoryURL      string `json:"repositoryUrl"`
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
		Configured:         false,
		DeployConfigured:   scriptAvailable(service.cfg.DeployScript),
		RollbackConfigured: scriptAvailable(service.cfg.RollbackScript),
		Branch:             service.cfg.GitBranch,
		Repository:         service.cfg.RepositoryDir,
	}
	remoteURL, err := service.remoteRepositoryURL(ctx)
	if err != nil {
		if service.cfg.RepositoryDir == "" && strings.TrimSpace(service.cfg.GitRepositoryURL) == "" {
			return result, nil
		}
		return result, err
	}
	result.Configured = true
	result.RepositoryURL = remoteURL
	remoteCommit, err := service.remoteCommit(ctx, remoteURL)
	if err != nil {
		return result, err
	}
	result.RemoteCommit = remoteCommit
	result.Commit = service.deployedCommit()
	if result.Commit == "" && service.cfg.RepositoryDir != "" {
		// Compatibility for installations created before the deployed marker.
		if commit, fallbackErr := service.git(ctx, "rev-parse", "HEAD"); fallbackErr == nil {
			result.Commit = strings.TrimSpace(commit)
		}
	}
	if result.Commit != "" && result.Commit == result.RemoteCommit {
		result.CommitTime, _ = service.git(ctx, "show", "-s", "--format=%cI", result.Commit)
	} else {
		result.RemoteAhead = 1
	}
	if contentPath := service.managedContentPathspec(); contentPath != "" {
		if content, contentErr := service.git(ctx, "status", "--porcelain", "--untracked-files=all", "--", contentPath); contentErr == nil {
			result.ContentDirty = strings.TrimSpace(content) != ""
		}
	}
	return result, nil
}

func (service *SystemService) remoteRepositoryURL(ctx context.Context) (string, error) {
	if value := strings.TrimSpace(service.cfg.GitRepositoryURL); value != "" {
		return value, nil
	}
	if service.cfg.RepositoryDir == "" {
		return "", fmt.Errorf("CMS_GIT_REPOSITORY_URL is not configured")
	}
	value, err := service.git(ctx, "remote", "get-url", service.cfg.GitRemote)
	if err != nil || strings.TrimSpace(value) == "" {
		return "", fmt.Errorf("CMS_GIT_REPOSITORY_URL is not configured")
	}
	return strings.TrimSpace(value), nil
}

func (service *SystemService) remoteCommit(ctx context.Context, repositoryURL string) (string, error) {
	command := exec.CommandContext(ctx, "git", "ls-remote", repositoryURL, "refs/heads/"+service.cfg.GitBranch)
	output, err := command.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("读取远程仓库 %s/%s 失败: %w: %s", repositoryURL, service.cfg.GitBranch, err, strings.TrimSpace(string(output)))
	}
	fields := strings.Fields(string(output))
	if len(fields) == 0 || !isCommitHash(fields[0]) {
		return "", fmt.Errorf("远程仓库未找到分支 %q", service.cfg.GitBranch)
	}
	return fields[0], nil
}

func (service *SystemService) deployedCommit() string {
	if strings.TrimSpace(service.cfg.DeployedCommitFile) == "" {
		return ""
	}
	content, err := os.ReadFile(service.cfg.DeployedCommitFile)
	if err != nil {
		return ""
	}
	value := strings.TrimSpace(string(content))
	if !isCommitHash(value) {
		return ""
	}
	return value
}

func isCommitHash(value string) bool {
	if len(value) < 7 || len(value) > 64 {
		return false
	}
	for _, char := range value {
		if !((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F')) {
			return false
		}
	}
	return true
}

func (service *SystemService) CheckUpdates(ctx context.Context) (GitStatus, error) {
	if strings.TrimSpace(service.cfg.GitRepositoryURL) == "" && service.cfg.RepositoryDir == "" {
		return GitStatus{}, ErrInvalidInput
	}
	status, err := service.GitStatus(ctx)
	if err != nil {
		return GitStatus{}, err
	}
	return status, nil
}
func (service *SystemService) Update(ctx context.Context, report func(int, string)) error {
	if service.cfg.RepositoryDir == "" || !scriptAvailable(service.cfg.DeployScript) {
		return ErrInvalidInput
	}
	status, err := service.GitStatus(ctx)
	if err != nil {
		return err
	}
	previous := strings.TrimSpace(status.Commit)
	if previous == "" {
		return fmt.Errorf("当前线上 Commit 未记录，请先执行一次完整部署以建立版本基线")
	}
	remoteURL, err := service.remoteRepositoryURL(ctx)
	if err != nil {
		return err
	}
	contentStash, err := service.stashManagedContent(ctx)
	if err != nil {
		return fmt.Errorf("暂存后台内容变更失败: %w", err)
	}
	restorePrevious := func(cause error) error {
		recoveryErr := service.resetAndRestoreContent(ctx, previous, contentStash)
		if recoveryErr != nil {
			return fmt.Errorf("%w；恢复原代码和后台内容失败: %v", cause, recoveryErr)
		}
		return cause
	}
	if contentStash != "" {
		report(8, "已安全暂存后台内容变更")
	}
	report(10, "正在拉取远程更新")
	if _, err := service.git(ctx, "fetch", "--no-tags", remoteURL, service.cfg.GitBranch); err != nil {
		return restorePrevious(err)
	}
	remoteCommit, err := service.remoteCommit(ctx, remoteURL)
	if err != nil {
		return restorePrevious(err)
	}
	if remoteCommit == previous {
		if err := service.restoreManagedContent(ctx, contentStash); err != nil {
			return restorePrevious(fmt.Errorf("恢复后台内容变更失败: %w", err))
		}
		contentStash = ""
		report(90, "当前已是最新版本，无需重新部署")
		return nil
	}
	target := remoteCommit

	report(20, "正在创建更新前数据库备份")
	backup, err := service.CreateBackup(ctx)
	if err != nil {
		return restorePrevious(fmt.Errorf("create pre-deploy backup: %w", err))
	}

	report(35, "正在快进合并")
	if _, err := service.git(ctx, "merge", "--ff-only", "FETCH_HEAD"); err != nil {
		return restorePrevious(err)
	}
	if err := service.restoreManagedContent(ctx, contentStash); err != nil {
		return restorePrevious(fmt.Errorf("远程版本与后台内容变更冲突: %w", err))
	}
	contentStash = ""
	report(45, "后台内容变更已恢复到新代码版本")
	report(55, "正在安装依赖并构建新版本")
	output, err := service.runDeploymentScript(ctx, service.cfg.DeployScript, "update", previous, target)
	if err != nil {
		report(80, "部署失败，正在恢复更新前代码")
		recoveryStash, stashErr := service.stashManagedContent(ctx)
		var resetErr error
		if stashErr == nil {
			resetErr = service.resetAndRestoreContent(ctx, previous, recoveryStash)
		} else {
			resetErr = fmt.Errorf("无法在回退前保护后台内容: %w", stashErr)
		}
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
	if status.CodeDirty {
		return fmt.Errorf("代码目录存在未提交变更；请先提交或还原这些变更")
	}
	contentStash, err := service.stashManagedContent(ctx)
	if err != nil {
		return fmt.Errorf("暂存后台内容变更失败: %w", err)
	}
	restoreOriginal := func(cause error) error {
		recoveryErr := service.resetAndRestoreContent(ctx, status.Commit, contentStash)
		if recoveryErr != nil {
			return fmt.Errorf("%w；恢复原代码和后台内容失败: %v", cause, recoveryErr)
		}
		return cause
	}
	if contentStash != "" {
		report(8, "已安全暂存后台内容变更")
	}
	report(15, "正在创建回滚前数据库备份")
	backup, err := service.CreateBackup(ctx)
	if err != nil {
		return restoreOriginal(fmt.Errorf("create pre-rollback backup: %w", err))
	}
	report(25, "正在校验上一次稳定 Commit")
	if _, err := service.git(ctx, "cat-file", "-e", target+"^{commit}"); err != nil {
		return restoreOriginal(err)
	}
	report(40, "正在回退到上一次稳定 Commit")
	if _, err := service.git(ctx, "reset", "--hard", target); err != nil {
		return restoreOriginal(err)
	}
	if err := service.restoreManagedContent(ctx, contentStash); err != nil {
		return restoreOriginal(fmt.Errorf("稳定版本与后台内容变更冲突: %w", err))
	}
	contentStash = ""
	report(55, "正在构建回滚版本")
	output, err := service.runDeploymentScript(ctx, service.cfg.RollbackScript, "rollback", status.Commit, target)
	if err != nil {
		report(80, "回滚构建失败，正在恢复原版本")
		recoveryStash, stashErr := service.stashManagedContent(ctx)
		var resetErr error
		if stashErr == nil {
			resetErr = service.resetAndRestoreContent(ctx, status.Commit, recoveryStash)
		} else {
			resetErr = fmt.Errorf("无法在回退前保护后台内容: %w", stashErr)
		}
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
		return []GitCommitItem{}, nil
	}
	if _, err := os.Stat(filepath.Join(service.cfg.RepositoryDir, ".git")); err != nil {
		return []GitCommitItem{}, nil
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

func (service *SystemService) managedContentPathspec() string {
	if service.cfg.RepositoryDir == "" || strings.TrimSpace(service.cfg.ContentDirectory) == "" {
		return ""
	}
	repository, err := filepath.Abs(service.cfg.RepositoryDir)
	if err != nil {
		return ""
	}
	contentDirectory, err := filepath.Abs(service.cfg.ContentDirectory)
	if err != nil {
		return ""
	}
	relative, err := filepath.Rel(repository, contentDirectory)
	if err != nil || relative == "." || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
		return ""
	}
	return filepath.ToSlash(relative)
}

func (service *SystemService) stashManagedContent(ctx context.Context) (string, error) {
	contentPath := service.managedContentPathspec()
	if contentPath == "" {
		return "", nil
	}
	status, err := service.git(ctx, "status", "--porcelain", "--untracked-files=all", "--", contentPath)
	if err != nil || strings.TrimSpace(status) == "" {
		return "", err
	}
	message := "xuzhan-cms-auto-" + time.Now().UTC().Format("20060102T150405.000000000Z")
	if _, err := service.git(ctx, "stash", "push", "--include-untracked", "--message", message, "--", contentPath); err != nil {
		return "", err
	}
	stash, err := service.git(ctx, "rev-parse", "--verify", "refs/stash")
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(stash), nil
}

func (service *SystemService) restoreManagedContent(ctx context.Context, stash string) error {
	if stash == "" {
		return nil
	}
	if _, err := service.git(ctx, "stash", "apply", "--index", stash); err != nil {
		return err
	}
	top, err := service.git(ctx, "rev-parse", "--verify", "refs/stash")
	if err == nil && strings.TrimSpace(top) == stash {
		if _, err := service.git(ctx, "stash", "drop", "stash@{0}"); err != nil {
			return err
		}
	}
	return nil
}

func (service *SystemService) resetAndRestoreContent(ctx context.Context, commit, stash string) error {
	if _, err := service.git(ctx, "reset", "--hard", commit); err != nil {
		return err
	}
	return service.restoreManagedContent(ctx, stash)
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
