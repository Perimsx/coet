'use client'

import { useState, useMemo, useRef } from 'react'
import { ArrowUpDown } from 'lucide-react'
import Link from '@/shared/components/Link'
import PageHeader from '@/shared/components/PageHeader'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import { useNavLanguage } from '@/features/site/lib/nav-language'
import { cn } from '@/shared/utils/utils'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

export default function ArchiveClient({ posts: initialPosts }: { posts: CoreContent<Blog>[] }) {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
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
      const aTime = new Date(a.date).getTime()
      const bTime = new Date(b.date).getTime()
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime
    })
  }, [filteredPosts, sortOrder])

  const postsByYear = useMemo(() => {
    const grouped = new Map<string, CoreContent<Blog>[]>()
    sortedPosts.forEach((post) => {
      const year = new Date(post.date).getFullYear().toString()
      if (!grouped.has(year)) grouped.set(year, [])
      grouped.get(year)!.push(post)
    })
    
    // 保持年份顺序与帖子排序一致
    const years = Array.from(grouped.keys()).sort((a, b) => {
      return sortOrder === 'desc' ? parseInt(b) - parseInt(a) : parseInt(a) - parseInt(b)
    })
    
    return years.map(year => [year, grouped.get(year)!] as [string, CoreContent<Blog>[]])
  }, [sortedPosts, sortOrder])

  const toggleSortLabel = sortOrder === 'desc' ? dictionary.common.sortLatest : dictionary.common.sortEarliest

  useGSAP(() => {
    if (!containerRef.current) return

    const yearBlocks = containerRef.current.querySelectorAll('[data-archive-year]')
    yearBlocks.forEach((block) => {
      const heading = block.querySelector('h2')
      const items = block.querySelectorAll('li')

      if (heading) {
        gsap.from(heading, {
          x: -30,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: heading, start: 'top 85%', toggleActions: 'play none none none' },
        })
      }

      if (items.length) {
        gsap.from(items, {
          y: 16,
          opacity: 0,
          duration: 0.4,
          stagger: 0.06,
          ease: 'power2.out',
          scrollTrigger: { trigger: block, start: 'top 80%', toggleActions: 'play none none none' },
        })
      }
    })
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="mx-auto max-w-5xl px-4 pt-4 pb-12 sm:pt-6 sm:pb-16 sm:px-6 lg:px-8">
      <PageHeader
        title={dictionary.archive.title}
        meta={dictionary.archive.totalPosts.replace('{count}', filteredPosts.length.toString())}
        action={
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className={cn(
              "group inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all text-[11px] font-bold tracking-tight uppercase shadow-sm backdrop-blur-md",
              "border border-border/40 text-muted-foreground hover:text-primary",
              "bg-background/60 hover:bg-primary/5"
            )}
            aria-label={toggleSortLabel}
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            <span className="leading-none">{toggleSortLabel}</span>
          </button>
        }
      />

      <div className="space-y-4 sm:space-y-8">
        {postsByYear.map(([year, posts]) => (
          <div key={year} data-archive-year className="space-y-3 sm:space-y-6">
            <h2 className="flex items-baseline gap-2 sm:gap-3">
              <span className="text-xl sm:text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">
                {year}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                {dictionary.archive.postCount.replace('{count}', posts.length.toString())}
              </span>
            </h2>

            <ul className="space-y-2.5 sm:space-y-4">
              {posts.map((post) => (
                <li key={post.slug} className="group relative flex flex-col justify-between sm:flex-row sm:items-center">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex flex-1 items-center gap-3 sm:gap-4 py-1 transition-all"
                  >
                    <time className="shrink-0 font-mono text-[13px] sm:text-sm tabular-nums text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                      {new Date(post.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', { month: '2-digit', day: '2-digit' })}
                    </time>
                    <span className="text-[14.5px] sm:text-base text-zinc-600 dark:text-zinc-400 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-100 font-medium">
                      {post.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
