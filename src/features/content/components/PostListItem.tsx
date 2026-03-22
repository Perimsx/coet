'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { KeyboardEvent, MouseEvent } from 'react'
import { slug } from 'github-slugger'
import Link from '@/shared/components/Link'

interface PostListItemProps {
  href: string
  dateLabel: string
  dateTime: string
  dateText: string
  title: string
  summary?: string
  categorySlug: string
  categoryLabel: string
  tags?: string[]
  maxTags?: number
  compact?: boolean
}

export const postItemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
    transition: { 
      type: 'spring' as const,
      stiffness: 260,
      damping: 25
    }
  }
}

export default function PostListItem({
  href,
  dateLabel,
  dateTime,
  dateText,
  title,
  summary,
  categorySlug,
  categoryLabel,
  tags = [],
  maxTags = 4,
  compact = false,
}: PostListItemProps) {
  const router = useRouter()
  const shownTags = tags.slice(0, maxTags)
  const hiddenTagCount = Math.max(tags.length - maxTags, 0)

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('a')) return
    router.push(href)
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    router.push(href)
  }

  return (
    <motion.article 
      variants={postItemVariants}
      whileHover={{ 
        y: -4,
        scale: 1.005,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.995 }}
      role="link"
      tabIndex={0}
      aria-label={`打开文章：${title}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={`group relative ${compact ? 'py-2' : 'py-5'} sm:py-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
    >
      {/* 外扩悬浮背景层 - 幽灵按钮效果，不影响内容对齐 */}
      <div className="absolute -inset-x-4 inset-y-0 -z-10 rounded-2xl bg-transparent transition-all duration-300 group-hover:bg-primary/[0.03] group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:group-hover:bg-primary/[0.05]" />

      {/* 左侧悬浮装饰线 */}
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        whileHover={{ height: '40%', opacity: 1 }}
        className="absolute -left-4 top-1/2 w-[2px] -translate-y-1/2 rounded-full bg-primary/60" 
      />

      <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 transition-colors group-hover:text-primary/40 sm:mb-3 sm:text-xs">
        <span>{dateLabel}</span>
        <span className="opacity-30">/</span>
        <time dateTime={dateTime}>{dateText}</time>
      </div>

      <h2 className={`${compact ? 'text-[15px] leading-relaxed sm:text-lg sm:leading-tight' : 'text-base leading-snug sm:text-[1.5rem] sm:leading-normal'} font-extrabold tracking-tight transition-colors duration-300`} style={{ textWrap: 'balance' }}>
        <Link
          href={href}
          className="text-foreground transition-all group-hover:opacity-70"
        >
          {title}
        </Link>
      </h2>

      {!!summary && (
        <p className={`${compact ? 'mt-1 text-[11px] leading-relaxed sm:mt-2 sm:text-[13px] sm:leading-6' : 'mt-2 text-xs leading-relaxed sm:mt-3 sm:text-[14px] sm:leading-7'} line-clamp-2 text-muted-foreground/80 transition-colors group-hover:text-foreground/70`}>
          {summary}
        </p>
      )}

      <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${compact ? 'mt-2 sm:mt-5' : 'mt-3 sm:mt-5'}`}>
        <Link
          href={`/blog/category/${categorySlug}`}
          className="group/cat inline-flex items-center gap-1.5 rounded-[4px] border border-border/40 bg-zinc-50/50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 sm:px-2.5 sm:py-[3px] sm:text-[11px]"
          aria-label={`Category: ${categoryLabel}`}
        >
          <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-400 transition-colors group-hover/cat:bg-zinc-600 dark:bg-zinc-600 dark:group-hover/cat:bg-zinc-400" />
          {categoryLabel}
        </Link>

        {!!shownTags.length && (
          <div className="inline-flex flex-wrap items-center gap-1.5">
            {shownTags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${slug(tag)}`}
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground/40 transition-all hover:bg-muted hover:text-foreground sm:text-xs"
                aria-label={`Tag: ${tag}`}
              >
                #{tag}
              </Link>
            ))}
            {hiddenTagCount > 0 && (
              <span className="text-[10px] font-bold text-muted-foreground/20 sm:text-xs">
                +{hiddenTagCount}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.article>
  )
}
