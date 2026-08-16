package service

import (
	"context"
	"time"

	"github.com/kerntau/blog/cms-api/internal/database"
	"gorm.io/gorm"
)

type AuditLog struct {
	ID         string    `json:"id"`
	Action     string    `json:"action"`
	TargetType string    `json:"targetType"`
	TargetID   string    `json:"targetId"`
	Status     string    `json:"status"`
	RequestID  string    `json:"requestId"`
	Details    string    `json:"details"`
	CreatedAt  time.Time `json:"createdAt"`
}

type AuditService struct {
	database *gorm.DB
}

func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{database: db}
}

func (service *AuditService) Record(ctx context.Context, action, targetType, targetID, status, requestID, details string) error {
	record := database.AuditLog{
		ID:         newID(),
		Action:     action,
		TargetType: targetType,
		TargetID:   targetID,
		Status:     status,
		RequestID:  requestID,
		Details:    details,
		CreatedAt:  time.Now().UTC().Format(time.RFC3339Nano),
	}
	return service.database.WithContext(ctx).Create(&record).Error
}

func (service *AuditService) FinalizeJob(ctx context.Context, action, jobID, status, details string) error {
	var target database.AuditLog
	err := service.database.WithContext(ctx).
		Where("action = ? AND target_type = 'job' AND target_id = ? AND status = 'accepted'", action, jobID).
		Order("created_at DESC").
		First(&target).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil
		}
		return err
	}
	return service.database.WithContext(ctx).Model(&database.AuditLog{}).Where("id = ?", target.ID).Updates(map[string]interface{}{
		"status":  status,
		"details": details,
	}).Error
}

func (service *AuditService) List(ctx context.Context, page, pageSize int) ([]AuditLog, int, error) {
	var total int64
	if err := service.database.WithContext(ctx).Model(&database.AuditLog{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var records []database.AuditLog
	if err := service.database.WithContext(ctx).
		Order("created_at DESC").
		Limit(pageSize).
		Offset((page - 1) * pageSize).
		Find(&records).Error; err != nil {
		return nil, 0, err
	}

	logs := make([]AuditLog, 0, len(records))
	for _, r := range records {
		created, _ := time.Parse(time.RFC3339Nano, r.CreatedAt)
		logs = append(logs, AuditLog{
			ID:         r.ID,
			Action:     r.Action,
			TargetType: r.TargetType,
			TargetID:   r.TargetID,
			Status:     r.Status,
			RequestID:  r.RequestID,
			Details:    r.Details,
			CreatedAt:  created,
		})
	}

	return logs, int(total), nil
}
