'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from '@/features/content/components/Image'
import type { KeyboardEvent, MouseEvent } from 'react'
import { slug } from 'github-slugger'
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
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.995 }}
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group relative flex flex-col sm:flex-row items-stretch overflow-hidden rounded-[32px] cursor-pointer",
        "bg-transparent border border-border/10 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]",
        "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:shadow-2xl hover:border-border/30 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/40"
      )}
    >
      {/* 左侧文字信息区：拥有独立且宽裕的内边距 */}
      <div className="flex flex-1 flex-col justify-center z-10 w-full min-w-0 p-6 sm:p-10 lg:p-12">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-semibold text-muted-foreground/70 tracking-wide">
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
            compact ? "text-xl leading-snug line-clamp-2" : "text-2xl sm:text-[30px] leading-tight line-clamp-3"
          )}>
            {title}
          </h2>

          {summary && (
            <p className={cn(
                "mt-5 text-[15px] leading-relaxed text-muted-foreground/80 transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-foreground/90",
                compact ? "line-clamp-2" : "line-clamp-2 sm:line-clamp-3"
            )}>
              {summary}
            </p>
          )}
        </div>

        {!!shownTags.length && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {shownTags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${slug(tag)}`}
                className="text-[13px] font-bold text-muted-foreground/50 transition-colors hover:text-primary"
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 右侧：贴边全沉浸壁纸区（Bleed Layout） */}
      {images && (
        <div className="relative hidden w-2/5 lg:w-[45%] shrink-0 overflow-hidden sm:block">
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={Array.isArray(images) ? images[0] : images}
              alt={title}
              fill
              sizes="(max-width: 1024px) 40vw, 45vw"
              className="object-cover transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
              loading="lazy"
            />
            {/* 顶级质感细节：边缘消散遮罩，使图片左侧完美融于背景底色 */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background dark:from-zinc-900/20 to-transparent pointer-events-none" />
            
            {/* 极弱的全局护眼压暗，悬浮时彻底释放亮度 */}
            <div className="absolute inset-0 bg-black/5 dark:bg-black/20 pointer-events-none transition-opacity duration-700 group-hover:opacity-0" />
          </div>
        </div>
      )}
    </motion.article>
  )
}
