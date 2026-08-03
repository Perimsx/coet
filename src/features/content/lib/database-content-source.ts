import 'server-only'

import type { Blog } from 'contentlayer/generated'
import type { HeaderNavLink } from '@/blog.config'

type Envelope<T> = { code: number; data: T }
type PageResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}
type PublicTag = { slug: string; name: string; postCount: number }
type PublicCategory = {
  slug: string
  labelZh: string
  labelEn: string
  postCount: number
}
export type DatabasePost = {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  coverUrl: string
  language: 'zh' | 'en'
  categoryName?: string
  tags: PublicTag[]
  publishedAt?: string
  updatedAt: string
}
export type PublicNavigationItem = {
  id: string
  label: string
  href: string
  sortOrder: number
  enabled: boolean
  children?: PublicNavigationItem[]
}

const apiBase = (
  process.env.CMS_CONTENT_API_URL || process.env.CMS_API_PROXY_URL
)?.replace(/\/$/, '')
export const isDatabaseContentEnabled = Boolean(apiBase)

async function fetchPublic<T>(path: string): Promise<T | null> {
  if (!apiBase) return null
  try {
    const response = await fetch(`${apiBase}/api/v1/public${path}`, {
      next: { revalidate: 60, tags: ['cms-public'] },
    })
    if (!response.ok) return null
    const payload = (await response.json()) as Envelope<T>
    return payload.code === 0 ? payload.data : null
  } catch {
    return null
  }
}

function toBlog(post: DatabasePost): Blog {
  const date = post.publishedAt || post.updatedAt
  const tagList = post.tags
    ? Array.from(new Set(post.tags.flatMap((tag) => [tag.slug, tag.name])))
    : []
  return {
    title: post.title,
    slug: post.slug,
    path: `blog/${post.slug}`,
    date,
    lastmod: post.updatedAt,
    summary: post.summary,
    tags: tagList,
    categories: post.categoryName ? [post.categoryName] : [],
    images: post.coverUrl ? [post.coverUrl] : [],
    draft: false,
  } as unknown as Blog
}

export async function getDatabaseBlogs(): Promise<Blog[] | null> {
  const data = await fetchPublic<PageResponse<DatabasePost>>(
    '/posts?page=1&pageSize=100'
  )
  return data ? data.items.map(toBlog) : null
}

export async function getDatabasePost(
  slug: string
): Promise<DatabasePost | null> {
  return fetchPublic<DatabasePost>(
    `/posts/${slug.split('/').map(encodeURIComponent).join('/')}`
  )
}

export async function getDatabaseTagCounts(): Promise<Record<
  string,
  number
> | null> {
  const items = await fetchPublic<PublicTag[]>('/tags')
  return items
    ? Object.fromEntries(items.map((item) => [item.slug, item.postCount]))
    : null
}

export async function getDatabaseCategoryCounts(): Promise<Record<
  string,
  number
> | null> {
  const items = await fetchPublic<PublicCategory[]>('/categories')
  return items
    ? Object.fromEntries(items.map((item) => [item.slug, item.postCount]))
    : null
}

export type PublicFriend = {
  name: string
  url: string
  avatarUrl: string
  description: string
  groupName: string
}
export async function getDatabaseFriends(): Promise<PublicFriend[] | null> {
  return fetchPublic<PublicFriend[]>('/friends')
}

export async function getDatabaseSettings(): Promise<Record<
  string,
  string
> | null> {
  return fetchPublic<Record<string, string>>('/settings')
}

function toHeaderNavLink(item: PublicNavigationItem): HeaderNavLink {
  return {
    href: item.href,
    title: item.label,
    ...(item.children?.length
      ? { children: item.children.map(toHeaderNavLink) }
      : {}),
  }
}

export async function getDatabaseNavigation(): Promise<HeaderNavLink[] | null> {
  const items = await fetchPublic<PublicNavigationItem[]>('/navigation')
  return items
    ? items
        .filter((item) => item.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(toHeaderNavLink)
    : null
}
