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
    <div ref={containerRef} className="mx-auto max-w-3xl px-4 pt-6 pb-6 sm:pt-10 sm:pb-10 sm:px-6 lg:px-8">
      {/* 顶部统计 */}
      <div className="mb-10 sm:mb-12 text-center">
        <p className="text-caption-10 font-semibold tracking-widest uppercase text-neutral-6">
          {dictionary.archive.totalPosts.replace('{count}', String(totalPosts))}
        </p>
      </div>

      {/* 时间轴 */}
      <div className="relative">
        {/* 中心竖线 */}
        <div className="absolute left-[31px] sm:left-[39px] top-0 bottom-0 w-px bg-border" />

        <div className="space-y-10 sm:space-y-14">
          {postsByYear.map(([year, posts]) => (
            <div key={year} data-archive-year className="relative">
              {/* 年份徽章 (Yohaku 衬线年份) */}
              <div data-year-badge className="relative flex items-center gap-3.5 mb-5 sm:mb-6">
                <span className="relative z-10 flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-paper">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                <span className="font-serif text-title-24 sm:text-title-28 font-medium text-neutral-10">
                  {year}
                </span>
                <span className="rounded-full bg-neutral-2 border border-border px-2.5 py-0.5 text-caption-10 font-medium tabular-nums text-neutral-7">
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
                        className="relative flex items-center gap-3.5 sm:gap-4 rounded-lg py-2 pl-[22px] sm:pl-[26px] pr-3 transition-colors hover:bg-neutral-2/60"
                      >
                        {/* 节点 */}
                        <span className="absolute left-[28px] sm:left-[36px] top-1/2 -translate-y-1/2 z-10 h-2 w-2 shrink-0 rounded-full border border-border bg-paper transition-all group-hover:scale-125 group-hover:border-accent group-hover:bg-accent" />

                        {/* 日期 */}
                        <time className="shrink-0 w-[42px] sm:w-[50px] text-label-12 font-mono tabular-nums text-neutral-6 transition-colors group-hover:text-accent ml-5 sm:ml-6">
                          {dateStr}
                        </time>

                        {/* 分隔点 */}
                        <span className="hidden sm:block h-1 w-1 shrink-0 rounded-full bg-neutral-4 transition-colors group-hover:bg-accent" />

                        {/* 标题 */}
                        <span className="font-serif text-copy-14 sm:text-copy-15 text-neutral-9 transition-colors group-hover:text-accent font-medium leading-snug">
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
