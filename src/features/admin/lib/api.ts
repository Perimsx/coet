"use client";

import type {
  ApiEnvelope,
  AuditLog,
  Backup,
  Category,
  Comment,
  DashboardSummary,
  FriendLink,
  GitStatus,
  NavigationItem,
  Page,
  Pagination,
  Post,
  SEOSettings,
  Suggestion,
  SystemJob,
  Tag,
} from "./types";

const apiBase = process.env.NEXT_PUBLIC_CMS_API_URL || "/api";
let csrfToken = "";

export class CMSApiError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
  }
}

export function setCSRFToken(token: string) {
  csrfToken = token;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD"].includes(init.method || "GET") && csrfToken)
    headers.set("X-CSRF-Token", csrfToken);
  const response = await fetch(`${apiBase}/v1${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || payload.code !== 0)
    throw new CMSApiError(payload.code, payload.message || "请求失败");
  return payload.data;
}

export const cmsApi = {
  login: (password: string) =>
    request<{ csrfToken: string; expiresAt: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  logout: () =>
    request<{ loggedOut: boolean }>("/auth/logout", { method: "POST" }),
  logoutAll: () =>
    request<{ loggedOut: boolean }>("/auth/logout-all", { method: "POST" }),
  session: () =>
    request<{ authenticated: boolean; csrfToken: string; expiresAt: string }>(
      "/auth/session",
    ),
  summary: () => request<DashboardSummary>("/admin/dashboard/summary"),
  posts: (query = "") => request<Pagination<Post>>(`/admin/posts${query}`),
  post: (id: string) => request<Post>(`/admin/posts/${id}`),
  createPost: (body: Partial<Post> & { tagIds?: string[] }) =>
    request<Post>("/admin/posts", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updatePost: (id: string, body: Partial<Post> & { tagIds?: string[] }) =>
    request<Post>(`/admin/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  publishPost: (id: string) =>
    request<Post>(`/admin/posts/${id}/publish`, { method: "POST" }),
  unpublishPost: (id: string) =>
    request<Post>(`/admin/posts/${id}/unpublish`, { method: "POST" }),
  trashPost: (id: string) =>
    request<Post>(`/admin/posts/${id}`, { method: "DELETE" }),
  categories: () => request<Category[]>("/admin/categories"),
  createCategory: (body: Omit<Category, "id" | "postCount">) =>
    request<Category>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCategory: (id: string, body: Omit<Category, "id" | "postCount">) =>
    request<Category>(`/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCategory: (id: string, replacementId?: string) =>
    request<{ deleted: boolean }>(
      `/admin/categories/${id}${replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : ""}`,
      { method: "DELETE" },
    ),
  tags: () => request<Tag[]>("/admin/tags"),
  createTag: (body: Omit<Tag, "id" | "postCount">) =>
    request<Tag>("/admin/tags", { method: "POST", body: JSON.stringify(body) }),
  updateTag: (id: string, body: Omit<Tag, "id" | "postCount">) =>
    request<Tag>(`/admin/tags/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTag: (id: string) =>
    request<{ deleted: boolean }>(`/admin/tags/${id}`, { method: "DELETE" }),
  health: () =>
    request<{ api: string; database: string; databaseSize: number }>(
      "/admin/system/health",
    ),
  jobs: () => request<Pagination<SystemJob>>("/admin/system/jobs"),
  job: (id: string) => request<SystemJob>(`/admin/system/jobs/${id}`),
  retryJob: (id: string) =>
    request<SystemJob>(`/admin/system/jobs/${id}/retry`, { method: "POST" }),
  backups: () => request<Backup[]>("/admin/system/backups"),
  createBackup: () =>
    request<SystemJob>("/admin/system/backups", { method: "POST" }),
  restoreBackup: (id: string) =>
    request<SystemJob>(`/admin/system/backups/${id}/restore`, {
      method: "POST",
    }),
  gitStatus: () => request<GitStatus>("/admin/system/git/status"),
  checkGitUpdates: () =>
    request<SystemJob>("/admin/system/git/check", { method: "POST" }),
  updateGit: () =>
    request<SystemJob>("/admin/system/git/update", { method: "POST" }),
  rollbackGit: () =>
    request<SystemJob>("/admin/system/git/rollback", { method: "POST" }),
  auditLogs: () =>
    request<Pagination<AuditLog>>("/admin/system/logs?page=1&pageSize=100"),
  settings: () => request<Record<string, string>>("/admin/settings"),
  updateSettings: (values: Record<string, string>) =>
    request<Record<string, string>>("/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(values),
    }),
  navigation: () => request<NavigationItem[]>("/admin/navigation"),
  updateNavigation: (items: NavigationItem[]) =>
    request<NavigationItem[]>("/admin/navigation", {
      method: "PUT",
      body: JSON.stringify(items),
    }),
  friends: () => request<FriendLink[]>("/admin/friends"),
  createFriend: (
    body: Omit<FriendLink, "id" | "lastCheckedAt" | "lastCheckStatus">,
  ) =>
    request<FriendLink>("/admin/friends", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateFriend: (
    id: string,
    body: Omit<FriendLink, "id" | "lastCheckedAt" | "lastCheckStatus">,
  ) =>
    request<FriendLink>(`/admin/friends/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteFriend: (id: string) =>
    request<{ deleted: boolean }>(`/admin/friends/${id}`, { method: "DELETE" }),
  checkFriend: (id: string) =>
    request<SystemJob>(`/admin/friends/${id}/check`, { method: "POST" }),
  seo: () => request<SEOSettings>("/admin/seo"),
  updateSEO: (
    body: Omit<
      SEOSettings,
      "revalidateConfigured" | "indexNowConfigured" | "baiduConfigured"
    >,
  ) =>
    request<SEOSettings>("/admin/seo", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  rebuildSEO: () =>
    request<SystemJob>("/admin/seo/rebuild", { method: "POST" }),
  pushSEO: () => request<SystemJob>("/admin/seo/push", { method: "POST" }),
  pages: () => request<Pagination<Page>>("/admin/pages?page=1&pageSize=100"),
  page: (id: string) => request<Page>(`/admin/pages/${id}`),
  createPage: (
    body: Pick<
      Page,
      "title" | "slug" | "content" | "seoTitle" | "seoDescription"
    >,
  ) =>
    request<Page>("/admin/pages", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updatePage: (
    id: string,
    body: Pick<
      Page,
      "title" | "slug" | "content" | "seoTitle" | "seoDescription"
    >,
  ) =>
    request<Page>(`/admin/pages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  publishPage: (id: string) =>
    request<Page>(`/admin/pages/${id}/publish`, { method: "POST" }),
  unpublishPage: (id: string) =>
    request<Page>(`/admin/pages/${id}/unpublish`, { method: "POST" }),
  trashPage: (id: string) =>
    request<Page>(`/admin/pages/${id}`, { method: "DELETE" }),
  comments: (status?: Comment["status"]) =>
    request<Pagination<Comment>>(
      `/admin/comments?page=1&pageSize=100${status ? `&status=${status}` : ""}`,
    ),
  updateCommentStatus: (
    id: string,
    status: Exclude<Comment["status"], "pending">,
  ) =>
    request<{ updated: boolean }>(`/admin/comments/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  suggestions: (status?: Suggestion["status"]) =>
    request<Pagination<Suggestion>>(
      `/admin/suggestions?page=1&pageSize=100${status ? `&status=${status}` : ""}`,
    ),
  updateSuggestionStatus: (id: string, status: Suggestion["status"]) =>
    request<{ updated: boolean }>(`/admin/suggestions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
