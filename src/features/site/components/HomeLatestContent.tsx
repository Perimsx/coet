'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Blog } from 'contentlayer/generated'
import type { HomePresentation } from '@/config/site-presentation'
import type { CoreContent } from 'pliny/utils/contentlayer'
import { slug } from 'github-slugger'
import { formatDate } from 'pliny/utils/formatDate'
import { cn } from '@/shared/utils/utils'
import Link from '@/shared/components/Link'
import PostListItem from '@/features/content/components/PostListItem'
import PostPagination from '@/features/content/components/PostPagination'
import { resolvePostCategories } from '@/features/content/lib/post-categories'
import { getLocalizedCategoryLabel } from '@/features/content/lib/localized-category-label'

interface HomeLatestContentProps {
  posts: CoreContent<Blog>[]
  tagData?: Record<string, number>
  categoryData?: Record<string, number>
  labels: HomePresentation
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

export default function HomeLatestContent({
  posts,
  tagData = {},
  categoryData = {},
  labels,
}: HomeLatestContentProps) {
  const dateLocale = 'zh-CN'
  const postsPerPage = 5
  const [currentPage, setCurrentPage] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.max(1, Math.ceil(posts.length / postsPerPage))
  const startIndex = (currentPage - 1) * postsPerPage
  const currentPosts = posts.slice(startIndex, startIndex + postsPerPage)

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages)
    if (nextPage === currentPage) return
    setCurrentPage(nextPage)
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const sortedTags = Object.entries(tagData)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 20)

  const sortedCategories = Object.entries(categoryData).sort(
    (left, right) => right[1] - left[1]
  )

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    let timeoutId: number | undefined
    const handleScroll = () => {
      element.classList.add('is-scrolling')
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
      timeoutId = window.setTimeout(() => {
        element.classList.remove('is-scrolling')
      }, 700)
    }

    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      element.removeEventListener('scroll', handleScroll)
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  return (
    <div id="latest-posts" className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <section className="h-full">
            <div className="flex items-center justify-between pb-5">
              <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground/40 leading-8">
                {labels.latestPostsTitle}
              </h3>
              <Link
                href="/blog"
                className={cn(
                  "inline-flex h-8 items-center px-4 rounded-md transition-all text-[10px] font-bold tracking-tight uppercase",
                  "border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400",
                  "bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                {labels.allPostsLabel}
              </Link>
            </div>
            {/* 视觉阻断与平滑过渡：柔化顶部滚动切断边缘 */}
            <div className="pointer-events-none relative z-20 h-10 w-full -mb-10 bg-gradient-to-b from-background to-transparent" />
            
            <div
              ref={scrollRef}
              className="custom-scrollbar overflow-x-hidden lg:max-h-[54rem] lg:overflow-y-auto lg:pr-2 -mx-5 px-5"
            >
              <div className="flex flex-col pb-2">

                <div>
                  <AnimatePresence mode="wait">
                    <motion.ul
                      key={currentPage}
                      variants={listContainerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="space-y-2"
                    >
                      {currentPosts.map((post) => {
                        const { slug: postSlug, date, title, summary, tags } = post
                        const postSourcePath =
                          post.filePath || post.path || post.slug || ''
                        const primaryCategory = resolvePostCategories(
                          post.categories,
                          postSourcePath
                        )[0]
                        const categoryLabel = getLocalizedCategoryLabel(
                          primaryCategory
                        )

                        return (
                          <li key={postSlug} className="py-2 first:pt-0 last:pb-0">
                            <PostListItem
                              href={`/blog/${postSlug}`}
                              dateLabel={labels.postDateLabel}
                              dateTime={date}
                              dateText={formatDate(date, dateLocale)}
                              title={title}
                              summary={summary}
                              categorySlug={primaryCategory}
                              categoryLabel={categoryLabel}
                              tags={tags || []}
                              compact
                            />
                          </li>
                        )
                      })}
                    </motion.ul>
                  </AnimatePresence>
                </div>

                <div className="mt-6 px-2 pb-6 transition-all">
                  <PostPagination 
                    totalPages={totalPages} 
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                </div>

                <div className="mt-8 block sm:hidden">
                  <Link
                    href="/blog"
                    className="flex w-full items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 py-3 text-xs font-bold text-primary transition-all hover:bg-primary/10"
                  >
                    {labels.browseMorePostsLabel}
                  </Link>
                </div>
              </div>
            </div>
            {/* 视觉阻断与平滑过渡：柔化底部滚动边缘 */}
            <div className="pointer-events-none relative z-20 h-10 w-full -mt-10 bg-gradient-to-t from-background to-transparent" />
          </section>
        </div>

        <div className="h-fit space-y-10 lg:sticky lg:top-4 lg:col-span-1">
          <section>
            <div className="flex h-full flex-col p-0">
              <div className="flex items-center justify-between pb-5">
                <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground/40 leading-8">
                  {labels.categoriesTitle}
                </h3>
                <Link
                  href="/blog"
                  className={cn(
                    "inline-flex h-8 items-center px-3 rounded-md transition-all text-[10px] font-bold tracking-tight uppercase",
                    "border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400",
                    "bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  {labels.allCategoriesLabel}
                </Link>
              </div>
              <div className="mt-5 -mx-3 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 lg:flex lg:flex-col lg:gap-1.5">
                {sortedCategories.slice(0, 8).map(([categorySlug, count]) => (
                  <Link
                    key={categorySlug}
                    href={`/blog/category/${categorySlug}`}
                    className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition-all hover:translate-x-1 hover:bg-primary/5"
                  >
                    <span className="text-[13px] font-semibold text-foreground/70 transition-colors group-hover:text-primary">
                      {getLocalizedCategoryLabel(categorySlug)}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground/30 transition-colors group-hover:text-primary/60">
                      {count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="flex h-full flex-col p-0">
              <div className="mb-5 flex items-center justify-between border-b border-border/30 pb-4">
                <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground/40">
                  {labels.popularTagsTitle}
                </h3>
                <Link
                  href="/tags"
                  className={cn(
                    "inline-flex h-7 items-center px-3 rounded-md transition-all text-[10px] font-bold tracking-tight uppercase",
                    "border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400",
                    "bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  {labels.allTagsLabel}
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {sortedTags.map(([tag, count]) => (
                  <Link
                    key={tag}
                    href={`/tags/${slug(tag)}`}
                    className="group flex items-center rounded-full bg-muted/40 px-3 py-1 transition-all hover:scale-105 hover:bg-primary/15 dark:bg-muted/20 dark:hover:bg-primary/25"
                  >
                    <span className="text-[12px] font-bold text-foreground/40 transition-colors group-hover:text-primary">
                      # {tag}
                    </span>
                    <span className="ml-1.5 text-[9px] font-black text-muted-foreground/30 transition-colors group-hover:text-primary/60">
                      {count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
