export type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  requestId: string
}

export type Pagination<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export type Tag = { id: string; slug: string; name: string; description: string; postCount: number }
export type Category = { id: string; slug: string; labelZh: string; labelEn: string; description: string; sortOrder: number; enabled: boolean; postCount: number }
export type Post = { id: string; title: string; slug: string; summary: string; content: string; coverUrl: string; language: 'zh' | 'en'; status: 'draft' | 'published' | 'unpublished' | 'trash'; categoryId?: string; categoryName?: string; seoTitle: string; seoDescription: string; tags: Tag[]; publishedAt?: string; updatedAt: string }
export type DashboardSummary = { publishedPosts: number; draftPosts: number; categories: number; tags: number }
export type SystemJob = { id: string; type: string; status: 'queued' | 'running' | 'succeeded' | 'failed'; progress: number; message: string; logs: string; createdAt: string; startedAt?: string; completedAt?: string }
export type Backup = { id: string; fileName: string; fileSize: number; checksum: string; createdAt: string; restoredAt?: string }
export type GitStatus = { configured: boolean; branch: string; commit: string; commitTime: string; dirty: boolean; remoteAhead: number; repository: string }
export type FriendLink = { id: string; name: string; url: string; avatarUrl: string; description: string; groupName: string; sortOrder: number; enabled: boolean; lastCheckedAt?: string; lastCheckStatus: string }
export type NavigationItem = { id: string; parentId?: string; label: string; href: string; sortOrder: number; enabled: boolean; children?: NavigationItem[] }
export type Page = { id: string; title: string; slug: string; content: string; status: Post['status']; seoTitle: string; seoDescription: string; publishedAt?: string; createdAt: string; updatedAt: string }
export type Comment = { id: string; postId: string; parentId?: string; authorName: string; authorEmail: string; content: string; status: 'pending' | 'approved' | 'hidden' | 'spam' | 'deleted'; createdAt: string; updatedAt: string }
export type Suggestion = { id: string; contact: string; content: string; status: 'unread' | 'read' | 'archived' | 'deleted'; createdAt: string; updatedAt: string }
export type AuditLog = { id: string; action: string; targetType: string; targetId: string; status: string; requestId: string; details: string; createdAt: string }
