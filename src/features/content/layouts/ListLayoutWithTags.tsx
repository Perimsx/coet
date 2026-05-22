'use client'

import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { formatDate } from 'pliny/utils/formatDate'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/shared/components/Link'
import PageHeader from '@/shared/components/PageHeader'
import PostListItem from '@/features/content/components/PostListItem'
import PostPagination from '@/features/content/components/PostPagination'
import { useNavLanguage } from '@/features/site/lib/nav-language'
import { ArrowUpDown } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { resolvePostCategories, normalizeTagToSlug } from '@/features/content/lib/post-categories'
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

// 标签翻译映射函数
function getTranslatedTag(t: string, locale: string, tagLabelMap: Record<string, string>) {
  // 项目中已经有标签和分类的本地翻译
  return tagLabelMap[t] || t
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

// 确定当前标签在特定语言下过滤后的文章数
function getTagCountsForLocale(posts: CoreContent<Blog>[], locale: string) {
  const counts: Record<string, number> = {}
  posts.forEach((post) => {
    const postLang = post.slug?.startsWith('en/') ? 'en' : 'zh'
    if (postLang !== locale) return
    post.tags?.forEach((tag) => {
      const formattedTag = normalizeTagToSlug(tag)
      counts[formattedTag] = (counts[formattedTag] || 0) + 1
    })
  })
  return counts
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

function ListLayoutWithTagsInner({
  posts,
  title,
  tagLabelMap = {},
}: ListLayoutProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { dictionary, dateLocale, locale } = useNavLanguage()

  // 1. 根据 locale 过滤文章
  const filteredPostsByLang = useMemo(() => {
    return posts.filter(post => {
      const postLang = post.slug?.startsWith('en/') ? 'en' : 'zh'
      return postLang === locale
    })
  }, [posts, locale])

  // 2. 根据当前语言重新计算标签文章数
  const tagCounts = useMemo(() => {
    return getTagCountsForLocale(posts, locale)
  }, [posts, locale])

  const sortedTags = useMemo(() => {
    return [...Object.keys(tagCounts)].sort((a, b) => tagCounts[b] - tagCounts[a])
  }, [tagCounts])

  const currentTagSlug = getCurrentTagSlug(pathname)
  const orderedTags = useMemo(() => {
    return [...sortedTags].sort((a, b) => {
      const aActive = normalizeTagToSlug(a) === currentTagSlug
      const bActive = normalizeTagToSlug(b) === currentTagSlug
      if (aActive && !bActive) return -1
      if (!aActive && bActive) return 1
      return 0
    })
  }, [sortedTags, currentTagSlug])

  const blogListActive = isBlogListPath(pathname)
  const tagRailRef = useRef<HTMLDivElement | null>(null)
  const sortOrder = resolveSortOrder(searchParams.get('sort'))

  // 3. 根据当前语言和标签过滤文章并排序
  const finalFilteredPosts = useMemo(() => {
    let result = filteredPostsByLang
    if (currentTagSlug) {
      result = filteredPostsByLang.filter((post) => {
        return post.tags?.some((tag) => normalizeTagToSlug(tag) === currentTagSlug)
      })
    }
    return sortPostsByDate(result, sortOrder)
  }, [filteredPostsByLang, currentTagSlug, sortOrder])

  // 4. 客户端分页管理
  const [currentPage, setCurrentPage] = useState(1)
  
  useEffect(() => {
    setCurrentPage(1)
  }, [locale, sortOrder, currentTagSlug])

  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(finalFilteredPosts.length / pageSize))

  const displayPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return finalFilteredPosts.slice(start, start + pageSize)
  }, [finalFilteredPosts, currentPage, pageSize])

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

  const currentTagCount = finalFilteredPosts.length

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
    <section className="mx-auto max-w-5xl px-4 pt-4 pb-12 sm:pt-6 sm:pb-16 sm:px-6 lg:px-8">
      <div className="space-y-6 sm:space-y-8">
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
                  className={cn(
                    "group inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all text-[11px] font-bold tracking-tight uppercase shadow-sm backdrop-blur-md",
                    "border border-border/40 text-muted-foreground hover:text-primary",
                    "bg-background/60 hover:bg-primary/5"
                  )}
                  aria-label={toggleSortLabel}
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  <span className="leading-none">{toggleSortLabel}</span>
                </Link>
                {!blogListActive && (
                  <Link
                    href="/blog"
                    className={cn(
                        "inline-flex h-9 items-center px-5 rounded-full transition-all text-[11px] font-bold tracking-tight uppercase shadow-sm backdrop-blur-md",
                        "border border-border/40 text-muted-foreground hover:text-primary",
                        "bg-background/60 hover:bg-primary/5"
                    )}
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
            className="no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 flex gap-2 overflow-x-auto overscroll-contain pb-1"
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
              const tagSlug = normalizeTagToSlug(t)
              const isActive = currentTagSlug === tagSlug
              const tagLabel = getTranslatedTag(t, locale, tagLabelMap)

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
                    ? tags.filter((tag) => normalizeTagToSlug(tag) !== currentTagSlug)
                    : tags || []

                return (
                  <li key={path} className="py-4 first:pt-0 last:pb-0 sm:py-5">
                    <PostListItem
                      href={`/${path}`}
                      dateTime={date}
                      dateText={formatDate(date, dateLocale)}
                      title={title}
                      summary={summary}
                      categorySlug={primaryCategory}
                      categoryLabel={categoryLabel}
                      tags={filteredTags}
                      images={post.images}
                    />
                  </li>
                )
              })}
            </ul>
            {totalPages > 1 && (
              <PostPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
        </div>
    </section>
  )
}

export default function ListLayoutWithTags(props: ListLayoutProps) {
  return (
    <Suspense>
      <ListLayoutWithTagsInner {...props} />
    </Suspense>
  )
}
