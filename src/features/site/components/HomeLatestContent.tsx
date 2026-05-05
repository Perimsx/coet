'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Blog } from 'contentlayer/generated'
import type { HomePresentation } from '@/blog.config'
import type { CoreContent } from 'pliny/utils/contentlayer'
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
  labels,
}: HomeLatestContentProps) {
  const dateLocale = 'zh-CN'
  const postsPerPage = 6
  const [currentPage, setCurrentPage] = useState(1)
  const [isAtTop, setIsAtTop] = useState(true)
  const [isAtBottom, setIsAtBottom] = useState(false)
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

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element
      setIsAtTop(scrollTop < 10)
      setIsAtBottom(scrollTop + clientHeight > scrollHeight - 10)
    }

    element.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // 初始化状态
    return () => element.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div id="latest-posts" className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-5">
        <div className="w-full">
          <section className="h-full">
            <div className="flex items-center justify-between pb-5">
              <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground/40 leading-8">
                {labels.latestPostsTitle}
              </h3>
              <Link
                href="/blog"
                className={cn(
                  "inline-flex h-9 items-center px-5 rounded-full transition-all text-[11px] font-bold tracking-tight uppercase shadow-sm backdrop-blur-md",
                  "border border-border/40 text-muted-foreground hover:text-primary",
                  "bg-background/60 hover:bg-primary/5"
                )}
              >
                {labels.allPostsLabel}
              </Link>
            </div>
            
            <div
              ref={scrollRef}
              className="custom-scrollbar overflow-x-hidden lg:max-h-[54rem] lg:overflow-y-auto lg:pr-2 -mx-5 px-5"
              style={{
                maskImage: `linear-gradient(to bottom, 
                  ${isAtTop ? 'black' : 'transparent'} 0%, 
                  black ${isAtTop ? '0px' : '2rem'}, 
                  black calc(100% - ${isAtBottom ? '0px' : '2rem'}), 
                  ${isAtBottom ? 'black' : 'transparent'} 100%)`,
                WebkitMaskImage: `linear-gradient(to bottom, 
                  ${isAtTop ? 'black' : 'transparent'} 0%, 
                  black ${isAtTop ? '0px' : '2rem'}, 
                  black calc(100% - ${isAtBottom ? '0px' : '2rem'}), 
                  ${isAtBottom ? 'black' : 'transparent'} 100%)`
              }}
            >
              <div className="flex flex-col pb-2">
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
                      const postSourcePath = post.filePath || post.path || post.slug || ''
                      const primaryCategory = resolvePostCategories(post.categories, postSourcePath)[0]
                      const categoryLabel = getLocalizedCategoryLabel(primaryCategory)

                      return (
                        <li key={postSlug} className="py-2 first:pt-0 last:pb-0">
                          <PostListItem
                            href={`/blog/${postSlug}`}
                            dateTime={date}
                            dateText={formatDate(date, dateLocale)}
                            title={title}
                            summary={summary}
                            categorySlug={primaryCategory}
                            categoryLabel={categoryLabel}
                            tags={tags || []}
                            images={post.images}
                            compact
                          />
                        </li>
                      )
                    })}
                  </motion.ul>
                </AnimatePresence>

                <div className="mt-1 px-2 pb-6 transition-all">
                  <PostPagination 
                    totalPages={totalPages} 
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
