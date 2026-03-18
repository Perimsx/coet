'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import { Blog } from 'contentlayer/generated'
import Link from '@/shared/components/Link'
import PostListItem from '@/features/content/components/PostListItem'
import { formatDate } from 'pliny/utils/formatDate'
import { resolvePostCategories } from '@/features/content/lib/post-categories'
import { getLocalizedCategoryLabel } from '@/features/content/lib/localized-category-label'
import { slug } from 'github-slugger'
interface HomeLatestContentProps {
  posts: CoreContent<Blog>[]
  tagData?: Record<string, number>
  categoryData?: Record<string, number>
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

export default function HomeLatestContent({ posts, tagData = {}, categoryData = {} }: HomeLatestContentProps) {
  const dateLocale = 'zh-CN'
  const POSTS_PER_PAGE = 5
  const [currentPage, setCurrentPage] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE
  const currentPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // 每次页码改变时，强制重新动画
  useEffect(() => {
    // 可以在这里处理翻页逻辑
  }, [currentPage])

  const sortedTags = Object.entries(tagData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  const sortedCategories = Object.entries(categoryData)
    .sort((a, b) => b[1] - a[1])

  // 页面滚动衔接逻辑
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const delta = e.deltaY
      
      // 边界检测增加 1px 的容差以提升高分屏下的灵敏度
      const isAtTop = scrollTop <= 1
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 2

      if ((isAtTop && delta < 0) || (isAtBottom && delta > 0)) {
        if (window.innerWidth >= 1024) { 
          // 极致加速倍增器 (2.5x)，注入更强的“弹射感”
          // 同时对极小滚动进行补偿，确保平滑衔接
          const boost = delta * 2.5
          window.scrollBy({
            top: boost,
            behavior: 'auto' 
          })
          
          if (e.cancelable) e.preventDefault()
        }
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <div id="latest-posts" className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
      <div 
        ref={scrollRef}
        className="no-scrollbar lg:max-h-[54rem] lg:overflow-y-auto"
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
          {/* 左侧：最新文章列表 (2/3 宽度) */}
          <div className="lg:col-span-2">
            <section className="h-full">
              <div className="flex h-full flex-col px-0 py-0 sm:px-0 sm:py-0">
                <div className="lg:sticky top-0 z-10 flex items-center justify-between bg-background pb-4 -mx-2 px-2 pt-4 transition-all shadow-sm shadow-primary/2">
                  <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground/40">
                    最新发布
                  </h3>
                  <Link
                    href="/blog"
                    className="bg-primary/8 text-primary hover:bg-primary/12 inline-flex h-8 items-center rounded-full px-4 text-[11px] font-bold transition-all"
                  >
                    全部文章
                  </Link>
                </div>

                <div className="flex-1">
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
                              dateLabel="发布于"
                              dateTime={date}
                              dateText={formatDate(date, dateLocale)}
                              title={title}
                              summary={summary}
                              categorySlug={primaryCategory}
                              categoryLabel={categoryLabel}
                              tags={tags || []}
                              compact={true}
                            />
                          </li>
                        )
                      })}
                    </motion.ul>
                  </AnimatePresence>
                </div>
                
                {/* 这里是分页器 */}
                <div className="lg:sticky bottom-0 z-10 flex items-center justify-between bg-background pb-6 pt-5 -mx-2 px-2 transition-all shadow-sm shadow-primary/2">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/30">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="bg-primary/8 text-primary hover:bg-primary/12 disabled:opacity-20 disabled:cursor-not-allowed inline-flex h-9 items-center rounded-full px-4 text-[11px] font-bold transition-all"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="bg-primary/8 text-primary hover:bg-primary/12 disabled:opacity-20 disabled:cursor-not-allowed inline-flex h-9 items-center rounded-full px-4 text-[11px] font-bold transition-all"
                    >
                      下一页
                    </button>
                  </div>
                </div>

                <div className="mt-8 block sm:hidden">
                  <Link
                    href="/blog"
                    className="flex w-full items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 py-3 text-xs font-bold text-primary transition-all hover:bg-primary/10"
                  >
                    浏览更多文章
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* 右侧：侧边栏 (1/3 宽度) */}
          <div className="space-y-10 lg:col-span-1 lg:sticky lg:top-8 h-fit">
            {/* 文章分类卡片 */}
            <section>
              <div className="flex h-full flex-col p-0">
                <div className="flex items-center justify-between mb-5 border-b border-border/30 pb-4">
                  <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground/40">全部分类</h3>
                  <Link
                    href="/blog"
                    className="bg-primary/8 text-primary hover:bg-primary/12 inline-flex h-7 items-center rounded-full px-3 text-[11px] font-bold transition-all"
                  >
                    全部分类
                  </Link>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 lg:flex lg:flex-col lg:gap-1.5">
                  {sortedCategories.slice(0, 8).map(([catSlug, count]) => (
                    <Link
                      key={catSlug}
                      href={`/blog/category/${catSlug}`}
                      className="hover:bg-primary/5 group flex items-center justify-between rounded-xl px-3 py-2.5 transition-all hover:translate-x-1"
                    >
                      <span className="text-[13px] font-semibold text-foreground/70 group-hover:text-primary transition-colors">{getLocalizedCategoryLabel(catSlug)}</span>
                      <span className="text-[10px] font-bold text-muted-foreground/30 transition-colors group-hover:text-primary/60">
                        {count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            {/* 热门标签卡片 */}
            <section>
              <div className="flex h-full flex-col p-0">
                <div className="flex items-center justify-between mb-5 border-b border-border/30 pb-4">
                  <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground/40">热门标签</h3>
                  <Link
                    href="/tags"
                    className="bg-primary/8 text-primary hover:bg-primary/12 inline-flex h-7 items-center rounded-full px-3 text-[11px] font-bold transition-all"
                  >
                    全部标签
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sortedTags.map(([tag, count]) => (
                    <Link
                      key={tag}
                      href={`/tags/${slug(tag)}`}
                      className="group bg-muted/40 hover:bg-primary/15 dark:bg-muted/20 dark:hover:bg-primary/25 flex items-center rounded-full px-3 py-1 transition-all hover:scale-105"
                    >
                      <span className="text-[12px] font-bold text-foreground/40 transition-colors group-hover:text-primary"># {tag}</span>
                      <span className="ml-1.5 text-[9px] font-black text-muted-foreground/30 transition-colors group-hover:text-primary/60">{count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
