'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { KeyboardEvent, MouseEvent } from 'react'
import { slug } from 'github-slugger'
import Link from '@/shared/components/Link'
import { cn } from '@/shared/utils/utils'
import { Calendar, Tag as TagIcon } from 'lucide-react'

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
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.995 }}
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group relative flex flex-col sm:flex-row items-stretch gap-6 overflow-hidden rounded-2xl border border-transparent p-5 transition-all duration-500 cursor-pointer",
        "hover:bg-background/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:hover:bg-gray-900/40 dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]",
        compact ? "sm:h-[180px]" : "sm:h-[210px]"
      )}
    >
      {/* 氛围背景层 */}
      {images && (
        <div className="absolute inset-0 -z-20 opacity-0 transition-opacity duration-700 group-hover:opacity-20 dark:group-hover:opacity-30">
          <div 
            className="h-full w-full bg-cover bg-center bg-no-repeat blur-[60px] scale-125"
            style={{ backgroundImage: `url(${Array.isArray(images) ? images[0] : images})` }}
          />
        </div>
      )}

      {/* 左侧：正文内容区 */}
      <div className="flex flex-1 flex-col justify-center z-10">
        <div>
          {/* 元数据行 */}
          <div className="mb-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400">
              <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#5A9CF8] text-white shadow-sm">
                <Calendar className="h-3 w-3" />
              </span>
              <time dateTime={dateTime}>{dateText}</time>
            </div>

            <Link
              href={`/blog/category/${categorySlug}`}
              className="flex items-center gap-2 text-[11px] font-bold text-gray-500 transition-colors hover:text-primary dark:text-gray-400"
            >
              <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#A543E6] text-white shadow-sm">
                <TagIcon className="h-3 w-3" />
              </span>
              {categoryLabel}
            </Link>
          </div>

          <h2 className={cn(
            "font-extrabold tracking-tight transition-colors duration-300 group-hover:text-primary line-clamp-2",
            compact ? "text-lg leading-snug" : "text-xl sm:text-2xl leading-tight"
          )}>
            {title}
          </h2>

          {summary && (
            <p className={cn(
                "mt-3 text-sm leading-6 text-muted-foreground/80 transition-colors group-hover:text-foreground/70",
                compact ? "line-clamp-2" : "line-clamp-2 sm:line-clamp-3"
            )}>
              {summary}
            </p>
          )}
        </div>

        {/* 标签区 */}
        {!!shownTags.length && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {shownTags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${slug(tag)}`}
                className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-bold text-muted-foreground transition-all hover:bg-primary hover:text-white"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 右侧：大型封面缩略图 */}
      {images && (
        <div className="relative hidden h-full w-64 shrink-0 overflow-hidden rounded-xl border border-border/40 sm:block lg:w-72">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full bg-cover bg-center transition-transform"
            style={{ backgroundImage: `url(${Array.isArray(images) ? images[0] : images})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
      )}
    </motion.article>
  )
}
