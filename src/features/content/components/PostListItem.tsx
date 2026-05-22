'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from '@/features/content/components/Image'
import type { KeyboardEvent, MouseEvent } from 'react'
import { normalizeTagToSlug, getTagLabel } from '@/features/content/lib/post-categories'
import Link from '@/shared/components/Link'
import { cn } from '@/shared/utils/utils'

interface PostListItemProps {
  href: string
  dateTime: string
  dateText: string
  title: string
  summary?: string
  categorySlug: string
  categoryLabel: string
  tags?: string[]
  images?: string[] | string
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
  dateTime,
  dateText,
  title,
  summary,
  categorySlug,
  categoryLabel,
  tags = [],
  images,
  maxTags = 4,
  compact = false,
}: PostListItemProps) {
  const router = useRouter()
  const shownTags = tags.slice(0, maxTags)

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
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.998 }}
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group relative flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-10 overflow-hidden rounded-3xl border border-transparent p-4 sm:p-6 cursor-pointer",
        "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:bg-muted/40 dark:hover:bg-white/5"
      )}
    >
      {/* 左侧：正文内容区 */}
      <div className="flex flex-1 flex-col justify-center z-10 w-full min-w-0">
        <div>
          {/* 纯文本极简元数据 */}
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-semibold text-muted-foreground/80 tracking-wide">
            <Link
              href={`/blog/category/${categorySlug}`}
              className="text-primary transition-colors hover:text-foreground"
            >
              {categoryLabel}
            </Link>
            <span className="text-border">&middot;</span>
            <time dateTime={dateTime} className="transition-colors group-hover:text-foreground/80">
              {dateText}
            </time>
          </div>

          <h2 className={cn(
            "font-extrabold tracking-tight transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] text-foreground group-hover:text-primary",
            compact ? "text-base leading-snug line-clamp-2" : "text-lg sm:text-2xl leading-snug sm:leading-tight line-clamp-3"
          )}>
            {title}
          </h2>

          {summary && (
            <p className={cn(
                "mt-4 text-[14px] leading-relaxed text-muted-foreground/90 transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-foreground/80",
                compact ? "line-clamp-2" : "line-clamp-2 sm:line-clamp-3"
            )}>
              {summary}
            </p>
          )}
        </div>

        {/* 标签区：极简文本形式 */}
        {!!shownTags.length && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {shownTags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${normalizeTagToSlug(tag)}`}
                className="text-[12.5px] font-medium text-muted-foreground/60 transition-colors hover:text-primary"
              >
                #{getTagLabel(tag)}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 右侧：规范化大尺寸封面缩略图 */}
      {images && (
        <div className="relative hidden w-[240px] lg:w-[300px] shrink-0 overflow-hidden rounded-2xl sm:block bg-muted/10 ring-1 ring-border/10">
          <div className="relative aspect-[16/10] w-full">
            <Image
              src={Array.isArray(images) ? images[0] : images}
              alt={title}
              fill
              sizes="(max-width: 1024px) 240px, 300px"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              loading="lazy"
            />
            {/* 非常微弱的光影遮罩，增强质感，悬浮时消失以提亮 */}
            <div className="absolute inset-0 bg-black/5 pointer-events-none transition-opacity duration-500 group-hover:opacity-0" />
          </div>
        </div>
      )}
    </motion.article>
  )
}
