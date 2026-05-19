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
    <div className="relative w-full h-auto min-h-[280px] py-12 md:py-0 md:h-[45vh] md:min-h-[380px] max-h-[550px] mb-4 sm:mb-8 flex items-center justify-center overflow-hidden">
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
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
 
      {/* 内容信息层 */}
      <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6 pt-6 sm:pt-12 flex flex-col items-center text-center space-y-4 sm:space-y-5">
        {/* 强制白字并赋予深邃光晕级阴影，这能在不污染背景图的情况下确保极致的可读性，符合高端海报排版 */}
        <PageTitle className="text-xl sm:text-3xl md:text-4xl lg:text-[48px] leading-snug sm:leading-tight font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] px-2">
          {title}
        </PageTitle>
 
        <div className="flex flex-wrap justify-center items-center gap-x-2 sm:gap-x-3 gap-y-1.5 text-[11.5px] sm:text-[13px] font-semibold text-white/95 tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {category && (
            <span className="text-white hover:text-white/80 transition-colors">
              {getCategoryLabel(category)}
            </span>
          )}
          {category && <span className="text-white/50 mx-0.5">&middot;</span>}
          <time dateTime={date} className="hover:text-white/80 transition-colors">
            {new Date(date).toLocaleDateString(dateLocale, postDateTemplate)}
          </time>
          
          {tags && tags.length > 0 && (
            <>
              <span className="text-white/50 mx-0.5">&middot;</span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="hover:text-white/80 transition-colors whitespace-nowrap">
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
