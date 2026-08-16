package httpapi

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/kerntau/blog/cms-api/internal/config"
	"github.com/kerntau/blog/cms-api/internal/filestore"
	"github.com/kerntau/blog/cms-api/internal/service"
	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

const sessionCookieName = "xuzhan_admin_session"

type contextKey string

const requestIDKey contextKey = "request_id"

type Router struct {
	config   config.Config
	services *service.Services
	echo     *echo.Echo
	logins   *loginLimiter
}

func NewRouter(cfg config.Config, database *gorm.DB) *Router {
	store := filestore.NewStore(cfg.ContentDirectory)
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	router := &Router{
		config:   cfg,
		services: service.NewServices(database, store, cfg),
		echo:     e,
		logins:   newLoginLimiter(),
	}

	router.setupMiddlewares()
	router.registerRoutes()
	return router
}

func (router *Router) Echo() *echo.Echo {
	return router.echo
}

func (router *Router) ServeHTTP(writer http.ResponseWriter, request *http.Request) {
	if request.URL.Path != "/" && strings.HasSuffix(request.URL.Path, "/") {
		request.URL.Path = strings.TrimRight(request.URL.Path, "/")
	}
	router.echo.ServeHTTP(writer, request)
}

func (router *Router) setupMiddlewares() {
	// Request ID 中间件
	router.echo.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			req := c.Request()
			reqID := strings.TrimSpace(req.Header.Get("X-Request-ID"))
			if reqID == "" || len(reqID) > 128 {
				reqID = "req_" + randomToken(12)
			}
			c.Set("request_id", reqID)
			c.Response().Header().Set("X-Request-ID", reqID)

			ctx := context.WithValue(req.Context(), requestIDKey, reqID)
			c.SetRequest(req.WithContext(ctx))
			return next(c)
		}
	})

	// 安全响应头中间件
	router.echo.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			res := c.Response().Header()
			res.Set("X-Content-Type-Options", "nosniff")
			res.Set("X-Frame-Options", "DENY")
			res.Set("Referrer-Policy", "same-origin")
			res.Set("Cache-Control", "no-store")
			return next(c)
		}
	})

	// Zerolog 请求日志中间件
	router.echo.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()
			err := next(c)
			stop := time.Now()

			req := c.Request()
			res := c.Response()

			logEvent := log.Info()
			if err != nil {
				logEvent = log.Error().Err(err)
			} else if res.Status >= 500 {
				logEvent = log.Error()
			} else if res.Status >= 400 {
				logEvent = log.Warn()
			}

			if zerolog.GlobalLevel() <= zerolog.DebugLevel || res.Status >= 400 {
				logEvent.
					Str("request_id", getContextRequestID(c)).
					Str("method", req.Method).
					Str("uri", req.RequestURI).
					Int("status", res.Status).
					Int64("latency_ms", stop.Sub(start).Milliseconds()).
					Str("remote_ip", c.RealIP()).
					Msg("HTTP request")
			}

			return err
		}
	})
}

func (router *Router) authenticated(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		req := c.Request()
		cookie, err := req.Cookie(sessionCookieName)
		if err != nil || !router.services.Auth.ValidateSession(req.Context(), cookie.Value) {
			return writeError(c, http.StatusUnauthorized, 40101, "管理员登录已失效", nil)
		}
		if req.Method != http.MethodGet && req.Method != http.MethodHead && req.Method != http.MethodOptions {
			csrf := req.Header.Get("X-CSRF-Token")
			if !router.services.Auth.ValidateCSRF(req.Context(), cookie.Value, csrf) {
				return writeError(c, http.StatusForbidden, 40301, "CSRF 校验失败，请刷新页面后重试", nil)
			}
		}
		return next(c)
	}
}

func (router *Router) registerRoutes() {
	v1 := router.echo.Group("/api/v1")

	// 公开接口
	v1.GET("/health", router.health)
	v1.GET("/public/posts", router.publicPosts)
	v1.GET("/public/posts/*", router.publicPost)
	v1.GET("/public/pages/*", router.publicPage)
	v1.GET("/public/categories", router.publicCategories)
	v1.GET("/public/tags", router.publicTags)
	v1.GET("/public/friends", router.publicFriends)
	v1.GET("/public/settings", router.publicSettings)
	v1.GET("/public/navigation", router.publicNavigation)

	// 认证接口
	v1.POST("/auth/login", router.login)
	v1.POST("/auth/logout", router.authenticated(router.logout))
	v1.POST("/auth/logout-all", router.authenticated(router.logoutAll))
	v1.GET("/auth/session", router.authenticated(router.session))
	v1.POST("/auth/change-password", router.authenticated(router.changePassword))

	// CMS 后台管理接口
	admin := v1.Group("/admin", router.authenticated)
	admin.GET("/dashboard/summary", router.dashboardSummary)

	admin.GET("/posts", router.listPosts)
	admin.POST("/posts", router.createPost)
	admin.GET("/posts/:id", router.getPost)
	admin.PATCH("/posts/:id", router.updatePost)
	admin.DELETE("/posts/:id", router.deletePost)
	admin.POST("/posts/:id/publish", router.publishPost)
	admin.POST("/posts/:id/unpublish", router.unpublishPost)
	admin.POST("/posts/:id/restore", router.restorePost)
	admin.GET("/posts/:id/revisions", router.listRevisions)
	admin.POST("/posts/:id/revisions/:revisionID/restore", router.restoreRevision)

	admin.GET("/categories", router.listCategories)
	admin.POST("/categories", router.createCategory)
	admin.PATCH("/categories/:id", router.updateCategory)
	admin.DELETE("/categories/:id", router.deleteCategory)
	admin.GET("/tags", router.listTags)
	admin.POST("/tags", router.createTag)
	admin.PATCH("/tags/:id", router.updateTag)
	admin.DELETE("/tags/:id", router.deleteTag)

	admin.GET("/system/health", router.systemHealth)
	admin.GET("/system/info", router.systemInfo)
	admin.GET("/system/logs", router.listAuditLogs)
	admin.GET("/system/jobs", router.listJobs)
	admin.GET("/system/jobs/:id", router.getJob)
	admin.POST("/system/jobs/:id/retry", router.retryJob)
	admin.GET("/system/backups", router.listBackups)
	admin.POST("/system/backups", router.createBackup)
	admin.POST("/system/backups/:id/restore", router.restoreBackup)
	admin.GET("/system/git/status", router.gitStatus)
	admin.GET("/system/git/logs", router.gitLogs)
	admin.GET("/system/git/deployments", router.listDeployments)
	admin.POST("/system/git/check", router.checkGitUpdates)
	admin.POST("/system/git/update", router.updateGit)
	admin.POST("/system/git/rollback", router.rollbackGit)
	admin.GET("/settings", router.getSettings)
	admin.PATCH("/settings", router.updateSettings)
	admin.GET("/navigation", router.getNavigation)
	admin.PUT("/navigation", router.replaceNavigation)
	admin.GET("/friends", router.listFriends)
	admin.POST("/friends", router.createFriend)
	admin.PATCH("/friends/:id", router.updateFriend)
	admin.DELETE("/friends/:id", router.deleteFriend)
	admin.POST("/friends/:id/check", router.checkFriend)
	admin.GET("/seo", router.getSEO)
	admin.PATCH("/seo", router.updateSEO)
	admin.PATCH("/seo/credentials", router.updateSEOCredentials)
	admin.POST("/seo/rebuild", router.rebuildSEO)
	admin.POST("/seo/push", router.pushSEO)
	admin.GET("/pages", router.listPages)
	admin.POST("/pages", router.createPage)
	admin.GET("/pages/:id", router.getPage)
	admin.PATCH("/pages/:id", router.updatePage)
	admin.DELETE("/pages/:id", router.trashPage)
	admin.POST("/pages/:id/publish", router.publishPage)
	admin.POST("/pages/:id/unpublish", router.unpublishPage)
	admin.GET("/comments", router.listComments)
	admin.POST("/comments/:id/status", router.updateCommentStatus)
	admin.GET("/suggestions", router.listSuggestions)
	admin.PATCH("/suggestions/:id", router.updateSuggestionStatus)
}

func (router *Router) requestID(c echo.Context) string {
	return getContextRequestID(c)
}

func randomToken(byteLength int) string {
	bytes := make([]byte, byteLength)
	if _, err := rand.Read(bytes); err != nil {
		panic(fmt.Errorf("generate random token: %w", err))
	}
	return hex.EncodeToString(bytes)
}

func (router *Router) audit(c echo.Context, action, targetType, targetID, status, details string) {
	if err := router.services.Audit.Record(c.Request().Context(), action, targetType, targetID, status, router.requestID(c), details); err != nil {
		log.Error().Err(err).Msg("record audit log failed")
	}
}

func (router *Router) completeJobAudit(action string) service.JobCompletion {
	return func(ctx context.Context, job service.Job, runErr error) {
		status := "success"
		details := strings.TrimSpace(job.Logs)
		if runErr != nil {
			status = "failed"
			details = strings.TrimSpace(runErr.Error())
		}
		if details == "" {
			details = job.Message
		}
		if err := router.services.Audit.FinalizeJob(ctx, action, job.ID, status, details); err != nil {
			log.Error().Err(err).Msg("finalize audit log failed")
		}
	}
}

func nowUTC() time.Time { return time.Now().UTC() }
