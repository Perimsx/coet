import { motion } from 'framer-motion'
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
  const shownTags = tags.slice(0, maxTags)
  const hiddenTagCount = Math.max(tags.length - maxTags, 0)

  return (
    <motion.article 
      variants={postItemVariants}
      whileHover={{ 
        y: -4,
        scale: 1.005,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.995 }}
      className={`group relative rounded-2xl px-2 ${compact ? 'py-2' : 'py-5'} bg-transparent dark:hover:bg-primary/[0.05] hover:bg-primary/[0.03] hover:backdrop-blur-xs hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] sm:px-6 sm:py-4 cursor-pointer`}
    >
      {/* 左侧悬浮装饰线 - 精致化调优 */}
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        whileHover={{ height: '40%', opacity: 1 }}
        className="absolute left-0 top-1/2 w-[2px] -translate-y-1/2 rounded-full bg-primary/60" 
      />

      <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 transition-colors group-hover:text-primary/40 sm:mb-3 sm:text-xs">
        <span>{dateLabel}</span>
        <span className="opacity-30">/</span>
        <time dateTime={dateTime}>{dateText}</time>
      </div>

      <h2 className={`${compact ? 'text-[16.5px] leading-relaxed sm:text-xl sm:leading-tight' : 'text-[17.5px] leading-6 sm:text-[1.65rem] sm:leading-9'} font-extrabold tracking-tight transition-colors duration-300`} style={{ textWrap: 'balance' }}>
        <Link
          href={href}
          className="text-foreground transition-all group-hover:opacity-70"
        >
          {title}
        </Link>
      </h2>

      {!!summary && (
        <p className={`${compact ? 'mt-1 text-[11.5px] leading-relaxed sm:mt-2 sm:text-[13.5px] sm:leading-6' : 'mt-2 text-[12.5px] leading-5 sm:mt-3 sm:text-[15px] sm:leading-7'} line-clamp-2 text-muted-foreground/80 transition-colors group-hover:text-foreground/70`}>
          {summary}
        </p>
      )}

      <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${compact ? 'mt-2 sm:mt-5' : 'mt-3 sm:mt-5'}`}>
        <Link
          href={`/blog/category/${categorySlug}`}
          className="inline-flex h-6 items-center rounded-full bg-primary/8 px-2.5 text-[10px] font-bold text-primary transition-all hover:bg-primary/15 sm:h-8 sm:px-4 sm:text-xs"
          aria-label={`Category: ${categoryLabel}`}
        >
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
