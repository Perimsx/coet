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
