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
          className="object-cover transition-transform duration-1000 scale-[1.02]"
        />
        
        {/* 顶级保护：废除暴力的全图变黑遮罩，改用极度克制的中心光晕，确保文字在任何明暗图片上均具极致可读性 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-background/70 via-background/10 to-transparent opacity-90" />
        
        {/* 顶部防侵入：极浅的顶端渐隐，专为透明的未滚动 Navbar 护航，高度压缩以释放原图空间 */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/60 to-transparent" />
        
        {/* 底部无缝天幕融合：平滑过渡至正文主题色，大幅缩减高度，避免原图下半段“发霉/起雾” */}
        <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-background via-background/60 to-transparent" />
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
