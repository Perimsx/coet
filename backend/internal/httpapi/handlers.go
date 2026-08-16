package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/kerntau/blog/cms-api/internal/domain"
	"github.com/kerntau/blog/cms-api/internal/service"
	"github.com/labstack/echo/v4"
)

func (router *Router) health(c echo.Context) error {
	return writeSuccess(c, map[string]string{
		"status":  "ok",
		"service": "xuzhan-cms-api",
		"time":    nowUTC().Format(time.RFC3339Nano),
	})
}

func (router *Router) publicPosts(c echo.Context) error {
	filters := service.PostFilters{Pagination: router.pagination(c)}
	filters.Keyword = c.QueryParam("keyword")
	filters.Language = c.QueryParam("language")
	filters.CategoryID = c.QueryParam("categoryId")
	filters.TagID = c.QueryParam("tagId")

	items, total, err := router.services.Public.ListPosts(c.Request().Context(), filters)
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, pageResponse[domain.Post]{
		Items:    items,
		Page:     filters.Page,
		PageSize: filters.PageSize,
		Total:    total,
	})
}

func (router *Router) publicPost(c echo.Context) error {
	slug := c.Param("*")
	item, err := router.services.Public.PostBySlug(c.Request().Context(), slug)
	if err != nil {
		return router.contentError(c, err)
	}
	return writeSuccess(c, item)
}

func (router *Router) publicPage(c echo.Context) error {
	slug := c.Param("*")
	item, err := router.services.Public.PageBySlug(c.Request().Context(), slug)
	if err != nil {
		return router.contentError(c, err)
	}
	return writeSuccess(c, item)
}

func (router *Router) publicCategories(c echo.Context) error {
	items, err := router.services.Public.Categories(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, items)
}

func (router *Router) publicTags(c echo.Context) error {
	items, err := router.services.Public.Tags(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, items)
}

func (router *Router) publicFriends(c echo.Context) error {
	items, err := router.services.Public.PublishedFriends(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, items)
}

func (router *Router) publicSettings(c echo.Context) error {
	items, err := router.services.Public.Settings(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, items)
}

func (router *Router) publicNavigation(c echo.Context) error {
	items, err := router.services.Public.Navigation(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, items)
}

func (router *Router) systemHealth(c echo.Context) error {
	info, err := os.Stat(router.config.DatabasePath)
	if err != nil && !os.IsNotExist(err) {
		return router.internalError(c, err)
	}
	return writeSuccess(c, map[string]interface{}{
		"api":          "ok",
		"database":     "ok",
		"databaseSize": sizeOf(info),
		"time":         nowUTC().Format(time.RFC3339Nano),
	})
}

func (router *Router) login(c echo.Context) error {
	req := c.Request()
	if allowed, retryAfter := router.logins.allow(req); !allowed {
		c.Response().Header().Set("Retry-After", strconv.Itoa(max(1, int(retryAfter.Seconds()))))
		return writeError(c, http.StatusTooManyRequests, 42901, "登录失败次数过多，请稍后再试", nil)
	}

	var input struct {
		Password string `json:"password"`
	}
	if !router.decode(c, &input) {
		return nil
	}

	session, err := router.services.Auth.Login(req.Context(), input.Password, router.requestID(c))
	if errors.Is(err, service.ErrInvalidInput) {
		router.logins.failure(req)
		router.audit(c, "auth.login", "session", "", "failed", "invalid password")
		return writeError(c, http.StatusUnauthorized, 40102, "管理员密码错误", nil)
	}
	if errors.Is(err, service.ErrInvalidSession) {
		return writeError(c, http.StatusServiceUnavailable, 50301, "管理员密码尚未配置", nil)
	}
	if err != nil {
		return router.internalError(c, err)
	}

	c.SetCookie(&http.Cookie{
		Name:     sessionCookieName,
		Value:    session.ID,
		Path:     "/",
		HttpOnly: true,
		Secure:   router.config.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		Expires:  session.ExpiresAt,
		MaxAge:   int(time.Until(session.ExpiresAt).Seconds()),
	})

	router.logins.success(req)
	router.audit(c, "auth.login", "session", session.ID, "success", "")
	return writeSuccess(c, map[string]interface{}{
		"csrfToken": session.CSRFToken,
		"expiresAt": session.ExpiresAt,
	})
}

func (router *Router) logout(c echo.Context) error {
	cookie, _ := c.Request().Cookie(sessionCookieName)
	if cookie != nil {
		_ = router.services.Auth.DeleteSession(c.Request().Context(), cookie.Value)
	}
	c.SetCookie(&http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   router.config.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
	router.audit(c, "auth.logout", "session", "", "success", "")
	return writeSuccess(c, map[string]bool{"loggedOut": true})
}

func (router *Router) logoutAll(c echo.Context) error {
	if err := router.services.Auth.DeleteAllSessions(c.Request().Context()); err != nil {
		return router.internalError(c, err)
	}
	c.SetCookie(&http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   router.config.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
	router.audit(c, "auth.logout_all", "session", "all", "success", "")
	return writeSuccess(c, map[string]bool{"loggedOut": true})
}

func (router *Router) session(c echo.Context) error {
	cookie, _ := c.Request().Cookie(sessionCookieName)
	session, err := router.services.Auth.Session(c.Request().Context(), cookie.Value)
	if err != nil {
		return writeError(c, http.StatusUnauthorized, 40101, "管理员登录已失效", nil)
	}
	return writeSuccess(c, map[string]interface{}{
		"authenticated": true,
		"csrfToken":     session.CSRFToken,
		"expiresAt":     session.ExpiresAt,
	})
}

func (router *Router) changePassword(c echo.Context) error {
	var input struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if !router.decode(c, &input) {
		return nil
	}
	if err := router.services.Auth.ChangePassword(c.Request().Context(), input.CurrentPassword, input.NewPassword); err != nil {
		return writeError(c, http.StatusUnprocessableEntity, 42201, "当前密码错误或新密码少于 12 位", nil)
	}
	c.SetCookie(&http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   router.config.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
	router.audit(c, "auth.change_password", "credential", "admin", "success", "")
	return writeSuccess(c, map[string]bool{"changed": true})
}

func (router *Router) dashboardSummary(c echo.Context) error {
	summary, err := router.services.Dashboard.Summary(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, summary)
}

func (router *Router) listPosts(c echo.Context) error {
	filters := service.PostFilters{Pagination: router.pagination(c)}
	filters.Keyword = c.QueryParam("keyword")
	filters.Status = c.QueryParam("status")
	filters.Language = c.QueryParam("language")
	filters.CategoryID = c.QueryParam("categoryId")
	filters.TagID = c.QueryParam("tagId")

	items, total, err := router.services.Posts.List(c.Request().Context(), filters)
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, pageResponse[domain.Post]{
		Items:    items,
		Page:     filters.Page,
		PageSize: filters.PageSize,
		Total:    total,
	})
}

func (router *Router) createPost(c echo.Context) error {
	var input service.PostInput
	if !router.decode(c, &input) {
		return nil
	}
	item, err := router.services.Posts.Create(c.Request().Context(), input)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "post.create", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/tags", "/blog/category")
	return writeCreated(c, item)
}

func (router *Router) getPost(c echo.Context) error {
	item, err := router.services.Posts.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return router.contentError(c, err)
	}
	return writeSuccess(c, item)
}

func (router *Router) updatePost(c echo.Context) error {
	var input service.PostInput
	if !router.decode(c, &input) {
		return nil
	}
	item, err := router.services.Posts.Update(c.Request().Context(), c.Param("id"), input)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "post.update", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/"+item.Slug, "/tags", "/blog/category")
	return writeSuccess(c, item)
}

func (router *Router) deletePost(c echo.Context) error {
	item, err := router.services.Posts.Trash(c.Request().Context(), c.Param("id"))
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "post.trash", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/"+item.Slug, "/tags", "/blog/category")
	return writeSuccess(c, item)
}

func (router *Router) publishPost(c echo.Context) error {
	item, err := router.services.Posts.Publish(c.Request().Context(), c.Param("id"))
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "post.publish", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/"+item.Slug, "/"+item.Slug, "/tags", "/blog/category")
	return writeSuccess(c, item)
}

func (router *Router) unpublishPost(c echo.Context) error {
	item, err := router.services.Posts.Unpublish(c.Request().Context(), c.Param("id"))
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "post.unpublish", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/"+item.Slug, "/"+item.Slug, "/tags", "/blog/category")
	return writeSuccess(c, item)
}

func (router *Router) restorePost(c echo.Context) error {
	item, err := router.services.Posts.Restore(c.Request().Context(), c.Param("id"))
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "post.restore", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/"+item.Slug, "/tags", "/blog/category")
	return writeSuccess(c, item)
}

func (router *Router) listRevisions(c echo.Context) error {
	items, err := router.services.Posts.Revisions(c.Request().Context(), c.Param("id"))
	if err != nil {
		return router.contentError(c, err)
	}
	return writeSuccess(c, items)
}

func (router *Router) restoreRevision(c echo.Context) error {
	item, err := router.services.Posts.RestoreRevision(c.Request().Context(), c.Param("id"), c.Param("revisionID"))
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "post.restore_revision", "post", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/"+item.Slug, "/tags", "/blog/category")
	return writeSuccess(c, item)
}

func (router *Router) listCategories(c echo.Context) error {
	items, err := router.services.Categories.List(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, items)
}

func (router *Router) createCategory(c echo.Context) error {
	var input service.CategoryInput
	if !router.decode(c, &input) {
		return nil
	}
	item, err := router.services.Categories.Create(c.Request().Context(), input)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "category.create", "category", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/category", "/tags")
	return writeCreated(c, item)
}

func (router *Router) updateCategory(c echo.Context) error {
	var input service.CategoryInput
	if !router.decode(c, &input) {
		return nil
	}
	item, err := router.services.Categories.Update(c.Request().Context(), c.Param("id"), input)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "category.update", "category", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/category/"+item.Slug, "/tags")
	return writeSuccess(c, item)
}

func (router *Router) deleteCategory(c echo.Context) error {
	replacement := c.QueryParam("replacementId")
	err := router.services.Categories.Delete(c.Request().Context(), c.Param("id"), replacement)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "category.delete", "category", c.Param("id"), "success", "")
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/blog/category", "/tags")
	return writeSuccess(c, map[string]bool{"deleted": true})
}

func (router *Router) listTags(c echo.Context) error {
	items, err := router.services.Tags.List(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, items)
}

func (router *Router) createTag(c echo.Context) error {
	var input service.TagInput
	if !router.decode(c, &input) {
		return nil
	}
	item, err := router.services.Tags.Create(c.Request().Context(), input)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "tag.create", "tag", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/tags", "/blog/category")
	return writeCreated(c, item)
}

func (router *Router) updateTag(c echo.Context) error {
	var input service.TagInput
	if !router.decode(c, &input) {
		return nil
	}
	item, err := router.services.Tags.Update(c.Request().Context(), c.Param("id"), input)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "tag.update", "tag", item.ID, "success", item.Slug)
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/tags", "/tags/"+item.Slug, "/blog/category")
	return writeSuccess(c, item)
}

func (router *Router) deleteTag(c echo.Context) error {
	err := router.services.Tags.Delete(c.Request().Context(), c.Param("id"))
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "tag.delete", "tag", c.Param("id"), "success", "")
	router.revalidate("/", "/blog", "/archive", "/sitemap.xml", "/tags", "/blog/category")
	return writeSuccess(c, map[string]bool{"deleted": true})
}

func (router *Router) listAuditLogs(c echo.Context) error {
	pagination := router.pagination(c)
	items, total, err := router.services.Audit.List(c.Request().Context(), pagination.Page, pagination.PageSize)
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, pageResponse[service.AuditLog]{
		Items:    items,
		Page:     pagination.Page,
		PageSize: pagination.PageSize,
		Total:    total,
	})
}

func (router *Router) listJobs(c echo.Context) error {
	pagination := router.pagination(c)
	items, total, err := router.services.Jobs.List(c.Request().Context(), pagination.Page, pagination.PageSize)
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, pageResponse[service.Job]{
		Items:    items,
		Page:     pagination.Page,
		PageSize: pagination.PageSize,
		Total:    total,
	})
}

func (router *Router) getJob(c echo.Context) error {
	item, err := router.services.Jobs.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return router.contentError(c, err)
	}
	return writeSuccess(c, item)
}

func (router *Router) retryJob(c echo.Context) error {
	previous, err := router.services.Jobs.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return router.contentError(c, err)
	}
	if previous.Status != "failed" {
		return writeError(c, http.StatusConflict, 40901, "只有失败任务可以重试", nil)
	}
	job, err := router.startRetryJob(c.Request().Context(), previous.Type)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "system.job.retry", "job", job.ID, "accepted", "retry="+previous.ID)
	return writeCreated(c, job)
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

func (router *Router) listBackups(c echo.Context) error {
	items, err := router.services.System.ListBackups(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, items)
}

func (router *Router) createBackup(c echo.Context) error {
	job, err := router.services.Jobs.Start(c.Request().Context(), "database_backup", func(ctx context.Context, report func(int, string)) error {
		report(20, "正在创建 SQLite 一致性快照")
		item, err := router.services.System.CreateBackup(ctx)
		if err == nil {
			report(90, "备份已创建: "+item.FileName)
		}
		return err
	})
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "system.backup.create", "job", job.ID, "accepted", "")
	return writeCreated(c, job)
}

func (router *Router) restoreBackup(c echo.Context) error {
	id := c.Param("id")
	job, err := router.services.Jobs.Start(c.Request().Context(), "database_restore", func(ctx context.Context, report func(int, string)) error {
		report(20, "正在校验备份和创建恢复前快照")
		_, err := router.services.System.RestoreBackup(ctx, id)
		return err
	})
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "system.backup.restore", "backup", id, "accepted", "")
	return writeCreated(c, job)
}

func (router *Router) gitStatus(c echo.Context) error {
	item, err := router.services.System.GitStatus(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, item)
}

func (router *Router) checkGitUpdates(c echo.Context) error {
	action := "system.git.check"
	job, err := router.services.Jobs.StartWithCallbacks(c.Request().Context(), "git_check", func(ctx context.Context, report func(int, string)) error {
		report(15, "正在获取固定远程分支")
		status, err := router.services.System.CheckUpdates(ctx)
		if err == nil {
			report(90, "检查完成，待更新提交数: "+strconv.Itoa(status.RemoteAhead))
		}
		return err
	}, func(created service.Job) {
		router.audit(c, action, "job", created.ID, "accepted", "任务已受理，正在检查远程仓库")
	}, router.completeJobAudit(action))
	if err != nil {
		return router.contentError(c, err)
	}
	return writeCreated(c, job)
}

func (router *Router) updateGit(c echo.Context) error {
	action := "system.git.update"
	job, err := router.services.Jobs.StartWithCallbacks(c.Request().Context(), "git_update", func(ctx context.Context, report func(int, string)) error {
		return router.services.System.Update(ctx, report)
	}, func(created service.Job) {
		router.audit(c, action, "job", created.ID, "accepted", "任务已受理，正在从远程仓库更新")
	}, router.completeJobAudit(action))
	if err != nil {
		return router.contentError(c, err)
	}
	return writeCreated(c, job)
}

func (router *Router) rollbackGit(c echo.Context) error {
	action := "system.git.rollback"
	job, err := router.services.Jobs.StartWithCallbacks(c.Request().Context(), "git_rollback", func(ctx context.Context, report func(int, string)) error {
		return router.services.System.Rollback(ctx, report)
	}, func(created service.Job) {
		router.audit(c, action, "job", created.ID, "accepted", "任务已受理，正在准备回滚")
	}, router.completeJobAudit(action))
	if err != nil {
		return router.contentError(c, err)
	}
	return writeCreated(c, job)
}

func (router *Router) gitLogs(c echo.Context) error {
	count, _ := strconv.Atoi(c.QueryParam("count"))
	items, err := router.services.System.GitLog(c.Request().Context(), count)
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, items)
}

func (router *Router) listDeployments(c echo.Context) error {
	items, err := router.services.System.ListDeployments(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, items)
}

func (router *Router) systemInfo(c echo.Context) error {
	info := router.services.System.GetSystemInfo(c.Request().Context())
	return writeSuccess(c, info)
}

func (router *Router) getSettings(c echo.Context) error {
	values, err := router.services.Site.GetSettings(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, values)
}

func (router *Router) updateSettings(c echo.Context) error {
	var values map[string]string
	if !router.decode(c, &values) {
		return nil
	}
	result, err := router.services.Site.UpdateSettings(c.Request().Context(), values)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "site.settings.update", "settings", "site", "success", "")
	router.revalidate("/", "/about", "/friends", "/sitemap.xml", "/robots.txt")
	return writeSuccess(c, result)
}

func (router *Router) getNavigation(c echo.Context) error {
	items, err := router.services.Site.Navigation(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, items)
}

func (router *Router) replaceNavigation(c echo.Context) error {
	var inputs []service.NavigationInput
	if !router.decode(c, &inputs) {
		return nil
	}
	items, err := router.services.Site.ReplaceNavigation(c.Request().Context(), inputs)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "site.navigation.update", "navigation", "site", "success", "")
	router.revalidate("/", "/archive", "/friends", "/about")
	return writeSuccess(c, items)
}

func (router *Router) listFriends(c echo.Context) error {
	items, err := router.services.Site.ListFriends(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, items)
}

func (router *Router) createFriend(c echo.Context) error {
	var input service.FriendLinkInput
	if !router.decode(c, &input) {
		return nil
	}
	item, err := router.services.Site.CreateFriend(c.Request().Context(), input)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "friend.create", "friend", item.ID, "success", item.URL)
	router.revalidate("/friends", "/sitemap.xml")
	return writeCreated(c, item)
}

func (router *Router) updateFriend(c echo.Context) error {
	var input service.FriendLinkInput
	if !router.decode(c, &input) {
		return nil
	}
	item, err := router.services.Site.UpdateFriend(c.Request().Context(), c.Param("id"), input)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "friend.update", "friend", item.ID, "success", item.URL)
	router.revalidate("/friends", "/sitemap.xml")
	return writeSuccess(c, item)
}

func (router *Router) deleteFriend(c echo.Context) error {
	id := c.Param("id")
	if err := router.services.Site.DeleteFriend(c.Request().Context(), id); err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "friend.delete", "friend", id, "success", "")
	router.revalidate("/friends", "/sitemap.xml")
	return writeSuccess(c, map[string]bool{"deleted": true})
}

func (router *Router) checkFriend(c echo.Context) error {
	id := c.Param("id")
	job, err := router.services.Jobs.Start(c.Request().Context(), "friend_check", func(ctx context.Context, report func(int, string)) error {
		report(20, "正在检查友链 URL 连通性")
		item, err := router.services.Site.CheckFriend(ctx, id)
		if err == nil {
			report(90, "检查完成: "+item.LastCheckStatus)
		}
		return err
	})
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "friend.check", "friend", id, "accepted", "")
	return writeCreated(c, job)
}

func (router *Router) getSEO(c echo.Context) error {
	item, err := router.services.SEO.Get(c.Request().Context())
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, item)
}

func (router *Router) updateSEO(c echo.Context) error {
	var input service.SEOInput
	if !router.decode(c, &input) {
		return nil
	}
	item, err := router.services.SEO.Update(c.Request().Context(), input)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "seo.settings.update", "seo", "site", "success", "")
	return writeSuccess(c, item)
}

func (router *Router) updateSEOCredentials(c echo.Context) error {
	var input service.SEOCredentialsInput
	if !router.decode(c, &input) {
		return nil
	}
	item, err := router.services.SEO.UpdateCredentials(c.Request().Context(), input)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "seo.credentials.update", "env", "seo", "success", "")
	return writeSuccess(c, item)
}

func (router *Router) rebuildSEO(c echo.Context) error {
	job, err := router.services.Jobs.Start(c.Request().Context(), "seo_rebuild", func(ctx context.Context, report func(int, string)) error {
		return router.services.SEO.Rebuild(ctx, report)
	})
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "seo.rebuild", "job", job.ID, "accepted", "")
	return writeCreated(c, job)
}

func (router *Router) pushSEO(c echo.Context) error {
	job, err := router.services.Jobs.Start(c.Request().Context(), "seo_push", func(ctx context.Context, report func(int, string)) error {
		return router.services.SEO.Push(ctx, report)
	})
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "seo.push", "job", job.ID, "accepted", "")
	return writeCreated(c, job)
}

func (router *Router) listPages(c echo.Context) error {
	pagination := router.pagination(c)
	items, total, err := router.services.Engagement.ListPages(c.Request().Context(), pagination.Page, pagination.PageSize)
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, pageResponse[domain.Page]{
		Items:    items,
		Page:     pagination.Page,
		PageSize: pagination.PageSize,
		Total:    total,
	})
}

func (router *Router) createPage(c echo.Context) error {
	var input service.PageInput
	if !router.decode(c, &input) {
		return nil
	}
	item, err := router.services.Engagement.CreatePage(c.Request().Context(), input)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "page.create", "page", item.ID, "success", item.Slug)
	router.revalidate("/", "/sitemap.xml", "/"+item.Slug)
	return writeCreated(c, item)
}

func (router *Router) getPage(c echo.Context) error {
	item, err := router.services.Engagement.GetPage(c.Request().Context(), c.Param("id"))
	if err != nil {
		return router.contentError(c, err)
	}
	return writeSuccess(c, item)
}

func (router *Router) updatePage(c echo.Context) error {
	var input service.PageInput
	if !router.decode(c, &input) {
		return nil
	}
	item, err := router.services.Engagement.UpdatePage(c.Request().Context(), c.Param("id"), input)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "page.update", "page", item.ID, "success", item.Slug)
	router.revalidate("/", "/sitemap.xml", "/"+item.Slug)
	return writeSuccess(c, item)
}

func (router *Router) trashPage(c echo.Context) error {
	item, err := router.services.Engagement.SetPageStatus(c.Request().Context(), c.Param("id"), domain.PostStatusTrash)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "page.trash", "page", item.ID, "success", "")
	router.revalidate("/", "/sitemap.xml", "/"+item.Slug)
	return writeSuccess(c, item)
}

func (router *Router) publishPage(c echo.Context) error {
	item, err := router.services.Engagement.SetPageStatus(c.Request().Context(), c.Param("id"), domain.PostStatusPublished)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "page.publish", "page", item.ID, "success", item.Slug)
	router.revalidate("/", "/sitemap.xml", "/"+item.Slug)
	return writeSuccess(c, item)
}

func (router *Router) unpublishPage(c echo.Context) error {
	item, err := router.services.Engagement.SetPageStatus(c.Request().Context(), c.Param("id"), domain.PostStatusUnpublished)
	if err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "page.unpublish", "page", item.ID, "success", item.Slug)
	router.revalidate("/", "/sitemap.xml", "/"+item.Slug)
	return writeSuccess(c, item)
}

func (router *Router) listComments(c echo.Context) error {
	pagination := router.pagination(c)
	items, total, err := router.services.Engagement.ListComments(c.Request().Context(), c.QueryParam("status"), pagination.Page, pagination.PageSize)
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, pageResponse[service.Comment]{
		Items:    items,
		Page:     pagination.Page,
		PageSize: pagination.PageSize,
		Total:    total,
	})
}

func (router *Router) updateCommentStatus(c echo.Context) error {
	var input struct {
		Status string `json:"status"`
	}
	if !router.decode(c, &input) {
		return nil
	}
	if err := router.services.Engagement.SetCommentStatus(c.Request().Context(), c.Param("id"), input.Status); err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "comment.status", "comment", c.Param("id"), "success", input.Status)
	return writeSuccess(c, map[string]bool{"updated": true})
}

func (router *Router) listSuggestions(c echo.Context) error {
	pagination := router.pagination(c)
	items, total, err := router.services.Engagement.ListSuggestions(c.Request().Context(), c.QueryParam("status"), pagination.Page, pagination.PageSize)
	if err != nil {
		return router.internalError(c, err)
	}
	return writeSuccess(c, pageResponse[service.Suggestion]{
		Items:    items,
		Page:     pagination.Page,
		PageSize: pagination.PageSize,
		Total:    total,
	})
}

func (router *Router) updateSuggestionStatus(c echo.Context) error {
	var input struct {
		Status string `json:"status"`
	}
	if !router.decode(c, &input) {
		return nil
	}
	if err := router.services.Engagement.SetSuggestionStatus(c.Request().Context(), c.Param("id"), input.Status); err != nil {
		return router.contentError(c, err)
	}
	router.audit(c, "suggestion.status", "suggestion", c.Param("id"), "success", input.Status)
	return writeSuccess(c, map[string]bool{"updated": true})
}

func (router *Router) decode(c echo.Context, target interface{}) bool {
	req := c.Request()
	decoder := json.NewDecoder(http.MaxBytesReader(c.Response().Writer, req.Body, 2<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		_ = writeError(c, http.StatusBadRequest, 40001, "请求数据格式错误", map[string]string{"reason": err.Error()})
		return false
	}
	return true
}

func (router *Router) pagination(c echo.Context) service.Pagination {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(c.QueryParam("pageSize"))
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}
	return service.Pagination{Page: page, PageSize: pageSize}
}

func (router *Router) contentError(c echo.Context, err error) error {
	switch {
	case errors.Is(err, service.ErrNotFound):
		return writeError(c, http.StatusNotFound, 40401, "资源不存在", nil)
	case errors.Is(err, service.ErrConflict):
		return writeError(c, http.StatusConflict, 40901, "资源与现有数据冲突", nil)
	case errors.Is(err, service.ErrInvalidInput):
		return writeError(c, http.StatusUnprocessableEntity, 42201, "字段校验失败，请检查标题、Slug、语言、链接或正文", nil)
	default:
		return router.internalError(c, err)
	}
}

func (router *Router) internalError(c echo.Context, err error) error {
	return writeError(c, http.StatusInternalServerError, 50001, "系统暂时无法处理请求，请稍后重试", nil)
}

func sizeOf(info os.FileInfo) int64 {
	if info == nil {
		return 0
	}
	return info.Size()
}
