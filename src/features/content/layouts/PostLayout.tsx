import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Authors, Blog } from 'contentlayer/generated'
import { Coffee, Cone } from 'lucide-react'
import Comments from '@/features/comments/components/Comments'
import FloatingToc from '@/features/content/components/FloatingToc'
import Link from '@/shared/components/Link'
import PageTitle from '@/shared/components/PageTitle'
import SectionContainer from '@/features/site/components/SectionContainer'
import { siteMetadata } from '@/blog.config'
import { getDictionary } from '@/shared/utils/i18n'
import ReadingProgressBar from '@/features/site/components/ReadingProgressBar'
import { TocProvider } from '@/features/content/components/TocContext'
import { PostLayoutContent } from '@/features/content/components/PostLayoutContent'
import { ArticleEnhancer } from '@/features/content/components/ArticleEnhancer'
import { getCategoryLabel } from '@/features/content/lib/post-categories'
import PostHeroBanner from '@/features/content/components/PostHeroBanner'
import TypewriterSummary from '@/features/content/components/TypewriterSummary'

const postDateTemplate: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

function formatPostDate(dateString: string, locale: 'zh' | 'en' = 'zh') {
  const d = new Date(dateString)
  if (locale === 'en') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  const now = new Date()
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }
  return `${d.getFullYear().toString().slice(-2)}年${d.getMonth() + 1}月${d.getDate()}日`
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
  authorDetails,
  toc,
  next,
  prev,
  children,
}: LayoutProps) {
  const { slug, date, title, tags, images, categories } = content
  const category = categories && categories.length > 0 ? categories[0] : null
  const isEn = slug?.startsWith('en/') || content.path?.startsWith('en/') || content.filePath?.includes('.en.')
  const locale = isEn ? 'en' : 'zh'
  const dictionary = getDictionary(locale)
  const dateLocale = locale === 'en' ? 'en-US' : 'zh-CN'
  
  const displayImage = images && Array.isArray(images) && images.length > 0 ? images[0] : null

  return (
    <SectionContainer>
      <TocProvider>
        <ReadingProgressBar />

        {displayImage ? (
          <PostHeroBanner 
            title={title}
            date={date}
            category={category}
            tags={tags as string[]}
            displayImage={displayImage}
            locale={locale}
          />
        ) : (
          <header className="mx-auto max-w-3xl pt-6 pb-4 sm:pt-16 sm:pb-12 px-4 text-center">
            <div className="space-y-6">
              <PageTitle className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                {title}
              </PageTitle>

              <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-[13px] font-medium text-muted-foreground/80">
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
          </header>
        )}

        <PostLayoutContent>
          <FloatingToc toc={toc} hasHeroImage={!!displayImage} />
          
          <div className="relative">
            {/* 打字机摘要区域，位于封面图下方，正文主体上方 */}
            {content.summary && (
              <div className="mx-auto max-w-4xl px-4 sm:px-0 mt-4 sm:mt-6 -mb-2">
                <TypewriterSummary summary={content.summary} />
              </div>
            )}

            <div className="mx-auto max-w-4xl w-full break-words px-4 sm:px-0 pt-2 pb-2 sm:pt-6 sm:pb-4">
              <article id="article" className="article-detail">
                {children}
              </article>
              <ArticleEnhancer />
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="py-4 sm:py-8 px-4 sm:px-0" id="article-footer">
              <div className="group/license relative overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/20 bg-white/40 p-4 sm:p-8 shadow-xl shadow-zinc-200/20 backdrop-blur-md transition-all hover:shadow-2xl hover:shadow-primary/5 dark:border-white/5 dark:bg-zinc-900/40 dark:shadow-none">
                {/* 装饰性背景：艺术化的 CC 标识 */}
                <div className="absolute -bottom-16 -right-16 z-0 select-none opacity-[0.04] transition-transform duration-1000 group-hover/license:scale-110 dark:opacity-[0.08]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 24 24" fill="currentColor" className="text-foreground"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-11c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5c.87 0 1.63-.44 2.09-1.1l1.61.96C12.49 15.11 11.34 16 10 16c-2.21 0-4-1.79-4-4s1.79-4 4-4c1.34 0 2.49.89 2.91 2.13l-1.61.96c-.46-.66-1.22-1.09-2.09-1.09zm5 0c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5c.87 0 1.63-.44 2.09-1.1l1.61.96c-.71 1.25-1.86 2.14-3.21 2.14-2.21 0-4-1.79-4-4s1.79-4 4-4c1.34 0 2.49.89 2.91 2.13l-1.61.96c-.46-.66-1.22-1.09-2.09-1.09z"/></svg>
                </div>
                
                <div className="relative z-10 flex flex-col gap-5 sm:gap-8">
                  {/* 顶部标题与链接 */}
                  <div className="space-y-2">
                    <h4 className="text-base sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 line-clamp-2">
                      {title}
                    </h4>
                    <p className="inline-block rounded-full bg-primary/5 px-3 py-1 text-[10px] sm:text-xs font-bold text-primary transition-colors hover:bg-primary/10 truncate max-w-full">
                      {`${siteMetadata.siteUrl}/blog/${slug}`}
                    </p>
                  </div>

                  {/* 四列元数据 */}
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 sm:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                        {dictionary.post.authors}
                      </span>
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {authorDetails[0]?.name || siteMetadata.author}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                        {dictionary.post.publishedAt}
                      </span>
                      <time className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {new Date(date).toLocaleDateString(dateLocale)}
                      </time>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                        {dictionary.post.updatedAt}
                      </span>
                      <time className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {new Date(content.lastmod || date).toLocaleDateString(dateLocale)}
                      </time>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                        许可协议
                      </span>
                      <Link
                        href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh"
                        rel="license noopener noreferrer"
                        className="text-sm font-bold text-primary underline underline-offset-4 decoration-primary/30 transition-all hover:decoration-primary"
                      >
                        {dictionary.post.licenseName}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex flex-col sm:flex-row w-full items-center justify-between py-6 sm:py-8 px-4 sm:px-0 border-t border-zinc-100 dark:border-zinc-800/50 gap-6 sm:gap-0">
              {/* Previous Post (Newer) */}
              <div className="flex w-full sm:w-1/2 justify-start">
                {prev?.path ? (
                  <Link
                    href={`/${prev.path}`}
                    className="group flex w-full items-center gap-3 sm:gap-4 transition-all pr-4"
                  >
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center text-zinc-300 transition-colors group-hover:text-primary dark:text-zinc-500">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.5 17.5L12.5 6.5C12.5 4.67 10.48 3.56 8.9 4.48L3.5 7.6L8.9 10.72C10.48 11.64 12.5 10.53 12.5 8.7V17.5Z" fill="currentColor" fillOpacity="0.4"/>
                        <path d="M21.5 17.5L21.5 6.5C21.5 4.67 19.48 3.56 17.9 4.48L12.5 7.6L17.9 10.72C19.48 11.64 21.5 10.53 21.5 8.7V17.5Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="line-clamp-2 text-[14px] sm:text-[15px] font-bold text-zinc-700 transition-colors group-hover:text-primary dark:text-zinc-300">
                        {prev.title}
                      </span>
                      {prev.date && (
                        <time className="mt-0.5 text-[12px] sm:text-[13px] text-zinc-400">
                          {formatPostDate(prev.date, locale)}
                        </time>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center text-zinc-300 dark:text-zinc-600">
                      <Coffee className="w-[22px] h-[22px] sm:w-6 sm:h-6" strokeWidth={2.5} />
                    </div>
                    <span className="text-[14px] sm:text-[15px] font-bold text-zinc-400 dark:text-zinc-500">
                      {dictionary.post.noPrevPost}
                    </span>
                  </div>
                )}
              </div>

              {/* Next Post (Older) */}
              <div className="flex w-full sm:w-1/2 justify-end mt-2 sm:mt-0">
                {next?.path ? (
                  <Link
                    href={`/${next.path}`}
                    className="group flex w-full items-center justify-end gap-3 sm:gap-4 text-right transition-all pl-4"
                  >
                    <div className="flex flex-col items-end text-right">
                      <span className="line-clamp-2 text-[14px] sm:text-[15px] font-bold text-zinc-700 transition-colors group-hover:text-primary dark:text-zinc-300">
                        {next.title}
                      </span>
                      {next.date && (
                        <time className="mt-0.5 text-[12px] sm:text-[13px] text-zinc-400">
                          {formatPostDate(next.date, locale)}
                        </time>
                      )}
                    </div>
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center text-zinc-300 transition-colors group-hover:text-primary dark:text-zinc-500">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.5 6.5L11.5 17.5C11.5 19.33 13.52 20.44 15.1 19.52L20.5 16.4L15.1 13.28C13.52 12.36 11.5 13.47 11.5 15.3V6.5Z" fill="currentColor" fillOpacity="0.4"/>
                        <path d="M2.5 6.5L2.5 17.5C2.5 19.33 4.52 20.44 6.1 19.52L11.5 16.4L6.1 13.28C4.52 12.36 2.5 13.47 2.5 15.3V6.5Z" fill="currentColor"/>
                      </svg>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center justify-end gap-3 opacity-60">
                    <span className="text-[14px] sm:text-[15px] font-bold text-zinc-400 dark:text-zinc-500">
                      {dictionary.post.noNextPost}
                    </span>
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center text-zinc-300 dark:text-zinc-600">
                      <Cone className="w-[22px] h-[22px] sm:w-6 sm:h-6" strokeWidth={2.5} />
                    </div>
                  </div>
                )}
              </div>
            </nav>

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
