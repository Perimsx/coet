import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'

export function getPostSourcePath(post: CoreContent<Blog>) {
  return post.filePath || post.path || post.slug || ''
}

export type SortOrder = 'asc' | 'desc'

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
