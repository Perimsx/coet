'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown } from 'lucide-react'
import Link from '@/shared/components/Link'
import PageHeader from '@/shared/components/PageHeader'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import { getNavLanguage } from '@/features/site/lib/nav-language'
import { cn } from '@/shared/utils/utils'

export default function ArchiveClient({ posts: initialPosts }: { posts: CoreContent<Blog>[] }) {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const { dictionary } = getNavLanguage()

  const sortedPosts = useMemo(() => {
    return [...initialPosts].sort((a, b) => {
      const aTime = new Date(a.date).getTime()
      const bTime = new Date(b.date).getTime()
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime
    })
  }, [initialPosts, sortOrder])

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

  const toggleSortLabel = sortOrder === 'desc' ? '最新优先' : '最早优先'

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:px-0">
      <PageHeader
        className="!mb-4 !pb-0 sm:!mb-6 sm:!pb-0"
        title={dictionary.archive.title}
        meta={`档案馆的深寒存储室中已固化了 ${initialPosts.length} 篇记忆碎片。`}
        action={
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className={cn(
              "group inline-flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-[11px] font-bold tracking-tight uppercase",
              "border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400",
              "bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
            aria-label={toggleSortLabel}
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
            <span className="leading-none">{toggleSortLabel}</span>
          </button>
        }
      />

      <div className="pt-0 pb-12 sm:pt-0 sm:pb-16 space-y-6 sm:space-y-12">
        {postsByYear.map(([year, posts]) => (
          <div key={year} className="space-y-3 sm:space-y-6">
            <h2 className="flex items-baseline gap-2 sm:gap-3">
              <span className="text-xl sm:text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">
                {year}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                {posts.length} 篇
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
                      {new Date(post.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
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
