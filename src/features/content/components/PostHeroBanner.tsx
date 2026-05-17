import { ReactNode } from 'react'
import Image from '@/features/content/components/Image'
import PageTitle from '@/shared/components/PageTitle'
import { getCategoryLabel } from '@/features/content/lib/post-categories'

const postDateTemplate: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}
const dateLocale = 'zh-CN'

interface PostHeroBannerProps {
  title: string
  date: string
  category?: string | null
  tags?: string[]
  displayImage: string
}

export default function PostHeroBanner({
  title,
  date,
  category,
  tags,
  displayImage,
}: PostHeroBannerProps) {
  return (
    <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px] -mt-14 mb-8 flex items-center justify-center overflow-hidden">
      {/* 背景图片层 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src={displayImage}
          alt={title}
          fill
          priority
          className="object-cover transition-transform duration-1000 scale-105"
        />
        {/* 微弱的基础降噪压暗 */}
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
        
        {/* 顶部防侵入：防止图片干扰透明导航栏的文字，使用主题色微弱渐隐 */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 via-background/20 to-transparent" />
        
        {/* 底部无缝天幕融合：平滑过渡至正文主题色，提供极佳的文字可读性衬底 */}
        <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-background via-background/90 to-transparent" />
      </div>

      {/* 内容信息层 */}
      <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6 pt-16 flex flex-col items-center text-center space-y-6">
        <PageTitle className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] leading-tight font-black tracking-tight text-foreground drop-shadow-sm">
          {title}
        </PageTitle>

        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-[13px] font-semibold text-muted-foreground/80 tracking-wide">
          {category && (
            <span className="text-primary transition-colors hover:text-foreground">
              {getCategoryLabel(category)}
            </span>
          )}
          {category && <span className="text-border mx-1">&middot;</span>}
          <time dateTime={date} className="transition-colors hover:text-foreground">
            {new Date(date).toLocaleDateString(dateLocale, postDateTemplate)}
          </time>
          
          {tags && tags.length > 0 && (
            <>
              <span className="text-border mx-1">&middot;</span>
              <div className="flex gap-2">
                {tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="transition-colors hover:text-foreground">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
