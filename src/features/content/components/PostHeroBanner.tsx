import Image from '@/features/content/components/Image'
import PageTitle from '@/shared/components/PageTitle'
import { getCategoryLabel } from '@/features/content/lib/post-categories'

const postDateTemplate: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

interface PostHeroBannerProps {
  title: string
  date: string
  category?: string | null
  tags?: string[]
  displayImage: string
  locale?: 'zh' | 'en'
}

export default function PostHeroBanner({
  title,
  date,
  category,
  tags,
  displayImage,
  locale = 'zh',
}: PostHeroBannerProps) {
  const dateLocale = locale === 'en' ? 'en-US' : 'zh-CN'

  return (
    <div className="relative w-full h-auto min-h-[300px] py-14 md:py-0 md:h-[45vh] md:min-h-[400px] max-h-[550px] mb-6 sm:mb-10 flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/10 dark:border-zinc-800/10 shadow-2xl">
      {/* 背景图片层 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src={displayImage}
          alt={title}
          fill
          priority
          className="object-cover transition-transform duration-[1200ms] scale-[1.03]"
        />
        
        {/* 高级暗色覆层遮罩：柔和压暗背景并施加极轻微毛玻璃模糊，确保白字拥有完美的文字对比度 */}
        <div className="absolute inset-0 bg-zinc-950/40 dark:bg-black/55 backdrop-blur-[1.5px] transition-colors duration-300" />
        
        {/* 底部无缝天幕融合 */}
        <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>
 
      {/* 内容信息层 */}
      <div className="relative z-10 w-full max-w-4xl px-6 sm:px-8 pt-8 flex flex-col items-center text-center space-y-6 sm:space-y-7">
        <PageTitle className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] leading-snug sm:leading-tight font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] px-2">
          {title}
        </PageTitle>
 
        {/* 元数据胶囊组：摒弃传统点分割，改用同高的磨砂圆角卡片，大幅提升精致感 */}
        <div className="flex flex-wrap justify-center items-center gap-2.5 text-[11px] sm:text-[12.5px] font-semibold tracking-wide">
          {/* 1. 分类：主色调玻璃微粒 */}
          {category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-white backdrop-blur-md border border-primary-500/30 shadow-md transition-all hover:bg-primary/30 hover:scale-105 active:scale-95 duration-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              {getCategoryLabel(category)}
            </span>
          )}
          
          {/* 2. 时间：带有微型日历图标的半透明胶囊 */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 backdrop-blur-md border border-white/10 shadow-sm transition-all hover:bg-white/15 hover:scale-105 active:scale-95 duration-200">
            <svg className="w-3.5 h-3.5 opacity-80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <time dateTime={date}>
              {new Date(date).toLocaleDateString(dateLocale, postDateTemplate)}
            </time>
          </span>
          
          {/* 3. 标签：同组微型圆角标签包围 */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag} 
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-white/85 backdrop-blur-md border border-white/5 transition-all hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 duration-200"
                >
                  <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="9" x2="20" y2="9"></line>
                    <line x1="4" y1="15" x2="20" y2="15"></line>
                    <line x1="10" y1="3" x2="8" y2="21"></line>
                    <line x1="16" y1="3" x2="14" y2="21"></line>
                  </svg>
                  <span>{tag.replace(/^#/, '')}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

