'use client'

import { useEffect, useMemo, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { formatDate } from 'pliny/utils/formatDate'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/shared/components/Link'
import PageHeader from '@/shared/components/PageHeader'
import PostListItem from '@/features/content/components/PostListItem'
import PostPagination from '@/features/content/components/PostPagination'
import { getNavLanguage } from '@/features/site/lib/nav-language'
import { resolvePostCategories } from '@/features/content/lib/post-categories'
import { getLocalizedCategoryLabel } from '@/features/content/lib/localized-category-label'
import { ArrowUpDown } from 'lucide-react'
import { cn } from '@/shared/utils/utils'

interface PaginationProps {
  totalPages: number
  currentPage: number
}

interface ListLayoutProps {
  posts: CoreContent<Blog>[]
  title: string
  initialDisplayPosts?: CoreContent<Blog>[]
  pagination?: PaginationProps
  categoryData?: Record<string, number>
}

type SortOrder = 'asc' | 'desc'

function getCurrentCategory(pathname: string) {
  const match = pathname.match(/\/blog\/category\/([^/]+)/)
  if (!match?.[1]) return ''

  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

function isBlogAllPostsPath(pathname: string) {
  return /^\/blog(?:\/page\/\d+)?\/?$/.test(pathname)
}

function getPostSourcePath(post: CoreContent<Blog>) {
  return post.filePath || post.path || post.slug || ''
}

function resolveSortOrder(sort: string | null): SortOrder {
  return sort === 'asc' ? 'asc' : 'desc'
}

function sortPostsByDate(posts: CoreContent<Blog>[], sortOrder: SortOrder) {
  return [...posts].sort((a, b) => {
    const aTime = new Date(a.date).getTime()
    const bTime = new Date(b.date).getTime()
    return sortOrder === 'asc' ? aTime - bTime : bTime - aTime
  })
}

export default function ListLayoutWithCategories({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
  categoryData = {},
}: ListLayoutProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { dictionary, dateLocale, locale } = getNavLanguage()
  const categoryRailRef = useRef<HTMLDivElement | null>(null)
  const currentCategory = getCurrentCategory(pathname)
  const allPostsActive = isBlogAllPostsPath(pathname)
  const sortOrder = resolveSortOrder(searchParams.get('sort'))
  const sortedPosts = useMemo(() => sortPostsByDate(posts, sortOrder), [posts, sortOrder])
  const pageSize = useMemo(() => {
    if (!pagination || pagination.totalPages <= 1) return sortedPosts.length
    return Math.max(1, Math.ceil(sortedPosts.length / pagination.totalPages))
  }, [pagination, sortedPosts.length])
  const displayPosts = useMemo(() => {
    if (pagination && initialDisplayPosts.length > 0) {
      const start = (pagination.currentPage - 1) * pageSize
      return sortedPosts.slice(start, start + pageSize)
    }
    return sortedPosts
  }, [initialDisplayPosts.length, pageSize, pagination, sortedPosts])
  const toggleSortLabel =
    sortOrder === 'desc' ? dictionary.common.sortEarliest : dictionary.common.sortLatest
  const toggleSortHref = useMemo(() => {
    const nextQuery = new URLSearchParams(searchParams.toString())
    if (sortOrder === 'desc') {
      nextQuery.set('sort', 'asc')
    } else {
      nextQuery.delete('sort')
    }

    const queryString = nextQuery.toString()
    return queryString ? `${pathname}?${queryString}` : pathname
  }, [pathname, searchParams, sortOrder])

  const categoryCounts = useMemo(() => {
    const generatedCounts = categoryData
    if (Object.keys(generatedCounts).length > 0) {
      return Object.entries(generatedCounts).sort((a, b) => b[1] - a[1])
    }

    const fallbackCounts: Record<string, number> = {}
    posts.forEach((post) => {
      const categories = resolvePostCategories(post.categories, getPostSourcePath(post))
      categories.forEach((category) => {
        fallbackCounts[category] = (fallbackCounts[category] || 0) + 1
      })
    })
    return Object.entries(fallbackCounts).sort((a, b) => b[1] - a[1])
  }, [categoryData, posts])

  useEffect(() => {
    const rail = categoryRailRef.current
    if (!rail) return

    const onWheel = (event: WheelEvent) => {
      if (!window.matchMedia('(pointer: fine)').matches) return
      if (rail.scrollWidth <= rail.clientWidth) return

      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
      if (delta === 0) return

      rail.scrollLeft += delta
      event.preventDefault()
    }

    rail.addEventListener('wheel', onWheel, { passive: false })
    return () => rail.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <section className="mx-auto max-w-5xl px-4 pt-0 pb-4 sm:pt-2 sm:px-6 lg:px-8">
      <div className="space-y-10">
        <PageHeader
          title={title}
          meta={
            locale === 'zh'
              ? `已搭载 ${posts.length} 篇文档记录，源自 ${categoryCounts.length} 个分类扇区。`
              : `${posts.length} documents across ${categoryCounts.length} sectors.`
          }
          action={
            <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={toggleSortHref}
                  className={cn(
                    "group inline-flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-[11px] font-bold tracking-tight uppercase",
                    "border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400",
                    "bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                  aria-label={toggleSortLabel}
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
                  <span className="leading-none">{toggleSortLabel}</span>
                </Link>
            </div>
          }
        />

        <div className="space-y-6">
          <div
            ref={categoryRailRef}
            className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto overscroll-contain px-1 pb-1"
          >
            {allPostsActive ? (
              <span className="bg-primary/15 text-primary-700 dark:bg-primary/25 dark:text-primary-200 inline-flex shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold">
                {dictionary.common.allPosts}
              </span>
            ) : (
              <Link
                href="/blog"
                className="hover:bg-background/80 inline-flex shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                {dictionary.common.allPosts}
              </Link>
            )}

            {categoryCounts.map(([categorySlug, count]) => {
              const isActive = currentCategory === categorySlug
              const label = getLocalizedCategoryLabel(categorySlug)
              const text = `${label} (${count})`

              return isActive ? (
                <span
                  key={categorySlug}
                  className="bg-primary/15 text-primary-700 dark:bg-primary/25 dark:text-primary-200 inline-flex shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold"
                >
                  {text}
                </span>
              ) : (
                <Link
                  key={categorySlug}
                  href={`/blog/category/${categorySlug}`}
                  className="hover:bg-background/80 inline-flex shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                  aria-label={`View posts in ${label} category`}
                >
                  {text}
                </Link>
              )
            })}
          </div>

          <div className="min-w-0">
            <ul className="divide-border/60 divide-y">
              {!displayPosts.length && (
                <li className="py-8 text-center text-gray-500 dark:text-gray-400">
                  {dictionary.common.noPostsFound}
                </li>
              )}

              {displayPosts.map((post) => {
                const { path, date, title, summary, tags } = post
                const primaryCategory = resolvePostCategories(
                  post.categories,
                  getPostSourcePath(post)
                )[0]
                const categoryLabel = getLocalizedCategoryLabel(primaryCategory)

                return (
                  <li key={path} className="py-0.5 first:pt-0 last:pb-0 sm:py-2">
                    <PostListItem
                      href={`/${path}`}
                      dateLabel={dictionary.common.publishedOn}
                      dateTime={date}
                      dateText={formatDate(date, dateLocale)}
                      title={title}
                      summary={summary}
                      categorySlug={primaryCategory}
                      categoryLabel={categoryLabel}
                      tags={tags || []}
                    />
                  </li>
                )
              })}
            </ul>

            {pagination && pagination.totalPages > 1 && (
              <PostPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
