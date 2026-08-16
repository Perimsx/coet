package service

import (
	"context"
	"crypto/sha256"
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
	"github.com/kerntau/blog/cms-api/internal/database"
	"gorm.io/gorm"
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
	database  *gorm.DB
	cfg       config.Config
	startTime time.Time
}

func NewSystemService(db *gorm.DB, cfg config.Config) *SystemService {
	return &SystemService{database: db, cfg: cfg, startTime: time.Now()}
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
	record := database.Backup{
		ID:        item.ID,
		FileName:  item.FileName,
		FileSize:  item.FileSize,
		Checksum:  item.Checksum,
		CreatedAt: item.CreatedAt.Format(time.RFC3339Nano),
	}
	err = service.database.WithContext(ctx).Create(&record).Error
	return item, err
}

func (service *SystemService) ListBackups(ctx context.Context) ([]Backup, error) {
	var records []database.Backup
	if err := service.database.WithContext(ctx).Order("created_at DESC").Find(&records).Error; err != nil {
		return nil, err
	}

	items := make([]Backup, 0, len(records))
	for _, r := range records {
		created, _ := time.Parse(time.RFC3339Nano, r.CreatedAt)
		var restored *time.Time
		if r.RestoredAt != nil && *r.RestoredAt != "" {
			t, err := time.Parse(time.RFC3339Nano, *r.RestoredAt)
			if err == nil {
				restored = &t
			}
		}
		items = append(items, Backup{
			ID:         r.ID,
			FileName:   r.FileName,
			FileSize:   r.FileSize,
			Checksum:   r.Checksum,
			CreatedAt:  created,
			RestoredAt: restored,
		})
	}
	return items, nil
}

func (service *SystemService) RestoreBackup(ctx context.Context, id string) (Backup, error) {
	var record database.Backup
	if err := service.database.WithContext(ctx).First(&record, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return Backup{}, ErrNotFound
		}
		return Backup{}, err
	}

	created, _ := time.Parse(time.RFC3339Nano, record.CreatedAt)
	item := Backup{
		ID:        record.ID,
		FileName:  record.FileName,
		FileSize:  record.FileSize,
		Checksum:  record.Checksum,
		CreatedAt: created,
	}

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

	if err := service.database.WithContext(ctx).Exec("PRAGMA foreign_keys=OFF").Error; err != nil {
		return Backup{}, err
	}
	defer service.database.Exec("PRAGMA foreign_keys=ON")

	if err := service.database.WithContext(ctx).Exec("ATTACH DATABASE ? AS restore_source", source).Error; err != nil {
		return Backup{}, err
	}
	defer service.database.Exec("DETACH DATABASE restore_source")

	tables, err := service.tableNames(ctx, "restore_source")
	if err != nil {
		return Backup{}, err
	}

	err = service.database.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, table := range tables {
			if restoreExcludedTable(table) {
				continue
			}
			quoted := quoteIdentifier(table)
			if err := tx.Exec("DELETE FROM main." + quoted).Error; err != nil {
				return err
			}
			if err := tx.Exec("INSERT INTO main." + quoted + " SELECT * FROM restore_source." + quoted).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return Backup{}, err
	}

	nowStr := time.Now().UTC().Format(time.RFC3339Nano)
	if err := service.database.WithContext(ctx).Model(&database.Backup{}).Where("id = ?", id).Update("restored_at", nowStr).Error; err != nil {
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
	var names []string
	rows, err := service.database.WithContext(ctx).Raw("SELECT name FROM " + schema + `.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

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
		RepositoryURL:      service.cfg.GitRepositoryURL,
	}

	if service.cfg.RepositoryDir == "" {
		return result, nil
	}

	if _, err := os.Stat(filepath.Join(service.cfg.RepositoryDir, ".git")); err != nil {
		return result, nil
	}

	head, err := service.git(ctx, "rev-parse", "HEAD")
	if err == nil {
		result.Commit = strings.TrimSpace(head)
	}

	commitTime, err := service.git(ctx, "log", "-1", "--format=%cI")
	if err == nil {
		result.CommitTime = strings.TrimSpace(commitTime)
	}

	status, err := service.git(ctx, "status", "--porcelain")
	if err == nil {
		statusStr := strings.TrimSpace(status)
		result.Dirty = statusStr != ""
		if result.Dirty {
			contentPath := service.managedContentPathspec()
			for _, line := range strings.Split(statusStr, "\n") {
				line = strings.TrimSpace(line)
				if line == "" {
					continue
				}
				parts := strings.Fields(line)
				if len(parts) >= 2 {
					filePath := filepath.ToSlash(parts[len(parts)-1])
					if contentPath != "" && (filePath == contentPath || strings.HasPrefix(filePath, contentPath+"/")) {
						result.ContentDirty = true
					} else {
						result.CodeDirty = true
					}
				}
			}
		}
	}

	branch, err := service.git(ctx, "rev-parse", "--abbrev-ref", "HEAD")
	if err == nil {
		trimmed := strings.TrimSpace(branch)
		if trimmed != "" && trimmed != "HEAD" {
			result.Branch = trimmed
		}
	}

	remote := service.cfg.GitRemote
	if remote == "" {
		remote = "origin"
	}

	remoteCommit, err := service.git(ctx, "rev-parse", fmt.Sprintf("%s/%s", remote, result.Branch))
	if err == nil {
		result.RemoteCommit = strings.TrimSpace(remoteCommit)
	}

	if result.Commit != "" && result.RemoteCommit != "" {
		aheadBehind, err := service.git(ctx, "rev-list", "--left-right", "--count", fmt.Sprintf("%s...%s/%s", result.Commit, remote, result.Branch))
		if err == nil {
			var ahead, behind int
			if _, scanErr := fmt.Sscanf(aheadBehind, "%d\t%d", &ahead, &behind); scanErr == nil {
				result.LocalAhead = ahead
				result.RemoteAhead = behind
				result.Diverged = ahead > 0 && behind > 0
			}
		}
	}

	return result, nil
}

func (service *SystemService) CheckUpdates(ctx context.Context) (GitStatus, error) {
	if service.cfg.RepositoryDir == "" && service.cfg.GitRepositoryURL == "" {
		return GitStatus{}, ErrInvalidInput
	}

	if service.cfg.RepositoryDir != "" {
		if _, err := os.Stat(filepath.Join(service.cfg.RepositoryDir, ".git")); err == nil {
			remote := service.cfg.GitRemote
			if remote == "" {
				remote = "origin"
			}
			_, _ = service.git(ctx, "fetch", remote)
			return service.GitStatus(ctx)
		}
	}

	// 纯远程仓库 URL 检查模式（如仅有部署 commit marker 场景）
	if service.cfg.GitRepositoryURL != "" {
		currentCommit := ""
		if service.cfg.DeployedCommitFile != "" {
			if data, err := os.ReadFile(service.cfg.DeployedCommitFile); err == nil {
				currentCommit = strings.TrimSpace(string(data))
			}
		}

		branch := service.cfg.GitBranch
		if branch == "" {
			branch = "main"
		}

		cmd := exec.CommandContext(ctx, "git", "ls-remote", service.cfg.GitRepositoryURL, "refs/heads/"+branch)
		output, err := cmd.CombinedOutput()
		if err != nil {
			return GitStatus{}, fmt.Errorf("git ls-remote: %w: %s", err, string(output))
		}

		remoteCommit := ""
		fields := strings.Fields(string(output))
		if len(fields) > 0 {
			remoteCommit = fields[0]
		}

		remoteAhead := 0
		if remoteCommit != "" && currentCommit != "" && remoteCommit != currentCommit {
			remoteAhead = 1
		}

		return GitStatus{
			Configured:    true,
			Branch:        branch,
			Commit:        currentCommit,
			RemoteCommit:  remoteCommit,
			RemoteAhead:   remoteAhead,
			RepositoryURL: service.cfg.GitRepositoryURL,
		}, nil
	}

	return service.GitStatus(ctx)
}

func (service *SystemService) CheckForUpdates(ctx context.Context, report func(int, string)) error {
	if service.cfg.RepositoryDir == "" {
		return ErrInvalidInput
	}
	remote := service.cfg.GitRemote
	if remote == "" {
		remote = "origin"
	}
	report(30, fmt.Sprintf("正在从远程仓库 %s 拉取最新信息...", remote))
	if _, err := service.git(ctx, "fetch", remote); err != nil {
		return err
	}
	report(90, "检查完成")
	return nil
}

func (service *SystemService) Update(ctx context.Context, report func(int, string)) error {
	if service.cfg.RepositoryDir == "" || !scriptAvailable(service.cfg.DeployScript) {
		return ErrInvalidInput
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

	report(15, "正在创建部署前数据库备份")
	backup, err := service.CreateBackup(ctx)
	if err != nil {
		return restoreOriginal(fmt.Errorf("create pre-deploy backup: %w", err))
	}

	remote := service.cfg.GitRemote
	if remote == "" {
		remote = "origin"
	}

	report(25, fmt.Sprintf("正在从远程仓库 %s 拉取最新代码", remote))
	if _, err := service.git(ctx, "fetch", remote, status.Branch); err != nil {
		return restoreOriginal(err)
	}

	target := fmt.Sprintf("%s/%s", remote, status.Branch)
	targetCommit, err := service.git(ctx, "rev-parse", target)
	if err != nil {
		return restoreOriginal(err)
	}
	targetCommit = strings.TrimSpace(targetCommit)

	report(40, "正在同步到目标版本")
	if _, err := service.git(ctx, "reset", "--hard", target); err != nil {
		return restoreOriginal(err)
	}

	if err := service.restoreManagedContent(ctx, contentStash); err != nil {
		return restoreOriginal(fmt.Errorf("目标版本与后台内容变更冲突: %w", err))
	}
	contentStash = ""

	report(55, "正在执行自动化部署脚本")
	previous := status.Commit
	output, err := service.runDeploymentScript(ctx, service.cfg.DeployScript, "deploy", previous, targetCommit)
	if err != nil {
		report(80, "部署构建失败，正在恢复原版本")
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
		_ = service.recordDeployment(ctx, previous, targetCommit, "failed", details)
		if resetErr != nil {
			return fmt.Errorf("deploy script failed: %w; repository recovery failed: %v", err, resetErr)
		}
		return fmt.Errorf("deploy script failed and code was restored: %w: %s", err, output)
	}

	details := fmt.Sprintf("backup=%s; %s", backup.FileName, deploymentDetails(output))
	if err := service.recordDeployment(ctx, previous, targetCommit, "succeeded", details); err != nil {
		return err
	}
	service.scheduleRestart(report)
	return nil
}

func (service *SystemService) Rollback(ctx context.Context, report func(int, string)) error {
	if service.cfg.RepositoryDir == "" || !scriptAvailable(service.cfg.RollbackScript) {
		return ErrInvalidInput
	}
	var record database.GitDeployment
	err := service.database.WithContext(ctx).
		Where("status = 'succeeded' AND previous_commit <> ''").
		Order("created_at DESC").
		First(&record).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return ErrNotFound
		}
		return err
	}
	target := record.PreviousCommit

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
	var records []database.GitDeployment
	if err := service.database.WithContext(ctx).Order("created_at DESC").Limit(20).Find(&records).Error; err != nil {
		return nil, err
	}

	items := make([]DeploymentRecord, 0, len(records))
	for _, r := range records {
		completed := ""
		if r.CompletedAt != nil {
			completed = *r.CompletedAt
		}
		items = append(items, DeploymentRecord{
			ID:             r.ID,
			PreviousCommit: r.PreviousCommit,
			TargetCommit:   r.TargetCommit,
			Branch:         r.Branch,
			Status:         r.Status,
			CreatedAt:      r.CreatedAt,
			CompletedAt:    completed,
			Details:        r.Details,
		})
	}
	return items, nil
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
	record := database.GitDeployment{
		ID:             newID(),
		PreviousCommit: previous,
		TargetCommit:   target,
		Branch:         service.cfg.GitBranch,
		Status:         status,
		CreatedAt:      now,
		Details:        details,
	}
	return service.database.WithContext(ctx).Create(&record).Error
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
	return service.database.WithContext(ctx).Exec("VACUUM INTO '" + escaped + "'").Error
}
