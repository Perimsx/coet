package service

import (
	"context"
	"sync"
	"time"

	"github.com/kerntau/blog/cms-api/internal/database"
	"gorm.io/gorm"
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
	database *gorm.DB
	lock     sync.Mutex
	active   bool
}

type JobCompletion func(context.Context, Job, error)
type JobCreated func(Job)

func NewJobService(db *gorm.DB) *JobService {
	return &JobService{database: db}
}

func (service *JobService) Start(ctx context.Context, kind string, runner func(context.Context, func(int, string)) error) (Job, error) {
	return service.StartWithCallbacks(ctx, kind, runner, nil, nil)
}

func (service *JobService) StartWithCompletion(ctx context.Context, kind string, runner func(context.Context, func(int, string)) error, completion JobCompletion) (Job, error) {
	return service.StartWithCallbacks(ctx, kind, runner, nil, completion)
}

func (service *JobService) StartWithCallbacks(ctx context.Context, kind string, runner func(context.Context, func(int, string)) error, created JobCreated, completion JobCompletion) (Job, error) {
	service.lock.Lock()
	if service.active {
		service.lock.Unlock()
		return Job{}, ErrConflict
	}
	service.active = true
	service.lock.Unlock()

	now := time.Now().UTC()
	job := Job{ID: newID(), Type: kind, Status: "queued", CreatedAt: now, Message: "任务已排队"}
	record := database.SystemJob{
		ID:        job.ID,
		JobType:   job.Type,
		Status:    job.Status,
		Progress:  0,
		Message:   job.Message,
		Logs:      "",
		CreatedAt: now.Format(time.RFC3339Nano),
	}

	if err := service.database.WithContext(ctx).Create(&record).Error; err != nil {
		service.release()
		return Job{}, err
	}
	if created != nil {
		created(job)
	}

	go func() {
		background := context.Background()
		started := time.Now().UTC()
		startedStr := started.Format(time.RFC3339Nano)
		_ = service.database.WithContext(background).Model(&database.SystemJob{}).Where("id = ?", job.ID).Updates(map[string]interface{}{
			"status":     "running",
			"started_at": &startedStr,
		}).Error

		service.update(background, job.ID, "running", 5, "任务执行中", "")
		report := func(progress int, message string) {
			service.update(background, job.ID, "running", progress, message, message)
		}

		err := runner(background, report)
		completed := time.Now().UTC()
		completedStr := completed.Format(time.RFC3339Nano)

		if err != nil {
			service.update(background, job.ID, "failed", 100, "任务失败", err.Error())
			_ = service.database.WithContext(background).Model(&database.SystemJob{}).Where("id = ?", job.ID).Update("completed_at", &completedStr).Error
		} else {
			service.update(background, job.ID, "succeeded", 100, "任务完成", "任务完成")
			_ = service.database.WithContext(background).Model(&database.SystemJob{}).Where("id = ?", job.ID).Update("completed_at", &completedStr).Error
		}

		if completion != nil {
			finalJob, getErr := service.Get(background, job.ID)
			if getErr != nil {
				finalJob = job
			}
			completion(background, finalJob, err)
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
	_ = service.database.WithContext(ctx).Exec(`
		UPDATE system_jobs 
		SET status = ?, progress = ?, message = ?, logs = CASE WHEN ? = '' THEN logs ELSE logs || ? || char(10) END 
		WHERE id = ?`,
		status, progress, message, logs, logs, id,
	).Error
}

func (service *JobService) Get(ctx context.Context, id string) (Job, error) {
	var record database.SystemJob
	if err := service.database.WithContext(ctx).First(&record, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return Job{}, ErrNotFound
		}
		return Job{}, err
	}

	created, _ := time.Parse(time.RFC3339Nano, record.CreatedAt)
	var startedAt, completedAt *time.Time
	if record.StartedAt != nil && *record.StartedAt != "" {
		t := parseTime(*record.StartedAt)
		startedAt = &t
	}
	if record.CompletedAt != nil && *record.CompletedAt != "" {
		t := parseTime(*record.CompletedAt)
		completedAt = &t
	}

	return Job{
		ID:          record.ID,
		Type:        record.JobType,
		Status:      record.Status,
		Progress:    record.Progress,
		Message:     record.Message,
		Logs:        record.Logs,
		CreatedAt:   created,
		StartedAt:   startedAt,
		CompletedAt: completedAt,
	}, nil
}

func (service *JobService) List(ctx context.Context, page, pageSize int) ([]Job, int, error) {
	var total int64
	if err := service.database.WithContext(ctx).Model(&database.SystemJob{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var records []database.SystemJob
	if err := service.database.WithContext(ctx).
		Order("created_at DESC").
		Limit(pageSize).
		Offset((page - 1) * pageSize).
		Find(&records).Error; err != nil {
		return nil, 0, err
	}

	items := make([]Job, 0, len(records))
	for _, record := range records {
		created, _ := time.Parse(time.RFC3339Nano, record.CreatedAt)
		var startedAt, completedAt *time.Time
		if record.StartedAt != nil && *record.StartedAt != "" {
			t := parseTime(*record.StartedAt)
			startedAt = &t
		}
		if record.CompletedAt != nil && *record.CompletedAt != "" {
			t := parseTime(*record.CompletedAt)
			completedAt = &t
		}
		items = append(items, Job{
			ID:          record.ID,
			Type:        record.JobType,
			Status:      record.Status,
			Progress:    record.Progress,
			Message:     record.Message,
			Logs:        record.Logs,
			CreatedAt:   created,
			StartedAt:   startedAt,
			CompletedAt: completedAt,
		})
	}

	return items, int(total), nil
}
