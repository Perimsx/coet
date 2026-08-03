package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/kerntau/blog/cms-api/internal/domain"
	"github.com/kerntau/blog/cms-api/internal/service"
)

func (router *Router) health(writer http.ResponseWriter, request *http.Request) {
	writeSuccess(writer, router.requestID(request), map[string]string{"status": "ok", "service": "xuzhan-cms-api", "time": nowUTC().Format(time.RFC3339Nano)})
}

func (router *Router) publicPosts(writer http.ResponseWriter, request *http.Request) {
	filters := service.PostFilters{Pagination: router.pagination(request)}
	filters.Keyword = request.URL.Query().Get("keyword")
	filters.Language = request.URL.Query().Get("language")
	filters.CategoryID = request.URL.Query().Get("categoryId")
	filters.TagID = request.URL.Query().Get("tagId")
	items, total, err := router.services.Public.ListPosts(request.Context(), filters)
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), pageResponse[domain.Post]{Items: items, Page: filters.Page, PageSize: filters.PageSize, Total: total})
}

func (router *Router) publicPost(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.Public.PostBySlug(request.Context(), request.PathValue("slug"))
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), item)
}

func (router *Router) publicPage(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.Public.PageBySlug(request.Context(), request.PathValue("slug"))
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), item)
}

func (router *Router) publicCategories(writer http.ResponseWriter, request *http.Request) {
	items, err := router.services.Public.Categories(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), items)
}

func (router *Router) publicTags(writer http.ResponseWriter, request *http.Request) {
	items, err := router.services.Public.Tags(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), items)
}

func (router *Router) publicFriends(writer http.ResponseWriter, request *http.Request) {
	items, err := router.services.Public.PublishedFriends(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), items)
}

func (router *Router) publicSettings(writer http.ResponseWriter, request *http.Request) {
	items, err := router.services.Public.Settings(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), items)
}

func (router *Router) publicNavigation(writer http.ResponseWriter, request *http.Request) {
	items, err := router.services.Public.Navigation(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), items)
}

func (router *Router) systemHealth(writer http.ResponseWriter, request *http.Request) {
	info, err := os.Stat(router.config.DatabasePath)
	if err != nil && !os.IsNotExist(err) {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), map[string]interface{}{"api": "ok", "database": "ok", "databaseSize": sizeOf(info), "time": nowUTC().Format(time.RFC3339Nano)})
}

func (router *Router) login(writer http.ResponseWriter, request *http.Request) {
	if allowed, retryAfter := router.logins.allow(request); !allowed {
		writer.Header().Set("Retry-After", strconv.Itoa(max(1, int(retryAfter.Seconds()))))
		writeError(writer, http.StatusTooManyRequests, 42901, router.requestID(request), "登录失败次数过多，请稍后再试", nil)
		return
	}
	var input struct {
		Password string `json:"password"`
	}
	if !router.decode(writer, request, &input) {
		return
	}
	session, err := router.services.Auth.Login(request.Context(), input.Password, router.requestID(request))
	if errors.Is(err, service.ErrInvalidInput) {
		router.logins.failure(request)
		router.audit(request, "auth.login", "session", "", "failed", "invalid password")
		writeError(writer, http.StatusUnauthorized, 40102, router.requestID(request), "管理员密码错误", nil)
		return
	}
	if errors.Is(err, service.ErrInvalidSession) {
		writeError(writer, http.StatusServiceUnavailable, 50301, router.requestID(request), "管理员密码尚未配置", nil)
		return
	}
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	http.SetCookie(writer, &http.Cookie{Name: sessionCookieName, Value: session.ID, Path: "/", HttpOnly: true, Secure: router.config.CookieSecure, SameSite: http.SameSiteStrictMode, Expires: session.ExpiresAt, MaxAge: int(time.Until(session.ExpiresAt).Seconds())})
	router.logins.success(request)
	router.audit(request, "auth.login", "session", session.ID, "success", "")
	writeSuccess(writer, router.requestID(request), map[string]interface{}{"csrfToken": session.CSRFToken, "expiresAt": session.ExpiresAt})
}

func (router *Router) logout(writer http.ResponseWriter, request *http.Request) {
	cookie, _ := request.Cookie(sessionCookieName)
	_ = router.services.Auth.DeleteSession(request.Context(), cookie.Value)
	http.SetCookie(writer, &http.Cookie{Name: sessionCookieName, Value: "", Path: "/", HttpOnly: true, Secure: router.config.CookieSecure, SameSite: http.SameSiteStrictMode, MaxAge: -1})
	router.audit(request, "auth.logout", "session", cookie.Value, "success", "")
	writeSuccess(writer, router.requestID(request), map[string]bool{"loggedOut": true})
}

func (router *Router) logoutAll(writer http.ResponseWriter, request *http.Request) {
	if err := router.services.Auth.DeleteAllSessions(request.Context()); err != nil {
		router.internalError(writer, request, err)
		return
	}
	http.SetCookie(writer, &http.Cookie{Name: sessionCookieName, Value: "", Path: "/", HttpOnly: true, Secure: router.config.CookieSecure, SameSite: http.SameSiteStrictMode, MaxAge: -1})
	router.audit(request, "auth.logout_all", "session", "all", "success", "")
	writeSuccess(writer, router.requestID(request), map[string]bool{"loggedOut": true})
}

func (router *Router) session(writer http.ResponseWriter, request *http.Request) {
	cookie, _ := request.Cookie(sessionCookieName)
	session, err := router.services.Auth.Session(request.Context(), cookie.Value)
	if err != nil {
		writeError(writer, http.StatusUnauthorized, 40101, router.requestID(request), "管理员登录已失效", nil)
		return
	}
	writeSuccess(writer, router.requestID(request), map[string]interface{}{"authenticated": true, "csrfToken": session.CSRFToken, "expiresAt": session.ExpiresAt})
}

func (router *Router) changePassword(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if !router.decode(writer, request, &input) {
		return
	}
	if err := router.services.Auth.ChangePassword(request.Context(), input.CurrentPassword, input.NewPassword); err != nil {
		writeError(writer, http.StatusUnprocessableEntity, 42201, router.requestID(request), "当前密码错误或新密码少于 12 位", nil)
		return
	}
	router.audit(request, "auth.change_password", "credential", "admin", "success", "")
	writeSuccess(writer, router.requestID(request), map[string]bool{"changed": true})
}

func (router *Router) dashboardSummary(writer http.ResponseWriter, request *http.Request) {
	summary, err := router.services.Dashboard.Summary(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), summary)
}
func (router *Router) listPosts(writer http.ResponseWriter, request *http.Request) {
	filters := service.PostFilters{Pagination: router.pagination(request)}
	filters.Keyword = request.URL.Query().Get("keyword")
	filters.Status = request.URL.Query().Get("status")
	filters.Language = request.URL.Query().Get("language")
	filters.CategoryID = request.URL.Query().Get("categoryId")
	filters.TagID = request.URL.Query().Get("tagId")
	items, total, err := router.services.Posts.List(request.Context(), filters)
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), pageResponse[domain.Post]{Items: items, Page: filters.Page, PageSize: filters.PageSize, Total: total})
}
func (router *Router) createPost(writer http.ResponseWriter, request *http.Request) {
	var input service.PostInput
	if !router.decode(writer, request, &input) {
		return
	}
	item, err := router.services.Posts.Create(request.Context(), input)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "post.create", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/tags", "/blog/category")
	writeCreated(writer, router.requestID(request), item)
}
func (router *Router) getPost(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.Posts.Get(request.Context(), request.PathValue("id"))
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) updatePost(writer http.ResponseWriter, request *http.Request) {
	var input service.PostInput
	if !router.decode(writer, request, &input) {
		return
	}
	item, err := router.services.Posts.Update(request.Context(), request.PathValue("id"), input)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "post.update", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/"+item.Slug, "/tags", "/blog/category")
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) deletePost(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.Posts.Trash(request.Context(), request.PathValue("id"))
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "post.trash", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/"+item.Slug, "/tags", "/blog/category")
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) publishPost(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.Posts.Publish(request.Context(), request.PathValue("id"))
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "post.publish", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/"+item.Slug, "/"+item.Slug, "/tags", "/blog/category")
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) unpublishPost(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.Posts.Unpublish(request.Context(), request.PathValue("id"))
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "post.unpublish", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/"+item.Slug, "/"+item.Slug, "/tags", "/blog/category")
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) restorePost(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.Posts.Restore(request.Context(), request.PathValue("id"))
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "post.restore", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/"+item.Slug, "/tags", "/blog/category")
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) listRevisions(writer http.ResponseWriter, request *http.Request) {
	items, err := router.services.Posts.Revisions(request.Context(), request.PathValue("id"))
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), items)
}
func (router *Router) restoreRevision(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.Posts.RestoreRevision(request.Context(), request.PathValue("id"), request.PathValue("revisionID"))
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "post.restore_revision", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/"+item.Slug, "/tags", "/blog/category")
	writeSuccess(writer, router.requestID(request), item)
}

func (router *Router) listCategories(writer http.ResponseWriter, request *http.Request) {
	items, err := router.services.Categories.List(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), items)
}
func (router *Router) createCategory(writer http.ResponseWriter, request *http.Request) {
	var input service.CategoryInput
	if !router.decode(writer, request, &input) {
		return
	}
	item, err := router.services.Categories.Create(request.Context(), input)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "category.create", "category", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/category", "/tags")
	writeCreated(writer, router.requestID(request), item)
}
func (router *Router) updateCategory(writer http.ResponseWriter, request *http.Request) {
	var input service.CategoryInput
	if !router.decode(writer, request, &input) {
		return
	}
	item, err := router.services.Categories.Update(request.Context(), request.PathValue("id"), input)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "category.update", "category", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/category/"+item.Slug, "/tags")
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) deleteCategory(writer http.ResponseWriter, request *http.Request) {
	replacement := request.URL.Query().Get("replacementId")
	err := router.services.Categories.Delete(request.Context(), request.PathValue("id"), replacement)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "category.delete", "category", request.PathValue("id"), "success", "")
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/category", "/tags")
	writeSuccess(writer, router.requestID(request), map[string]bool{"deleted": true})
}
func (router *Router) listTags(writer http.ResponseWriter, request *http.Request) {
	items, err := router.services.Tags.List(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), items)
}
func (router *Router) createTag(writer http.ResponseWriter, request *http.Request) {
	var input service.TagInput
	if !router.decode(writer, request, &input) {
		return
	}
	item, err := router.services.Tags.Create(request.Context(), input)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "tag.create", "tag", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/tags", "/blog/category")
	writeCreated(writer, router.requestID(request), item)
}
func (router *Router) updateTag(writer http.ResponseWriter, request *http.Request) {
	var input service.TagInput
	if !router.decode(writer, request, &input) {
		return
	}
	item, err := router.services.Tags.Update(request.Context(), request.PathValue("id"), input)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "tag.update", "tag", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/tags", "/tags/"+item.Slug, "/blog/category")
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) deleteTag(writer http.ResponseWriter, request *http.Request) {
	err := router.services.Tags.Delete(request.Context(), request.PathValue("id"))
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "tag.delete", "tag", request.PathValue("id"), "success", "")
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/tags", "/blog/category")
	writeSuccess(writer, router.requestID(request), map[string]bool{"deleted": true})
}
func (router *Router) listAuditLogs(writer http.ResponseWriter, request *http.Request) {
	pagination := router.pagination(request)
	items, total, err := router.services.Audit.List(request.Context(), pagination.Page, pagination.PageSize)
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), pageResponse[service.AuditLog]{Items: items, Page: pagination.Page, PageSize: pagination.PageSize, Total: total})
}

func (router *Router) listJobs(writer http.ResponseWriter, request *http.Request) {
	pagination := router.pagination(request)
	items, total, err := router.services.Jobs.List(request.Context(), pagination.Page, pagination.PageSize)
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), pageResponse[service.Job]{Items: items, Page: pagination.Page, PageSize: pagination.PageSize, Total: total})
}
func (router *Router) getJob(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.Jobs.Get(request.Context(), request.PathValue("id"))
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) retryJob(writer http.ResponseWriter, request *http.Request) {
	previous, err := router.services.Jobs.Get(request.Context(), request.PathValue("id"))
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	if previous.Status != "failed" {
		writeError(writer, http.StatusConflict, 40901, router.requestID(request), "只有失败任务可以重试", nil)
		return
	}
	job, err := router.startRetryJob(request.Context(), previous.Type)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "system.job.retry", "job", job.ID, "accepted", "retry="+previous.ID)
	writeCreated(writer, router.requestID(request), job)
}

func (router *Router) startRetryJob(ctx context.Context, kind string) (service.Job, error) {
	switch kind {
	case "database_backup":
		return router.services.Jobs.Start(ctx, kind, func(ctx context.Context, report func(int, string)) error {
			report(20, "正在重试 SQLite 一致性快照")
			item, err := router.services.System.CreateBackup(ctx)
			if err == nil {
				report(90, "备份已创建: "+item.FileName)
			}
			return err
		})
	case "git_check":
		return router.services.Jobs.Start(ctx, kind, func(ctx context.Context, report func(int, string)) error {
			report(15, "正在重新获取固定远程分支")
			status, err := router.services.System.CheckUpdates(ctx)
			if err == nil {
				report(90, "检查完成，待更新提交数: "+strconv.Itoa(status.RemoteAhead))
			}
			return err
		})
	case "git_update":
		return router.services.Jobs.Start(ctx, kind, func(ctx context.Context, report func(int, string)) error {
			return router.services.System.Update(ctx, report)
		})
	case "git_rollback":
		return router.services.Jobs.Start(ctx, kind, func(ctx context.Context, report func(int, string)) error {
			return router.services.System.Rollback(ctx, report)
		})
	case "seo_rebuild":
		return router.services.Jobs.Start(ctx, kind, func(ctx context.Context, report func(int, string)) error {
			return router.services.SEO.Rebuild(ctx, report)
		})
	case "seo_push":
		return router.services.Jobs.Start(ctx, kind, func(ctx context.Context, report func(int, string)) error {
			return router.services.SEO.Push(ctx, report)
		})
	default:
		return service.Job{}, service.ErrInvalidInput
	}
}

func (router *Router) listBackups(writer http.ResponseWriter, request *http.Request) {
	items, err := router.services.System.ListBackups(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), items)
}
func (router *Router) createBackup(writer http.ResponseWriter, request *http.Request) {
	job, err := router.services.Jobs.Start(request.Context(), "database_backup", func(ctx context.Context, report func(int, string)) error {
		report(20, "正在创建 SQLite 一致性快照")
		item, err := router.services.System.CreateBackup(ctx)
		if err == nil {
			report(90, "备份已创建: "+item.FileName)
		}
		return err
	})
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "system.backup.create", "job", job.ID, "accepted", "")
	writeCreated(writer, router.requestID(request), job)
}
func (router *Router) restoreBackup(writer http.ResponseWriter, request *http.Request) {
	job, err := router.services.Jobs.Start(request.Context(), "database_restore", func(ctx context.Context, report func(int, string)) error {
		report(20, "正在校验备份和创建恢复前快照")
		_, err := router.services.System.RestoreBackup(ctx, request.PathValue("id"))
		return err
	})
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "system.backup.restore", "backup", request.PathValue("id"), "accepted", "")
	writeCreated(writer, router.requestID(request), job)
}
func (router *Router) gitStatus(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.System.GitStatus(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) checkGitUpdates(writer http.ResponseWriter, request *http.Request) {
	job, err := router.services.Jobs.Start(request.Context(), "git_check", func(ctx context.Context, report func(int, string)) error {
		report(15, "正在获取固定远程分支")
		status, err := router.services.System.CheckUpdates(ctx)
		if err == nil {
			report(90, "检查完成，待更新提交数: "+strconv.Itoa(status.RemoteAhead))
		}
		return err
	})
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "system.git.check", "job", job.ID, "accepted", "")
	writeCreated(writer, router.requestID(request), job)
}
func (router *Router) updateGit(writer http.ResponseWriter, request *http.Request) {
	job, err := router.services.Jobs.Start(request.Context(), "git_update", func(ctx context.Context, report func(int, string)) error {
		return router.services.System.Update(ctx, report)
	})
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "system.git.update", "job", job.ID, "accepted", "")
	writeCreated(writer, router.requestID(request), job)
}
func (router *Router) rollbackGit(writer http.ResponseWriter, request *http.Request) {
	job, err := router.services.Jobs.Start(request.Context(), "git_rollback", func(ctx context.Context, report func(int, string)) error {
		return router.services.System.Rollback(ctx, report)
	})
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "system.git.rollback", "job", job.ID, "accepted", "")
	writeCreated(writer, router.requestID(request), job)
}

func (router *Router) getSettings(writer http.ResponseWriter, request *http.Request) {
	values, err := router.services.Site.GetSettings(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), values)
}
func (router *Router) updateSettings(writer http.ResponseWriter, request *http.Request) {
	var values map[string]string
	if !router.decode(writer, request, &values) {
		return
	}
	result, err := router.services.Site.UpdateSettings(request.Context(), values)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "site.settings.update", "settings", "site", "success", "")
	router.revalidate("/", "/about", "/friends", "/sitemap.xml", "/robots.txt")
	writeSuccess(writer, router.requestID(request), result)
}
func (router *Router) getNavigation(writer http.ResponseWriter, request *http.Request) {
	items, err := router.services.Site.Navigation(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), items)
}
func (router *Router) replaceNavigation(writer http.ResponseWriter, request *http.Request) {
	var inputs []service.NavigationInput
	if !router.decode(writer, request, &inputs) {
		return
	}
	items, err := router.services.Site.ReplaceNavigation(request.Context(), inputs)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "site.navigation.update", "navigation", "site", "success", "")
	router.revalidate("/", "/archive", "/friends", "/about")
	writeSuccess(writer, router.requestID(request), items)
}
func (router *Router) listFriends(writer http.ResponseWriter, request *http.Request) {
	items, err := router.services.Site.ListFriends(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), items)
}
func (router *Router) createFriend(writer http.ResponseWriter, request *http.Request) {
	var input service.FriendLinkInput
	if !router.decode(writer, request, &input) {
		return
	}
	item, err := router.services.Site.CreateFriend(request.Context(), input)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "friend.create", "friend", item.ID, "success", item.URL)
	router.revalidate("/friends", "/sitemap.xml")
	writeCreated(writer, router.requestID(request), item)
}
func (router *Router) updateFriend(writer http.ResponseWriter, request *http.Request) {
	var input service.FriendLinkInput
	if !router.decode(writer, request, &input) {
		return
	}
	item, err := router.services.Site.UpdateFriend(request.Context(), request.PathValue("id"), input)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "friend.update", "friend", item.ID, "success", item.URL)
	router.revalidate("/friends", "/sitemap.xml")
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) deleteFriend(writer http.ResponseWriter, request *http.Request) {
	id := request.PathValue("id")
	if err := router.services.Site.DeleteFriend(request.Context(), id); err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "friend.delete", "friend", id, "success", "")
	router.revalidate("/friends", "/sitemap.xml")
	writeSuccess(writer, router.requestID(request), map[string]bool{"deleted": true})
}

func (router *Router) checkFriend(writer http.ResponseWriter, request *http.Request) {
	id := request.PathValue("id")
	job, err := router.services.Jobs.Start(request.Context(), "friend_check", func(ctx context.Context, report func(int, string)) error {
		report(20, "正在检查友链 URL 连通性")
		item, err := router.services.Site.CheckFriend(ctx, id)
		if err == nil {
			report(90, "检查完成: "+item.LastCheckStatus)
		}
		return err
	})
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "friend.check", "friend", id, "accepted", "")
	writeCreated(writer, router.requestID(request), job)
}
func (router *Router) getSEO(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.SEO.Get(request.Context())
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) updateSEO(writer http.ResponseWriter, request *http.Request) {
	var input service.SEOInput
	if !router.decode(writer, request, &input) {
		return
	}
	item, err := router.services.SEO.Update(request.Context(), input)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "seo.settings.update", "seo", "site", "success", "")
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) updateSEOCredentials(writer http.ResponseWriter, request *http.Request) {
	var input service.SEOCredentialsInput
	if !router.decode(writer, request, &input) {
		return
	}
	item, err := router.services.SEO.UpdateCredentials(request.Context(), input)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "seo.credentials.update", "env", "seo", "success", "")
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) rebuildSEO(writer http.ResponseWriter, request *http.Request) {
	job, err := router.services.Jobs.Start(request.Context(), "seo_rebuild", func(ctx context.Context, report func(int, string)) error {
		return router.services.SEO.Rebuild(ctx, report)
	})
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "seo.rebuild", "job", job.ID, "accepted", "")
	writeCreated(writer, router.requestID(request), job)
}
func (router *Router) pushSEO(writer http.ResponseWriter, request *http.Request) {
	job, err := router.services.Jobs.Start(request.Context(), "seo_push", func(ctx context.Context, report func(int, string)) error {
		return router.services.SEO.Push(ctx, report)
	})
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "seo.push", "job", job.ID, "accepted", "")
	writeCreated(writer, router.requestID(request), job)
}
func (router *Router) listPages(writer http.ResponseWriter, request *http.Request) {
	pagination := router.pagination(request)
	items, total, err := router.services.Engagement.ListPages(request.Context(), pagination.Page, pagination.PageSize)
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), pageResponse[domain.Page]{Items: items, Page: pagination.Page, PageSize: pagination.PageSize, Total: total})
}
func (router *Router) createPage(writer http.ResponseWriter, request *http.Request) {
	var input service.PageInput
	if !router.decode(writer, request, &input) {
		return
	}
	item, err := router.services.Engagement.CreatePage(request.Context(), input)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "page.create", "page", item.ID, "success", item.Slug)
	router.revalidate("/", "/sitemap.xml", "/"+item.Slug)
	writeCreated(writer, router.requestID(request), item)
}
func (router *Router) getPage(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.Engagement.GetPage(request.Context(), request.PathValue("id"))
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) updatePage(writer http.ResponseWriter, request *http.Request) {
	var input service.PageInput
	if !router.decode(writer, request, &input) {
		return
	}
	item, err := router.services.Engagement.UpdatePage(request.Context(), request.PathValue("id"), input)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "page.update", "page", item.ID, "success", item.Slug)
	router.revalidate("/", "/sitemap.xml", "/"+item.Slug)
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) trashPage(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.Engagement.SetPageStatus(request.Context(), request.PathValue("id"), domain.PostStatusTrash)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "page.trash", "page", item.ID, "success", "")
	router.revalidate("/", "/sitemap.xml", "/"+item.Slug)
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) publishPage(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.Engagement.SetPageStatus(request.Context(), request.PathValue("id"), domain.PostStatusPublished)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "page.publish", "page", item.ID, "success", item.Slug)
	router.revalidate("/", "/sitemap.xml", "/"+item.Slug)
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) unpublishPage(writer http.ResponseWriter, request *http.Request) {
	item, err := router.services.Engagement.SetPageStatus(request.Context(), request.PathValue("id"), domain.PostStatusUnpublished)
	if err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "page.unpublish", "page", item.ID, "success", item.Slug)
	router.revalidate("/", "/sitemap.xml", "/"+item.Slug)
	writeSuccess(writer, router.requestID(request), item)
}
func (router *Router) listComments(writer http.ResponseWriter, request *http.Request) {
	pagination := router.pagination(request)
	items, total, err := router.services.Engagement.ListComments(request.Context(), request.URL.Query().Get("status"), pagination.Page, pagination.PageSize)
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), pageResponse[service.Comment]{Items: items, Page: pagination.Page, PageSize: pagination.PageSize, Total: total})
}
func (router *Router) updateCommentStatus(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		Status string `json:"status"`
	}
	if !router.decode(writer, request, &input) {
		return
	}
	if err := router.services.Engagement.SetCommentStatus(request.Context(), request.PathValue("id"), input.Status); err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "comment.status", "comment", request.PathValue("id"), "success", input.Status)
	writeSuccess(writer, router.requestID(request), map[string]bool{"updated": true})
}
func (router *Router) listSuggestions(writer http.ResponseWriter, request *http.Request) {
	pagination := router.pagination(request)
	items, total, err := router.services.Engagement.ListSuggestions(request.Context(), request.URL.Query().Get("status"), pagination.Page, pagination.PageSize)
	if err != nil {
		router.internalError(writer, request, err)
		return
	}
	writeSuccess(writer, router.requestID(request), pageResponse[service.Suggestion]{Items: items, Page: pagination.Page, PageSize: pagination.PageSize, Total: total})
}
func (router *Router) updateSuggestionStatus(writer http.ResponseWriter, request *http.Request) {
	var input struct {
		Status string `json:"status"`
	}
	if !router.decode(writer, request, &input) {
		return
	}
	if err := router.services.Engagement.SetSuggestionStatus(request.Context(), request.PathValue("id"), input.Status); err != nil {
		router.contentError(writer, request, err)
		return
	}
	router.audit(request, "suggestion.status", "suggestion", request.PathValue("id"), "success", input.Status)
	writeSuccess(writer, router.requestID(request), map[string]bool{"updated": true})
}

func (router *Router) decode(writer http.ResponseWriter, request *http.Request, target interface{}) bool {
	decoder := json.NewDecoder(http.MaxBytesReader(writer, request.Body, 2<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		writeError(writer, http.StatusBadRequest, 40001, router.requestID(request), "请求数据格式错误", map[string]string{"reason": err.Error()})
		return false
	}
	return true
}
func (router *Router) pagination(request *http.Request) service.Pagination {
	page, _ := strconv.Atoi(request.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(request.URL.Query().Get("pageSize"))
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}
	return service.Pagination{Page: page, PageSize: pageSize}
}
func (router *Router) contentError(writer http.ResponseWriter, request *http.Request, err error) {
	switch {
	case errors.Is(err, service.ErrNotFound):
		writeError(writer, http.StatusNotFound, 40401, router.requestID(request), "资源不存在", nil)
	case errors.Is(err, service.ErrConflict):
		writeError(writer, http.StatusConflict, 40901, router.requestID(request), "资源与现有数据冲突", nil)
	case errors.Is(err, service.ErrInvalidInput):
		writeError(writer, http.StatusUnprocessableEntity, 42201, router.requestID(request), "字段校验失败，请检查标题、Slug、语言、链接或正文", nil)
	default:
		router.internalError(writer, request, err)
	}
}
func (router *Router) internalError(writer http.ResponseWriter, request *http.Request, err error) {
	writeError(writer, http.StatusInternalServerError, 50001, router.requestID(request), "系统暂时无法处理请求，请稍后重试", nil)
}
func sizeOf(info os.FileInfo) int64 {
	if info == nil {
		return 0
	}
	return info.Size()
}
func _unusedHandlerImports() { _ = strings.Builder{} }
