package httpapi

import (
	"context"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"crypto/rand"

	"github.com/kerntau/blog/cms-api/internal/config"
	"github.com/kerntau/blog/cms-api/internal/service"
)

const sessionCookieName = "cot_admin_session"

type contextKey string

const requestIDKey contextKey = "request_id"

type Router struct {
	config   config.Config
	services *service.Services
	mux      *http.ServeMux
}

func NewRouter(cfg config.Config, database *sql.DB) *Router {
	router := &Router{config: cfg, services: service.NewServices(database, cfg), mux: http.NewServeMux()}
	router.registerRoutes()
	return router
}

func (router *Router) ServeHTTP(writer http.ResponseWriter, request *http.Request) {
	router.withRequestID(router.withSecurityHeaders(router.mux)).ServeHTTP(writer, request)
}

func (router *Router) registerRoutes() {
	router.mux.HandleFunc("GET /api/v1/health", router.health)
	router.mux.HandleFunc("POST /api/v1/auth/login", router.login)
	router.mux.HandleFunc("POST /api/v1/auth/logout", router.authenticated(router.logout))
	router.mux.HandleFunc("GET /api/v1/auth/session", router.authenticated(router.session))
	router.mux.HandleFunc("POST /api/v1/auth/change-password", router.authenticated(router.changePassword))
	router.mux.HandleFunc("GET /api/v1/admin/dashboard/summary", router.authenticated(router.dashboardSummary))

	router.mux.HandleFunc("GET /api/v1/admin/posts", router.authenticated(router.listPosts))
	router.mux.HandleFunc("POST /api/v1/admin/posts", router.authenticated(router.createPost))
	router.mux.HandleFunc("GET /api/v1/admin/posts/{id}", router.authenticated(router.getPost))
	router.mux.HandleFunc("PATCH /api/v1/admin/posts/{id}", router.authenticated(router.updatePost))
	router.mux.HandleFunc("DELETE /api/v1/admin/posts/{id}", router.authenticated(router.deletePost))
	router.mux.HandleFunc("POST /api/v1/admin/posts/{id}/publish", router.authenticated(router.publishPost))
	router.mux.HandleFunc("POST /api/v1/admin/posts/{id}/unpublish", router.authenticated(router.unpublishPost))
	router.mux.HandleFunc("POST /api/v1/admin/posts/{id}/restore", router.authenticated(router.restorePost))
	router.mux.HandleFunc("GET /api/v1/admin/posts/{id}/revisions", router.authenticated(router.listRevisions))
	router.mux.HandleFunc("POST /api/v1/admin/posts/{id}/revisions/{revisionID}/restore", router.authenticated(router.restoreRevision))

	router.mux.HandleFunc("GET /api/v1/admin/categories", router.authenticated(router.listCategories))
	router.mux.HandleFunc("POST /api/v1/admin/categories", router.authenticated(router.createCategory))
	router.mux.HandleFunc("PATCH /api/v1/admin/categories/{id}", router.authenticated(router.updateCategory))
	router.mux.HandleFunc("DELETE /api/v1/admin/categories/{id}", router.authenticated(router.deleteCategory))
	router.mux.HandleFunc("GET /api/v1/admin/tags", router.authenticated(router.listTags))
	router.mux.HandleFunc("POST /api/v1/admin/tags", router.authenticated(router.createTag))
	router.mux.HandleFunc("PATCH /api/v1/admin/tags/{id}", router.authenticated(router.updateTag))
	router.mux.HandleFunc("DELETE /api/v1/admin/tags/{id}", router.authenticated(router.deleteTag))

	router.mux.HandleFunc("GET /api/v1/admin/system/health", router.authenticated(router.systemHealth))
	router.mux.HandleFunc("GET /api/v1/admin/system/logs", router.authenticated(router.listAuditLogs))
	router.mux.HandleFunc("GET /api/v1/admin/system/jobs", router.authenticated(router.listJobs))
	router.mux.HandleFunc("GET /api/v1/admin/system/jobs/{id}", router.authenticated(router.getJob))
	router.mux.HandleFunc("GET /api/v1/admin/system/backups", router.authenticated(router.listBackups))
	router.mux.HandleFunc("POST /api/v1/admin/system/backups", router.authenticated(router.createBackup))
	router.mux.HandleFunc("POST /api/v1/admin/system/backups/{id}/restore", router.authenticated(router.restoreBackup))
	router.mux.HandleFunc("GET /api/v1/admin/system/git/status", router.authenticated(router.gitStatus))
	router.mux.HandleFunc("POST /api/v1/admin/system/git/check", router.authenticated(router.checkGitUpdates))
	router.mux.HandleFunc("POST /api/v1/admin/system/git/update", router.authenticated(router.updateGit))
	router.mux.HandleFunc("GET /api/v1/admin/settings", router.authenticated(router.getSettings))
	router.mux.HandleFunc("PATCH /api/v1/admin/settings", router.authenticated(router.updateSettings))
	router.mux.HandleFunc("GET /api/v1/admin/navigation", router.authenticated(router.getNavigation))
	router.mux.HandleFunc("PUT /api/v1/admin/navigation", router.authenticated(router.replaceNavigation))
	router.mux.HandleFunc("GET /api/v1/admin/friends", router.authenticated(router.listFriends))
	router.mux.HandleFunc("POST /api/v1/admin/friends", router.authenticated(router.createFriend))
	router.mux.HandleFunc("PATCH /api/v1/admin/friends/{id}", router.authenticated(router.updateFriend))
	router.mux.HandleFunc("DELETE /api/v1/admin/friends/{id}", router.authenticated(router.deleteFriend))
	router.mux.HandleFunc("GET /api/v1/admin/pages", router.authenticated(router.listPages))
	router.mux.HandleFunc("POST /api/v1/admin/pages", router.authenticated(router.createPage))
	router.mux.HandleFunc("GET /api/v1/admin/pages/{id}", router.authenticated(router.getPage))
	router.mux.HandleFunc("PATCH /api/v1/admin/pages/{id}", router.authenticated(router.updatePage))
	router.mux.HandleFunc("DELETE /api/v1/admin/pages/{id}", router.authenticated(router.trashPage))
	router.mux.HandleFunc("POST /api/v1/admin/pages/{id}/publish", router.authenticated(router.publishPage))
	router.mux.HandleFunc("POST /api/v1/admin/pages/{id}/unpublish", router.authenticated(router.unpublishPage))
	router.mux.HandleFunc("GET /api/v1/admin/comments", router.authenticated(router.listComments))
	router.mux.HandleFunc("POST /api/v1/admin/comments/{id}/status", router.authenticated(router.updateCommentStatus))
	router.mux.HandleFunc("GET /api/v1/admin/suggestions", router.authenticated(router.listSuggestions))
	router.mux.HandleFunc("PATCH /api/v1/admin/suggestions/{id}", router.authenticated(router.updateSuggestionStatus))
}

func (router *Router) withRequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		requestID := strings.TrimSpace(request.Header.Get("X-Request-ID"))
		if requestID == "" || len(requestID) > 128 {
			requestID = "req_" + randomToken(12)
		}
		next.ServeHTTP(writer, request.WithContext(context.WithValue(request.Context(), requestIDKey, requestID)))
	})
}

func (router *Router) withSecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("X-Content-Type-Options", "nosniff")
		writer.Header().Set("X-Frame-Options", "DENY")
		writer.Header().Set("Referrer-Policy", "same-origin")
		writer.Header().Set("Cache-Control", "no-store")
		next.ServeHTTP(writer, request)
	})
}

func (router *Router) authenticated(next http.HandlerFunc) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		requestID := router.requestID(request)
		cookie, err := request.Cookie(sessionCookieName)
		if err != nil || !router.services.Auth.ValidateSession(request.Context(), cookie.Value) {
			writeError(writer, http.StatusUnauthorized, 40101, requestID, "管理员登录已失效", nil)
			return
		}
		if request.Method != http.MethodGet && request.Method != http.MethodHead && request.Method != http.MethodOptions {
			csrf := request.Header.Get("X-CSRF-Token")
			if !router.services.Auth.ValidateCSRF(request.Context(), cookie.Value, csrf) {
				writeError(writer, http.StatusForbidden, 40301, requestID, "CSRF 校验失败，请刷新页面后重试", nil)
				return
			}
		}
		next(writer, request)
	}
}

func (router *Router) requestID(request *http.Request) string {
	if requestID, ok := request.Context().Value(requestIDKey).(string); ok {
		return requestID
	}
	return "req_unknown"
}

func randomToken(byteLength int) string {
	bytes := make([]byte, byteLength)
	if _, err := rand.Read(bytes); err != nil {
		panic(fmt.Errorf("generate random token: %w", err))
	}
	return hex.EncodeToString(bytes)
}

func (router *Router) audit(request *http.Request, action, targetType, targetID, status, details string) {
	if err := router.services.Audit.Record(request.Context(), action, targetType, targetID, status, router.requestID(request), details); err != nil {
		log.Printf("record audit log: %v", err)
	}
}

func nowUTC() time.Time { return time.Now().UTC() }
