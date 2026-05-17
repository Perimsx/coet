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
    <div className="relative w-full h-[55vh] min-h-[400px] max-h-[600px] mb-8 flex items-center justify-center overflow-hidden">
      {/* 纯净的背景图片，没有任何全局污染遮罩 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src={displayImage}
          alt={title}
          fill
          priority
          className="object-cover transition-transform duration-1000 scale-[1.02]"
        />
        
        {/* 底部无缝天幕融合：缩短过渡，拒绝侵蚀画面核心主体 */}
        <div className="absolute inset-x-0 bottom-0 h-[25%] bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* 内容信息层 */}
      <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6 pt-16 flex flex-col items-center text-center space-y-6">
        {/* 强制白字并赋予深邃光晕级阴影，这能在不污染背景图的情况下确保极致的可读性，符合高端海报排版 */}
        <PageTitle className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] leading-tight font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          {title}
        </PageTitle>

        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-[13px] font-semibold text-white/95 tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
          {category && (
            <span className="text-white hover:text-white/80 transition-colors">
              {getCategoryLabel(category)}
            </span>
          )}
          {category && <span className="text-white/50 mx-1">&middot;</span>}
          <time dateTime={date} className="hover:text-white/80 transition-colors">
            {new Date(date).toLocaleDateString(dateLocale, postDateTemplate)}
          </time>
          
          {tags && tags.length > 0 && (
            <>
              <span className="text-white/50 mx-1">&middot;</span>
              <div className="flex gap-2">
                {tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="hover:text-white/80 transition-colors">
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
