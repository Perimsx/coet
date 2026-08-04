package service

import (
	"context"
	"database/sql"
	"time"
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

type AuditService struct{ database *sql.DB }

func NewAuditService(database *sql.DB) *AuditService { return &AuditService{database: database} }

func (service *AuditService) Record(ctx context.Context, action, targetType, targetID, status, requestID, details string) error {
	_, err := service.database.ExecContext(ctx, `INSERT INTO audit_logs (id, action, target_type, target_id, status, request_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, newID(), action, targetType, targetID, status, requestID, details, time.Now().UTC().Format(time.RFC3339Nano))
	return err
}

func (service *AuditService) FinalizeJob(ctx context.Context, action, jobID, status, details string) error {
	_, err := service.database.ExecContext(ctx, `
		UPDATE audit_logs
		SET status=?, details=?
		WHERE id=(
			SELECT id FROM audit_logs
			WHERE action=? AND target_type='job' AND target_id=? AND status='accepted'
			ORDER BY created_at DESC
			LIMIT 1
		)`, status, details, action, jobID)
	return err
}

func (service *AuditService) List(ctx context.Context, page, pageSize int) ([]AuditLog, int, error) {
	var total int
	if err := service.database.QueryRowContext(ctx, `SELECT COUNT(*) FROM audit_logs`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := service.database.QueryContext(ctx, `SELECT id, action, target_type, target_id, status, request_id, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`, pageSize, (page-1)*pageSize)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	logs := make([]AuditLog, 0)
	for rows.Next() {
		var item AuditLog
		var createdAt string
		if err := rows.Scan(&item.ID, &item.Action, &item.TargetType, &item.TargetID, &item.Status, &item.RequestID, &item.Details, &createdAt); err != nil {
			return nil, 0, err
		}
		item.CreatedAt, _ = time.Parse(time.RFC3339Nano, createdAt)
		logs = append(logs, item)
	}
	return logs, total, rows.Err()
}
