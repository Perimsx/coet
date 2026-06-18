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
import { resolvePostCategories } from '@/features/content/lib/post-categories'
import { getLocalizedCategoryLabel } from '@/features/content/lib/localized-category-label'
import { ArrowUpDown } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { getPostSourcePath, resolveSortOrder, sortPostsByDate } from '@/features/content/lib/post-utils'
import { useHorizontalWheelScroll } from '@/shared/hooks/use-horizontal-wheel-scroll'

interface ListLayoutProps {
  posts: CoreContent<Blog>[]
  title: string
}

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

function getCategoryCountsForLocale(posts: CoreContent<Blog>[], locale: string) {
  const counts: Record<string, number> = {}
  posts.forEach((post) => {
    const postLang = post.slug?.startsWith('en/') ? 'en' : 'zh'
    if (postLang !== locale) return
    const categories = resolvePostCategories(post.categories, getPostSourcePath(post))
    categories.forEach((category) => {
      counts[category] = (counts[category] || 0) + 1
    })
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

function ListLayoutWithCategoriesInner({
  posts,
  title,
}: ListLayoutProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { dictionary, dateLocale, locale } = useNavLanguage()
  const categoryRailRef = useRef<HTMLDivElement | null>(null)
  useHorizontalWheelScroll(categoryRailRef)
  
  const localizedTitle = useMemo(() => {
    if (title === '全部文章') {
      return locale === 'en' ? 'All Posts' : '全部文章'
    }
    return getLocalizedCategoryLabel(title)
  }, [title, locale])

  const currentCategory = getCurrentCategory(pathname)
  const allPostsActive = isBlogAllPostsPath(pathname)
  const sortOrder = resolveSortOrder(searchParams.get('sort'))

  // 1. 根据 locale 过滤文章
  const filteredPostsByLang = useMemo(() => {
    return posts.filter(post => {
      const postLang = post.slug?.startsWith('en/') ? 'en' : 'zh'
      return postLang === locale
    })
  }, [posts, locale])

  // 2. 根据当前语言重新计算分类文章数
  const categoryCounts = useMemo(() => {
    return getCategoryCountsForLocale(posts, locale)
  }, [posts, locale])

  // 3. 根据当前语言和分类过滤文章并排序
  const finalFilteredPosts = useMemo(() => {
    let result = filteredPostsByLang
    if (currentCategory) {
      result = filteredPostsByLang.filter((post) => {
        const categories = resolvePostCategories(post.categories, getPostSourcePath(post))
        return categories.includes(currentCategory)
      })
    }
    return sortPostsByDate(result, sortOrder)
  }, [filteredPostsByLang, currentCategory, sortOrder])

  // 4. 客户端分页管理
  const [currentPage, setCurrentPage] = useState(1)
  
  useEffect(() => {
    setCurrentPage(1)
  }, [locale, sortOrder, currentCategory])

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

  return (
    <section className="mx-auto max-w-5xl px-4 pt-4 pb-6 sm:pt-6 sm:pb-8 sm:px-6 lg:px-8">
      <div className="space-y-6 sm:space-y-8">
        <PageHeader
          title={localizedTitle}
          meta={
            locale === 'zh'
              ? `共 ${finalFilteredPosts.length} 篇 · ${categoryCounts.length} 个分类`
              : `${finalFilteredPosts.length} posts · ${categoryCounts.length} categories`
          }
          action={
            <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={toggleSortHref}
                  className={cn(
                    "group inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[11px] font-bold tracking-tight uppercase shadow-sm backdrop-blur-md",
                    "border border-border/40 text-muted-foreground hover:text-primary",
                    "bg-background/60 hover:bg-primary/5"
                  )}
                  aria-label={toggleSortLabel}
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  <span className="leading-none">{toggleSortLabel}</span>
                </Link>
            </div>
          }
        />

        <div className="space-y-6">
          <div
            ref={categoryRailRef}
            className="no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 flex gap-1.5 overflow-x-auto overscroll-contain pb-1"
          >
            {allPostsActive ? (
              <span className="bg-primary/15 text-primary-700 dark:bg-primary/25 dark:text-primary-200 inline-flex shrink-0 rounded-xl px-2.5 py-1 text-xs font-semibold">
                {dictionary.common.allPosts}
              </span>
            ) : (
              <Link
                href="/blog"
                className="hover:bg-background/80 inline-flex shrink-0 rounded-xl px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
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
                  className="bg-primary/15 text-primary-700 dark:bg-primary/25 dark:text-primary-200 inline-flex shrink-0 rounded-xl px-2.5 py-1 text-xs font-semibold"
                >
                  {text}
                </span>
              ) : (
                <Link
                  key={categorySlug}
                  href={`/blog/category/${categorySlug}`}
                  className="hover:bg-background/80 inline-flex shrink-0 rounded-xl px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
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
                      dateTime={date}
                      dateText={formatDate(date, dateLocale)}
                      title={title}
                      summary={summary}
                      categorySlug={primaryCategory}
                      categoryLabel={categoryLabel}
                      tags={tags || []}
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

export default function ListLayoutWithCategories(props: ListLayoutProps) {
  return (
    <Suspense>
      <ListLayoutWithCategoriesInner {...props} />
    </Suspense>
  )
}
