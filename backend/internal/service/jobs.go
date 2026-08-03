package service

import (
	"context"
	"database/sql"
	"sync"
	"time"
)

type Job struct {
	ID          string     `json:"id"`
	Type        string     `json:"type"`
	Status      string     `json:"status"`
	Progress    int        `json:"progress"`
	Message     string     `json:"message"`
	Logs        string     `json:"logs"`
	CreatedAt   time.Time  `json:"createdAt"`
	StartedAt   *time.Time `json:"startedAt,omitempty"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`
}

type JobService struct {
	database *sql.DB
	lock     sync.Mutex
	active   bool
}

func NewJobService(database *sql.DB) *JobService { return &JobService{database: database} }
func (service *JobService) Start(ctx context.Context, kind string, runner func(context.Context, func(int, string)) error) (Job, error) {
	service.lock.Lock()
	if service.active {
		service.lock.Unlock()
		return Job{}, ErrConflict
	}
	service.active = true
	service.lock.Unlock()
	now := time.Now().UTC()
	job := Job{ID: newID(), Type: kind, Status: "queued", CreatedAt: now, Message: "任务已排队"}
	if _, err := service.database.ExecContext(ctx, `INSERT INTO system_jobs (id,job_type,status,progress,message,logs,created_at) VALUES (?,?,?,?,?,?,?)`, job.ID, job.Type, job.Status, 0, job.Message, "", now.Format(time.RFC3339Nano)); err != nil {
		service.release()
		return Job{}, err
	}
	go func() {
		background := context.Background()
		started := time.Now().UTC()
		_, _ = service.database.ExecContext(background, `UPDATE system_jobs SET status=?,started_at=? WHERE id=?`, "running", started.Format(time.RFC3339Nano), job.ID)
		service.update(background, job.ID, "running", 5, "任务执行中", "")
		report := func(progress int, message string) {
			service.update(background, job.ID, "running", progress, message, "")
		}
		err := runner(background, report)
		completed := time.Now().UTC()
		if err != nil {
			service.update(background, job.ID, "failed", 100, "任务失败", err.Error())
			service.database.ExecContext(background, `UPDATE system_jobs SET completed_at=? WHERE id=?`, completed.Format(time.RFC3339Nano), job.ID)
		} else {
			service.update(background, job.ID, "succeeded", 100, "任务完成", "")
			service.database.ExecContext(background, `UPDATE system_jobs SET completed_at=? WHERE id=?`, completed.Format(time.RFC3339Nano), job.ID)
		}
		service.release()
	}()
	return job, nil
}
func (service *JobService) release() {
	service.lock.Lock()
	service.active = false
	service.lock.Unlock()
}
func (service *JobService) update(ctx context.Context, id, status string, progress int, message, logs string) {
	_, _ = service.database.ExecContext(ctx, `UPDATE system_jobs SET status=?,progress=?,message=?,logs=CASE WHEN ?='' THEN logs ELSE logs || ? || char(10) END WHERE id=?`, status, progress, message, logs, logs, id)
}
func (service *JobService) Get(ctx context.Context, id string) (Job, error) {
	var item Job
	var created, started, completed string
	var startedNull, completedNull sql.NullString
	err := service.database.QueryRowContext(ctx, `SELECT id,job_type,status,progress,message,logs,created_at,started_at,completed_at FROM system_jobs WHERE id=?`, id).Scan(&item.ID, &item.Type, &item.Status, &item.Progress, &item.Message, &item.Logs, &created, &startedNull, &completedNull)
	if err == sql.ErrNoRows {
		return Job{}, ErrNotFound
	}
	if err != nil {
		return Job{}, err
	}
	item.CreatedAt, _ = time.Parse(time.RFC3339Nano, created)
	if startedNull.Valid {
		started = startedNull.String
		value := parseTime(started)
		item.StartedAt = &value
	}
	if completedNull.Valid {
		completed = completedNull.String
		value := parseTime(completed)
		item.CompletedAt = &value
	}
	return item, nil
}
func (service *JobService) List(ctx context.Context, page, pageSize int) ([]Job, int, error) {
	var total int
	if err := service.database.QueryRowContext(ctx, `SELECT COUNT(*) FROM system_jobs`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := service.database.QueryContext(ctx, `SELECT id FROM system_jobs ORDER BY created_at DESC LIMIT ? OFFSET ?`, pageSize, (page-1)*pageSize)
	if err != nil {
		return nil, 0, err
	}
	ids := make([]string, 0)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, 0, err
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	if err := rows.Close(); err != nil {
		return nil, 0, err
	}
	items := make([]Job, 0, len(ids))
	for _, id := range ids {
		item, err := service.Get(ctx, id)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	return items, total, nil
}
