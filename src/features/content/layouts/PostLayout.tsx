import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Authors, Blog } from 'contentlayer/generated'
import Comments from '@/features/comments/components/Comments'
import FloatingToc from '@/features/content/components/FloatingToc'
import { cn } from '@/shared/utils/utils'
import { Calendar, Hash, Tag as TagIcon } from 'lucide-react'
import Link from '@/shared/components/Link'
import PageTitle from '@/shared/components/PageTitle'
import SectionContainer from '@/features/site/components/SectionContainer'
import { siteMetadata } from '@/blog.config'
import { getServerDictionary } from '@/shared/utils/i18n-server'
import ReadingProgressBar from '@/features/site/components/ReadingProgressBar'
import { TocProvider } from '@/features/content/components/TocContext'
import { PostLayoutContent } from '@/features/content/components/PostLayoutContent'
import { ArticleEnhancer } from '@/features/content/components/ArticleEnhancer'
import { getCategoryLabel } from '@/features/content/lib/post-categories'

const postDateTemplate: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}


interface LayoutProps {
  content: CoreContent<Blog>
  authorDetails: CoreContent<Authors>[]
  toc?: { value: string; url: string; depth: number }[]
  next?: { path: string; title: string; date?: string }
  prev?: { path: string; title: string; date?: string }
  children: ReactNode
}


export default async function PostLayout({
  content,
  toc,
  next,
  prev,
  children,
}: LayoutProps) {
  const { slug, date, title, tags, images, categories } = content
  const category = categories && categories.length > 0 ? categories[0] : null
  const dictionary = await getServerDictionary()
  const dateLocale = 'zh-CN'
  
  const displayImage = images && Array.isArray(images) && images.length > 0 ? images[0] : null

  return (
    <SectionContainer>
      <TocProvider>
        <ReadingProgressBar />

        {/* 仿 ThriveX：沉浸式 Hero Banner 必须在独立的全宽容器中 */}
        <header className={cn(
          "relative w-full overflow-hidden transition-all duration-700",
          displayImage 
            ? "hero-banner-mask h-[320px] sm:h-[400px] md:h-[500px] sm:-mt-24" 
            : "mx-auto max-w-5xl pt-4 pb-4 sm:pt-6 sm:pb-6 xl:pb-8 px-4"
        )}>
          {displayImage && (
            <div className="absolute inset-0 z-0 pointer-events-none [mask-image:linear-gradient(to_bottom,black_0%,black_40%,transparent_90%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_40%,transparent_90%)]">
              {/* 1. 背景图片层 */}
              <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
                style={{ backgroundImage: `url(${displayImage})` }}
              />
              {/* 2. 遮罩层：注意这里我们让 to-transparent 提前结束，并且为 blur 单独加了一个更短的 mask 以防止模糊硬边 */}
              <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/20 to-transparent pb-10 backdrop-blur-[2px] [mask-image:linear-gradient(to_bottom,black_0%,transparent_80%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,transparent_80%)]" />
            </div>
          )}

          <div className={cn(
            displayImage 
              ? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[85%] sm:w-[75%] lg:w-[65%] text-white custom-text-shadow z-20"
              : "relative z-20 space-y-6",
            "text-center"
          )}>
            <div className="space-y-6">
              <PageTitle 
                className={displayImage ? "text-white !text-shadow-none sm:text-4xl lg:text-5xl" : ""}
              >
                {title}
              </PageTitle>

              <div className={cn(
                "flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-xs sm:text-sm font-medium",
                displayImage ? "text-white/95" : "text-gray-500 dark:text-gray-400"
              )}>
                <div className="flex items-center gap-2 group/meta">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#A543E6] text-white shadow-lg transition-transform group-hover/meta:scale-110">
                    <TagIcon className="h-4 w-4" />
                  </span>
                  <span className={displayImage ? "drop-shadow-sm" : ""}>
                    {getCategoryLabel(category || '')}
                  </span>
                </div>

                <div className="flex items-center gap-2 group/meta">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#5A9CF8] text-white shadow-lg transition-transform group-hover/meta:scale-110">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <time dateTime={date} className={displayImage ? "drop-shadow-sm" : ""}>
                    {new Date(date).toLocaleDateString(dateLocale, postDateTemplate)}
                  </time>
                </div>

                {tags && tags.length > 0 && (
                  <div className="flex items-center gap-2 group/meta">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EA3B24] text-white shadow-lg transition-transform group-hover/meta:scale-110">
                      <Hash className="h-4 w-4" />
                    </span>
                    <div className="flex gap-1.5">
                      {tags.slice(0, 2).map((tag) => (
                        <span key={tag} className={displayImage ? "drop-shadow-sm" : ""}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 底部融合渐变层：高度增加并加强实色遮盖，确保物理覆盖背景网格线 */}
          {displayImage && (
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/90 to-transparent z-30 pointer-events-none" />
          )}
        </header>

        <PostLayoutContent>
          <FloatingToc toc={toc} hasHeroImage={!!displayImage} />
          <div className="relative">
            <div className="mx-auto max-w-4xl w-full break-words pt-4 pb-4 sm:pt-6 sm:pb-6">
              <article id="article" className="article-detail">
                {children}
              </article>
              <ArticleEnhancer />
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <div className="py-3 sm:py-4">
              <p className="no-scrollbar flex items-center gap-1.5 overflow-x-auto text-[11px] font-medium text-gray-400 sm:gap-2 sm:text-base dark:text-gray-500">
                <span className="text-lg leading-none">©</span>
                <span className="whitespace-nowrap">
                  {dictionary.post.licensePrefix}{' '}
                  <Link
                    href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh"
                    rel="license noopener noreferrer"
                    className="font-semibold text-gray-400 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-gray-600 dark:text-gray-500 dark:decoration-gray-600 dark:hover:text-gray-300"
                  >
                    {dictionary.post.licenseName}
                  </Link>{' '}
                  {dictionary.post.licenseSuffix}
                </span>
              </p>
            </div>

            {(next || prev) && (
              <nav className="flex flex-col gap-4 border-t border-zinc-100 py-6 dark:border-zinc-800 sm:flex-row sm:gap-6">
                {/* Previous Post */}
                <div className="flex-1">
                  {prev?.path ? (
                    <Link
                      href={`/${prev.path}`}
                      className={cn(
                        "group flex h-full flex-col justify-center rounded-md border p-5 transition-all outline-none",
                        "border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/40",
                        "hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800"
                      )}
                    >
                      <span className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                        {dictionary.post.previousArticle}
                      </span>
                      <span className="line-clamp-1 text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-50">
                        {prev.title}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex h-full flex-col justify-center rounded-md border border-dashed border-zinc-100 p-5 opacity-20 dark:border-zinc-800" />
                  )}
                </div>

                {/* Next Post */}
                <div className="flex-1">
                  {next?.path ? (
                    <Link
                      href={`/${next.path}`}
                      className={cn(
                        "group flex h-full flex-col justify-center items-end text-right rounded-md border p-5 transition-all outline-none",
                        "border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/40",
                        "hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800"
                      )}
                    >
                      <span className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                        {dictionary.post.nextArticle}
                      </span>
                      <span className="line-clamp-1 text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-50">
                        {next.title}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex h-full flex-col justify-center rounded-md border border-dashed border-zinc-100 p-5 opacity-20 dark:border-zinc-800" />
                  )}
                </div>
              </nav>
            )}

            {siteMetadata.comments && (
              <div className="py-6 text-center text-gray-700 dark:text-gray-300" id="comment">
                <Comments slug={slug || ''} />
              </div>
            )}
          </div>
        </div>
        </PostLayoutContent>
      </TocProvider>
    </SectionContainer>
  )
}
