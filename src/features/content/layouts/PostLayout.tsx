import { ReactNode } from 'react'
import Image from '@/features/content/components/Image'
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
  authorDetails,
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

        <header className="mx-auto max-w-3xl pt-10 pb-8 sm:pt-16 sm:pb-12 px-4 text-center">
          <div className="space-y-6">
            <PageTitle className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {title}
            </PageTitle>

            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-[13px] font-medium text-muted-foreground/80">
              {category && (
                <div className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                  <span className="text-primary">{getCategoryLabel(category)}</span>
                </div>
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

        {displayImage && (
          <div className="mx-auto max-w-5xl px-4 sm:px-6 mb-10 xl:mb-14">
            <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden border border-border/10 shadow-sm bg-muted/10">
              <Image
                src={displayImage}
                alt={title}
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
        )}

        <PostLayoutContent>
          <FloatingToc toc={toc} hasHeroImage={!!displayImage} />
          <div className="relative">
            <div className="mx-auto max-w-4xl w-full break-words pt-4 pb-2 sm:pt-6 sm:pb-4">
              <article id="article" className="article-detail">
                {children}
              </article>
              <ArticleEnhancer />
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="py-6 sm:py-8" id="article-footer">
              <div className="group/license relative overflow-hidden rounded-3xl border border-zinc-200/20 bg-white/40 p-8 shadow-xl shadow-zinc-200/20 backdrop-blur-md transition-all hover:shadow-2xl hover:shadow-primary/5 dark:border-white/5 dark:bg-zinc-900/40 dark:shadow-none">
                {/* 装饰性背景：艺术化的 CC 标识 */}
                <div className="absolute -bottom-16 -right-16 z-0 select-none opacity-[0.04] transition-transform duration-1000 group-hover/license:scale-110 dark:opacity-[0.08]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 24 24" fill="currentColor" className="text-foreground"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-11c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5c.87 0 1.63-.44 2.09-1.1l1.61.96C12.49 15.11 11.34 16 10 16c-2.21 0-4-1.79-4-4s1.79-4 4-4c1.34 0 2.49.89 2.91 2.13l-1.61.96c-.46-.66-1.22-1.09-2.09-1.09zm5 0c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5c.87 0 1.63-.44 2.09-1.1l1.61.96c-.71 1.25-1.86 2.14-3.21 2.14-2.21 0-4-1.79-4-4s1.79-4 4-4c1.34 0 2.49.89 2.91 2.13l-1.61.96c-.46-.66-1.22-1.09-2.09-1.09z"/></svg>
                </div>
                
                <div className="relative z-10 flex flex-col gap-8">
                  {/* 顶部标题与链接 */}
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                      {title}
                    </h4>
                    <p className="inline-block rounded-full bg-primary/5 px-3 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/10">
                      {`${siteMetadata.siteUrl}/posts/${slug}`}
                    </p>
                  </div>

                  {/* 四列元数据 */}
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 sm:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                        作者
                      </span>
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {authorDetails[0]?.name || siteMetadata.author}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                        发布时间
                      </span>
                      <time className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {new Date(date).toLocaleDateString(dateLocale)}
                      </time>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                        更新时间
                      </span>
                      <time className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {new Date(date).toLocaleDateString(dateLocale)}
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

            {(next || prev) && (
              <nav className="flex flex-col gap-12 py-8 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-100 dark:border-zinc-800/50">
                {/* Previous Post */}
                <div className="flex-1">
                  {prev?.path ? (
                    <Link
                      href={`/${prev.path}`}
                      className="group flex items-center gap-4 transition-all"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center text-zinc-300 transition-colors group-hover:text-primary dark:text-zinc-500">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12.5 17.5L12.5 6.5C12.5 4.67 10.48 3.56 8.9 4.48L3.5 7.6L8.9 10.72C10.48 11.64 12.5 10.53 12.5 8.7V17.5Z" fill="currentColor" fillOpacity="0.4"/>
                          <path d="M21.5 17.5L21.5 6.5C21.5 4.67 19.48 3.56 17.9 4.48L12.5 7.6L17.9 10.72C19.48 11.64 21.5 10.53 21.5 8.7V17.5Z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 transition-colors group-hover:text-primary">
                          {dictionary.post.previousArticle}
                        </span>
                        <span className="line-clamp-1 mt-1 text-base font-bold text-zinc-800 transition-colors group-hover:text-zinc-900 dark:text-zinc-200">
                          {prev.title}
                        </span>
                        {prev.date && (
                          <time className="mt-1 text-[11px] font-medium text-zinc-400">
                            {(() => {
                              const d = new Date(prev.date);
                              return `${d.getFullYear().toString().slice(-2)}年${d.getMonth() + 1}月${d.getDate()}日`;
                            })()}
                          </time>
                        )}
                      </div>
                    </Link>
                  ) : <div className="flex-1" />}
                </div>

                {/* Next Post */}
                <div className="flex-1">
                  {next?.path ? (
                    <Link
                      href={`/${next.path}`}
                      className="group flex items-center justify-end gap-4 text-right transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 transition-colors group-hover:text-primary">
                          {dictionary.post.nextArticle}
                        </span>
                        <span className="line-clamp-1 mt-1 text-base font-bold text-zinc-800 transition-colors group-hover:text-zinc-900 dark:text-zinc-200">
                          {next.title}
                        </span>
                        {next.date && (
                          <time className="mt-1 text-[11px] font-medium text-zinc-400">
                            {(() => {
                              const d = new Date(next.date);
                              return `${d.getFullYear().toString().slice(-2)}年${d.getMonth() + 1}月${d.getDate()}日`;
                            })()}
                          </time>
                        )}
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center text-zinc-300 transition-colors group-hover:text-primary dark:text-zinc-500">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.5 6.5L11.5 17.5C11.5 19.33 13.52 20.44 15.1 19.52L20.5 16.4L15.1 13.28C13.52 12.36 11.5 13.47 11.5 15.3V6.5Z" fill="currentColor" fillOpacity="0.4"/>
                          <path d="M2.5 6.5L2.5 17.5C2.5 19.33 4.52 20.44 6.1 19.52L11.5 16.4L6.1 13.28C4.52 12.36 2.5 13.47 2.5 15.3V6.5Z" fill="currentColor"/>
                        </svg>
                      </div>
                    </Link>
                  ) : <div className="flex-1" />}
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
