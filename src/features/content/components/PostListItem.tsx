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
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.998 }}
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group relative flex flex-col sm:flex-row items-stretch gap-6 overflow-hidden rounded-2xl border border-transparent p-5 cursor-pointer",
        "transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:bg-zinc-500/5 dark:hover:bg-white/5",
        compact ? "sm:h-[180px]" : "sm:h-[210px]"
      )}
    >
      {/* 移除氛围背景层以保持通透感 */}

      {/* 左侧：正文内容区 */}
      <div className="flex flex-1 flex-col justify-center z-10">
        <div>
          {/* 元数据行 */}
          <div className="mb-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400">
              <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#5A9CF8] text-white shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110">
                <Calendar className="h-3 w-3" />
              </span>
              <time dateTime={dateTime}>{dateText}</time>
            </div>

            <Link
              href={`/blog/category/${categorySlug}`}
              className="flex items-center gap-2 text-[11px] font-bold text-gray-500 transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-primary dark:text-gray-400"
            >
              <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#A543E6] text-white shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110">
                <TagIcon className="h-3 w-3" />
              </span>
              {categoryLabel}
            </Link>
          </div>

          <h2 className={cn(
            "font-extrabold tracking-tight transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-primary line-clamp-2",
            compact ? "text-lg leading-snug" : "text-xl sm:text-2xl leading-tight"
          )}>
            {title}
          </h2>

          {summary && (
            <p className={cn(
                "mt-3 text-sm leading-6 text-muted-foreground/80 transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-foreground/70",
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
                className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-bold text-muted-foreground transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-primary hover:text-white"
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 右侧：大型封面缩略图 */}
      {images && (
        <div className="relative hidden h-full w-64 shrink-0 overflow-hidden rounded-xl border border-border/40 sm:block lg:w-72">
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${Array.isArray(images) ? images[0] : images})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-60" />
        </div>
      )}
    </motion.article>
  )
}
