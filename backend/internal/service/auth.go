package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"strings"
	"time"

	"github.com/kerntau/blog/cms-api/internal/database"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Session struct {
	ID        string    `json:"-"`
	CSRFToken string    `json:"csrfToken"`
	ExpiresAt time.Time `json:"expiresAt"`
}

type AuthService struct {
	database           *gorm.DB
	configuredPassword string
	sessionDays        int
	audit              *AuditService
}

func NewAuthService(db *gorm.DB, configuredPassword string, sessionDays int, audit *AuditService) *AuthService {
	return &AuthService{database: db, configuredPassword: configuredPassword, sessionDays: sessionDays, audit: audit}
}

func (service *AuthService) Login(ctx context.Context, password, requestID string) (Session, error) {
	if err := service.ensureCredential(ctx); err != nil {
		return Session{}, err
	}
	var cred database.AdminCredential
	if err := service.database.WithContext(ctx).First(&cred, 1).Error; err != nil {
		return Session{}, err
	}
	if bcrypt.CompareHashAndPassword([]byte(cred.PasswordHash), []byte(password)) != nil {
		return Session{}, ErrInvalidInput
	}
	return service.createSession(ctx)
}

func (service *AuthService) ensureCredential(ctx context.Context) error {
	var count int64
	if err := service.database.WithContext(ctx).Model(&database.AdminCredential{}).Where("id = ?", 1).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	if strings.TrimSpace(service.configuredPassword) == "" {
		return nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(service.configuredPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	cred := database.AdminCredential{
		ID:           1,
		PasswordHash: string(hash),
		UpdatedAt:    time.Now().UTC().Format(time.RFC3339Nano),
	}
	return service.database.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&cred).Error
}

func (service *AuthService) createSession(ctx context.Context) (Session, error) {
	now := time.Now().UTC()
	session := Session{ID: newID(), CSRFToken: secureToken(24), ExpiresAt: now.AddDate(0, 0, service.sessionDays)}
	record := database.AdminSession{
		ID:         session.ID,
		CSRFToken:  session.CSRFToken,
		ExpiresAt:  session.ExpiresAt.Format(time.RFC3339Nano),
		CreatedAt:  now.Format(time.RFC3339Nano),
		LastSeenAt: now.Format(time.RFC3339Nano),
	}
	err := service.database.WithContext(ctx).Create(&record).Error
	return session, err
}

func (service *AuthService) ValidateSession(ctx context.Context, id string) bool {
	if strings.TrimSpace(id) == "" {
		return false
	}
	var session database.AdminSession
	if err := service.database.WithContext(ctx).First(&session, "id = ?", id).Error; err != nil {
		return false
	}
	expiresAt, err := time.Parse(time.RFC3339Nano, session.ExpiresAt)
	if err != nil || !expiresAt.After(time.Now().UTC()) {
		_ = service.DeleteSession(ctx, id)
		return false
	}
	_ = service.database.WithContext(ctx).Model(&database.AdminSession{}).Where("id = ?", id).Update("last_seen_at", time.Now().UTC().Format(time.RFC3339Nano)).Error
	return true
}

func (service *AuthService) ValidateCSRF(ctx context.Context, id, token string) bool {
	if strings.TrimSpace(id) == "" || strings.TrimSpace(token) == "" {
		return false
	}
	var session database.AdminSession
	if err := service.database.WithContext(ctx).Select("csrf_token").First(&session, "id = ?", id).Error; err != nil {
		return false
	}
	return session.CSRFToken == token
}

func (service *AuthService) Session(ctx context.Context, id string) (Session, error) {
	var session database.AdminSession
	if err := service.database.WithContext(ctx).First(&session, "id = ?", id).Error; err != nil {
		return Session{}, ErrInvalidSession
	}
	expiresAt, err := time.Parse(time.RFC3339Nano, session.ExpiresAt)
	if err != nil {
		return Session{}, err
	}
	return Session{ID: id, CSRFToken: session.CSRFToken, ExpiresAt: expiresAt}, nil
}

func (service *AuthService) DeleteSession(ctx context.Context, id string) error {
	return service.database.WithContext(ctx).Delete(&database.AdminSession{}, "id = ?", id).Error
}

func (service *AuthService) DeleteAllSessions(ctx context.Context) error {
	return service.database.WithContext(ctx).Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&database.AdminSession{}).Error
}

func (service *AuthService) ChangePassword(ctx context.Context, current, next string) error {
	if len(next) < 12 {
		return ErrInvalidInput
	}
	var cred database.AdminCredential
	if err := service.database.WithContext(ctx).First(&cred, 1).Error; err != nil {
		return err
	}
	if bcrypt.CompareHashAndPassword([]byte(cred.PasswordHash), []byte(current)) != nil {
		return ErrInvalidInput
	}
	nextHash, err := bcrypt.GenerateFromPassword([]byte(next), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	if err := service.database.WithContext(ctx).Model(&database.AdminCredential{}).Where("id = ?", 1).Updates(map[string]interface{}{
		"password_hash": string(nextHash),
		"updated_at":    time.Now().UTC().Format(time.RFC3339Nano),
	}).Error; err != nil {
		return err
	}
	return service.DeleteAllSessions(ctx)
}

func secureToken(length int) string {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		panic(err)
	}
	return hex.EncodeToString(bytes)
}
