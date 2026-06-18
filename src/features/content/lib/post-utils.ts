import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import { getDictionary } from '@/shared/utils/i18n'

export type SortOrder = 'asc' | 'desc'

export function getPostSourcePath(post: CoreContent<Blog>) {
  return post.filePath || post.path || post.slug || ''
}

export function resolveSortOrder(sort: string | null): SortOrder {
  return sort === 'asc' ? 'asc' : 'desc'
}

export function sortPostsByDate(posts: CoreContent<Blog>[], sortOrder: SortOrder) {
  return [...posts].sort((a, b) => {
    const aTime = new Date(a.date).getTime()
    const bTime = new Date(b.date).getTime()
    return sortOrder === 'asc' ? aTime - bTime : bTime - aTime
  })
}

export function resolvePostLocale(content: { slug?: string; path?: string; filePath?: string }) {
  const isEn =
    content.slug?.startsWith('en/') ||
    content.path?.startsWith('en/') ||
    content.filePath?.includes('.en.')
  const locale = isEn ? 'en' : 'zh'
  return { locale, dictionary: getDictionary(locale) }
}
