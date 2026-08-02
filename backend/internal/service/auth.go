package service

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type Session struct {
	ID        string    `json:"-"`
	CSRFToken string    `json:"csrfToken"`
	ExpiresAt time.Time `json:"expiresAt"`
}

type AuthService struct {
	database           *sql.DB
	configuredPassword string
	sessionDays        int
	audit              *AuditService
}

func NewAuthService(database *sql.DB, configuredPassword string, sessionDays int, audit *AuditService) *AuthService {
	return &AuthService{database: database, configuredPassword: configuredPassword, sessionDays: sessionDays, audit: audit}
}

func (service *AuthService) Login(ctx context.Context, password, requestID string) (Session, error) {
	if err := service.ensureCredential(ctx); err != nil {
		return Session{}, err
	}
	var passwordHash string
	if err := service.database.QueryRowContext(ctx, `SELECT password_hash FROM admin_credentials WHERE id = 1`).Scan(&passwordHash); err != nil {
		return Session{}, err
	}
	if bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)) != nil {
		return Session{}, ErrInvalidInput
	}
	return service.createSession(ctx)
}

func (service *AuthService) ensureCredential(ctx context.Context) error {
	var count int
	if err := service.database.QueryRowContext(ctx, `SELECT COUNT(*) FROM admin_credentials WHERE id = 1`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	if strings.TrimSpace(service.configuredPassword) == "" {
		return ErrInvalidSession
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(service.configuredPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = service.database.ExecContext(ctx, `INSERT INTO admin_credentials (id, password_hash, updated_at) VALUES (1, ?, ?)`, string(hash), time.Now().UTC().Format(time.RFC3339Nano))
	return err
}

func (service *AuthService) createSession(ctx context.Context) (Session, error) {
	now := time.Now().UTC()
	session := Session{ID: newID(), CSRFToken: secureToken(24), ExpiresAt: now.AddDate(0, 0, service.sessionDays)}
	_, err := service.database.ExecContext(ctx, `INSERT INTO admin_sessions (id, csrf_token, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)`, session.ID, session.CSRFToken, session.ExpiresAt.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano))
	return session, err
}

func (service *AuthService) ValidateSession(ctx context.Context, id string) bool {
	if strings.TrimSpace(id) == "" {
		return false
	}
	var expiration string
	if err := service.database.QueryRowContext(ctx, `SELECT expires_at FROM admin_sessions WHERE id = ?`, id).Scan(&expiration); err != nil {
		return false
	}
	expiresAt, err := time.Parse(time.RFC3339Nano, expiration)
	if err != nil || !expiresAt.After(time.Now().UTC()) {
		_ = service.DeleteSession(ctx, id)
		return false
	}
	_, _ = service.database.ExecContext(ctx, `UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?`, time.Now().UTC().Format(time.RFC3339Nano), id)
	return true
}

func (service *AuthService) ValidateCSRF(ctx context.Context, id, token string) bool {
	if strings.TrimSpace(id) == "" || strings.TrimSpace(token) == "" {
		return false
	}
	var stored string
	if err := service.database.QueryRowContext(ctx, `SELECT csrf_token FROM admin_sessions WHERE id = ?`, id).Scan(&stored); err != nil {
		return false
	}
	return stored == token
}

func (service *AuthService) Session(ctx context.Context, id string) (Session, error) {
	var csrfToken, expiration string
	if err := service.database.QueryRowContext(ctx, `SELECT csrf_token, expires_at FROM admin_sessions WHERE id = ?`, id).Scan(&csrfToken, &expiration); err != nil {
		return Session{}, ErrInvalidSession
	}
	expiresAt, err := time.Parse(time.RFC3339Nano, expiration)
	if err != nil {
		return Session{}, err
	}
	return Session{ID: id, CSRFToken: csrfToken, ExpiresAt: expiresAt}, nil
}

func (service *AuthService) DeleteSession(ctx context.Context, id string) error {
	_, err := service.database.ExecContext(ctx, `DELETE FROM admin_sessions WHERE id = ?`, id)
	return err
}

func (service *AuthService) DeleteAllSessions(ctx context.Context) error {
	_, err := service.database.ExecContext(ctx, `DELETE FROM admin_sessions`)
	return err
}

func (service *AuthService) ChangePassword(ctx context.Context, current, next string) error {
	if len(next) < 12 {
		return ErrInvalidInput
	}
	var hash string
	if err := service.database.QueryRowContext(ctx, `SELECT password_hash FROM admin_credentials WHERE id = 1`).Scan(&hash); err != nil {
		return err
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(current)) != nil {
		return ErrInvalidInput
	}
	nextHash, err := bcrypt.GenerateFromPassword([]byte(next), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = service.database.ExecContext(ctx, `UPDATE admin_credentials SET password_hash = ?, updated_at = ? WHERE id = 1`, string(nextHash), time.Now().UTC().Format(time.RFC3339Nano))
	if err != nil {
		return err
	}
	_, err = service.database.ExecContext(ctx, `DELETE FROM admin_sessions`)
	return err
}

func secureToken(length int) string {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		panic(err)
	}
	return hex.EncodeToString(bytes)
}
