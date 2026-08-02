'use client'

import type { ApiEnvelope, Backup, Category, DashboardSummary, FriendLink, GitStatus, NavigationItem, Pagination, Post, SystemJob, Tag } from './types'

const apiBase = process.env.NEXT_PUBLIC_CMS_API_URL || '/api'
let csrfToken = ''

export class CMSApiError extends Error {
  constructor(public readonly code: number, message: string) { super(message) }
}

export function setCSRFToken(token: string) { csrfToken = token }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD'].includes(init.method || 'GET') && csrfToken) headers.set('X-CSRF-Token', csrfToken)
  const response = await fetch(`${apiBase}/v1${path}`, { ...init, headers, credentials: 'include' })
  const payload = await response.json() as ApiEnvelope<T>
  if (!response.ok || payload.code !== 0) throw new CMSApiError(payload.code, payload.message || '请求失败')
  return payload.data
}

export const cmsApi = {
  login: (password: string) => request<{ csrfToken: string; expiresAt: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' }),
  session: () => request<{ authenticated: boolean; csrfToken: string; expiresAt: string }>('/auth/session'),
  summary: () => request<DashboardSummary>('/admin/dashboard/summary'),
  posts: (query = '') => request<Pagination<Post>>(`/admin/posts${query}`),
  post: (id: string) => request<Post>(`/admin/posts/${id}`),
  createPost: (body: Partial<Post> & { tagIds?: string[] }) => request<Post>('/admin/posts', { method: 'POST', body: JSON.stringify(body) }),
  updatePost: (id: string, body: Partial<Post> & { tagIds?: string[] }) => request<Post>(`/admin/posts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  publishPost: (id: string) => request<Post>(`/admin/posts/${id}/publish`, { method: 'POST' }),
  unpublishPost: (id: string) => request<Post>(`/admin/posts/${id}/unpublish`, { method: 'POST' }),
  trashPost: (id: string) => request<Post>(`/admin/posts/${id}`, { method: 'DELETE' }),
  categories: () => request<Category[]>('/admin/categories'),
  createCategory: (body: Omit<Category, 'id' | 'postCount'>) => request<Category>('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: string, body: Omit<Category, 'id' | 'postCount'>) => request<Category>(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCategory: (id: string, replacementId?: string) => request<{ deleted: boolean }>(`/admin/categories/${id}${replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : ''}`, { method: 'DELETE' }),
  tags: () => request<Tag[]>('/admin/tags'),
  createTag: (body: Omit<Tag, 'id' | 'postCount'>) => request<Tag>('/admin/tags', { method: 'POST', body: JSON.stringify(body) }),
  updateTag: (id: string, body: Omit<Tag, 'id' | 'postCount'>) => request<Tag>(`/admin/tags/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTag: (id: string) => request<{ deleted: boolean }>(`/admin/tags/${id}`, { method: 'DELETE' }),
  health: () => request<{ api: string; database: string; databaseSize: number }>('/admin/system/health'),
  jobs: () => request<Pagination<SystemJob>>('/admin/system/jobs'),
  job: (id: string) => request<SystemJob>(`/admin/system/jobs/${id}`),
  backups: () => request<Backup[]>('/admin/system/backups'),
  createBackup: () => request<SystemJob>('/admin/system/backups', { method: 'POST' }),
  restoreBackup: (id: string) => request<SystemJob>(`/admin/system/backups/${id}/restore`, { method: 'POST' }),
  gitStatus: () => request<GitStatus>('/admin/system/git/status'),
  checkGitUpdates: () => request<SystemJob>('/admin/system/git/check', { method: 'POST' }),
  updateGit: () => request<SystemJob>('/admin/system/git/update', { method: 'POST' }),
  settings: () => request<Record<string, string>>('/admin/settings'),
  updateSettings: (values: Record<string, string>) => request<Record<string, string>>('/admin/settings', { method: 'PATCH', body: JSON.stringify(values) }),
  navigation: () => request<NavigationItem[]>('/admin/navigation'),
  updateNavigation: (items: NavigationItem[]) => request<NavigationItem[]>('/admin/navigation', { method: 'PUT', body: JSON.stringify(items) }),
  friends: () => request<FriendLink[]>('/admin/friends'),
  createFriend: (body: Omit<FriendLink, 'id' | 'lastCheckedAt' | 'lastCheckStatus'>) => request<FriendLink>('/admin/friends', { method: 'POST', body: JSON.stringify(body) }),
  updateFriend: (id: string, body: Omit<FriendLink, 'id' | 'lastCheckedAt' | 'lastCheckStatus'>) => request<FriendLink>(`/admin/friends/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteFriend: (id: string) => request<{ deleted: boolean }>(`/admin/friends/${id}`, { method: 'DELETE' }),
}
