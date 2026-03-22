'use client'

import { useEffect, useMemo, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { slug } from 'github-slugger'
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

interface PaginationProps {
  totalPages: number
  currentPage: number
}

interface ListLayoutProps {
  posts: CoreContent<Blog>[]
  title: string
  initialDisplayPosts?: CoreContent<Blog>[]
  pagination?: PaginationProps
  tagLabelMap?: Record<string, string>
  tagData?: Record<string, number>
}

type SortOrder = 'asc' | 'desc'

function isBlogListPath(pathname: string) {
  return /^\/blog(?:\/page\/\d+)?\/?$/.test(pathname)
}

function getCurrentTagSlug(pathname: string) {
  const match = pathname.match(/\/tags\/([^/]+)/)
  if (!match?.[1]) return ''

  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
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

export default function ListLayoutWithTags({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
  tagLabelMap = {},
  tagData = {},
}: ListLayoutProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { dictionary, dateLocale, locale } = getNavLanguage()
  const tagCounts = tagData
  const sortedTags = [...Object.keys(tagCounts)].sort((a, b) => tagCounts[b] - tagCounts[a])
  const currentTagSlug = getCurrentTagSlug(pathname)
  const orderedTags = [...sortedTags].sort((a, b) => {
    const aActive = slug(a) === currentTagSlug
    const bActive = slug(b) === currentTagSlug
    if (aActive && !bActive) return -1
    if (!aActive && bActive) return 1
    return 0
  })
  const blogListActive = isBlogListPath(pathname)
  const tagRailRef = useRef<HTMLDivElement | null>(null)
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
  const currentTagCount = currentTagSlug ? (tagCounts[currentTagSlug] ?? displayPosts.length) : 0

  useEffect(() => {
    const rail = tagRailRef.current
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
    <section className="-mx-4 pt-1 pb-4 sm:-mx-6 lg:-mx-8">
      <div className="border-border/40 bg-linear-to-b from-[#f8f9fb] to-[#fbfcfe] transition-all duration-500 dark:from-card/40 dark:to-card/20 border-y px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-5xl">
          <PageHeader
            title={title}
            meta={
              !!currentTagSlug && (
                <>{locale === 'zh' ? `共 ${currentTagCount} 篇` : `${currentTagCount} posts`}</>
              )
            }
            action={
              <div className="flex shrink-0 items-center justify-start gap-2">
                <Link
                  href={toggleSortHref}
                  className="bg-muted/60 hover:bg-muted dark:bg-muted/35 dark:hover:bg-muted/55 inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold text-gray-700 transition-colors hover:text-gray-900 sm:h-9 sm:px-4 sm:text-sm dark:text-gray-200 dark:hover:text-gray-100"
                  aria-label={toggleSortLabel}
                >
                  {toggleSortLabel}
                </Link>
                {!blogListActive && (
                  <Link
                    href="/blog"
                    className="bg-muted/60 hover:bg-muted dark:bg-muted/35 dark:hover:bg-muted/55 inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold text-gray-700 transition-colors hover:text-gray-900 sm:h-9 sm:px-4 sm:text-sm dark:text-gray-200 dark:hover:text-gray-100"
                  >
                    {dictionary.common.allPosts}
                  </Link>
                )}
              </div>
            }
          />

        <div className="space-y-6">
          <div
            ref={tagRailRef}
            className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto overscroll-contain px-1 pb-1"
          >
            {blogListActive ? (
              <span className="bg-muted inline-flex shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100">
                {dictionary.common.allPosts}
              </span>
            ) : (
              <Link
                href="/blog"
                className="hover:bg-muted/60 inline-flex shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
              >
                {dictionary.common.allPosts}
              </Link>
            )}

            {orderedTags.map((t) => {
              const tagSlug = slug(t)
              const isActive = currentTagSlug === tagSlug
              const tagLabel = tagLabelMap[t] || t

              return isActive ? (
                <span
                  key={t}
                  className="bg-muted inline-flex shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100"
                >
                  {`${tagLabel} (${tagCounts[t]})`}
                </span>
              ) : (
                <Link
                  key={t}
                  href={`/tags/${tagSlug}`}
                  className="hover:bg-muted/60 inline-flex shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                  aria-label={`${dictionary.tagsPage.viewTaggedPosts} ${tagLabel}`}
                >
                  {`${tagLabel} (${tagCounts[t]})`}
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
                const filteredTags =
                  currentTagSlug && tags?.length
                    ? tags.filter((tag) => slug(tag) !== currentTagSlug)
                    : tags || []

                return (
                  <li key={path} className="py-4 first:pt-0 last:pb-0 sm:py-5">
                    <PostListItem
                      href={`/${path}`}
                      dateLabel={dictionary.common.publishedOn}
                      dateTime={date}
                      dateText={formatDate(date, dateLocale)}
                      title={title}
                      summary={summary}
                      categorySlug={primaryCategory}
                      categoryLabel={categoryLabel}
                      tags={filteredTags}
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
      </div>
    </section>
  )
}
