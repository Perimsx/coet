'use client'

import { useMemo, useRef } from 'react'
import Link from '@/shared/components/Link'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import { useNavLanguage } from '@/features/site/lib/nav-language'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

export default function ArchiveClient({ posts: initialPosts }: { posts: CoreContent<Blog>[] }) {
  const { locale, dictionary } = useNavLanguage()
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredPosts = useMemo(() => {
    return initialPosts.filter(post => {
      const postLang = post.slug?.startsWith('en/') ? 'en' : 'zh'
      return postLang === locale
    })
  }, [initialPosts, locale])

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }, [filteredPosts])

  const postsByYear = useMemo(() => {
    const grouped = new Map<string, CoreContent<Blog>[]>()
    sortedPosts.forEach((post) => {
      const year = new Date(post.date).getFullYear().toString()
      if (!grouped.has(year)) grouped.set(year, [])
      grouped.get(year)!.push(post)
    })

    const years = Array.from(grouped.keys()).sort((a, b) => parseInt(b) - parseInt(a))

    return years.map(year => [year, grouped.get(year)!] as [string, CoreContent<Blog>[]])
  }, [sortedPosts])

  const totalPosts = filteredPosts.length

  useGSAP(() => {
    if (!containerRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const yearBlocks = containerRef.current.querySelectorAll('[data-archive-year]')
    yearBlocks.forEach((block) => {
      const badge = block.querySelector('[data-year-badge]')
      const items = block.querySelectorAll('li')

      if (badge) {
        gsap.from(badge, {
          scale: 0.8,
          opacity: 0,
          duration: 0.5,
          ease: 'back.out(1.4)',
          scrollTrigger: { trigger: badge, start: 'top 88%', toggleActions: 'play none none none' },
        })
      }

      if (items.length) {
        gsap.from(items, {
          x: -20,
          opacity: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out',
          scrollTrigger: { trigger: block, start: 'top 82%', toggleActions: 'play none none none' },
        })
      }
    })
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="mx-auto max-w-3xl px-4 pt-8 pb-6 sm:pt-12 sm:pb-10 sm:px-6 lg:px-8">

      {/* 顶部统计 */}
      <div className="mb-12 sm:mb-16 text-center">
        <p className="text-sm font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
          {dictionary.archive.totalPosts.replace('{count}', String(totalPosts))}
        </p>
      </div>

      {/* 时间轴 */}
      <div className="relative">
        {/* 中心竖线 */}
        <div className="absolute left-[31px] sm:left-[39px] top-0 bottom-0 w-px bg-gradient-to-b from-zinc-200 via-zinc-200 to-transparent dark:from-zinc-800 dark:via-zinc-800 dark:to-transparent" />

        <div className="space-y-12 sm:space-y-16">
          {postsByYear.map(([year, posts]) => (
            <div key={year} data-archive-year className="relative">
              {/* 年份徽章 */}
              <div data-year-badge className="relative flex items-center gap-4 mb-6 sm:mb-8">
                <span className="relative z-10 flex h-[15px] w-[15px] sm:h-[19px] sm:w-[19px] shrink-0 items-center justify-center rounded-full border-[3px] border-primary/60 bg-background shadow-[0_0_0_4px_hsl(var(--primary)/0.08)]">
                  <span className="h-[5px] w-[5px] sm:h-[6px] sm:w-[6px] rounded-full bg-primary" />
                </span>
                <span className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground">
                  {year}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold tabular-nums text-muted-foreground">
                  {dictionary.archive.postCount.replace('{count}', String(posts.length))}
                </span>
              </div>

              {/* 文章列表 */}
              <ul className="space-y-1">
                {posts.map((post) => {
                  const dateStr = new Date(post.date).toLocaleDateString(
                    locale === 'en' ? 'en-US' : 'zh-CN',
                    { month: '2-digit', day: '2-digit' }
                  )
                  return (
                    <li key={post.slug} className="group relative">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="relative flex items-center gap-4 sm:gap-5 rounded-xl py-2.5 sm:py-3 pl-[22px] sm:pl-[26px] pr-3 transition-all hover:bg-muted/50"
                      >
                        {/* 节点 */}
                        <span className="absolute left-[27px] sm:left-[35px] top-1/2 -translate-y-1/2 z-10 h-[7px] w-[7px] sm:h-[9px] sm:w-[9px] shrink-0 rounded-full border-2 border-zinc-300 bg-background transition-all group-hover:scale-125 group-hover:border-primary group-hover:bg-primary/20 dark:border-zinc-600" />

                        {/* 日期 */}
                        <time className="shrink-0 w-[42px] sm:w-[50px] font-mono text-[11px] sm:text-[12px] tabular-nums text-zinc-400 transition-colors group-hover:text-primary dark:text-zinc-500 ml-5 sm:ml-6">
                          {dateStr}
                        </time>

                        {/* 分隔点 */}
                        <span className="hidden sm:block h-[3px] w-[3px] shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700 transition-colors group-hover:bg-primary/40" />

                        {/* 标题 */}
                        <span className="text-[13.5px] sm:text-[15px] text-zinc-700 dark:text-zinc-300 transition-colors group-hover:text-foreground font-medium leading-snug">
                          {post.title}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
