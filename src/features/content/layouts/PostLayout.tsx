import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Authors, Blog } from 'contentlayer/generated'
import Comments from '@/features/comments/components/Comments'
import FloatingToc from '@/features/content/components/FloatingToc'
import { cn } from '@/shared/utils/utils'
import Link from '@/shared/components/Link'
import PageTitle from '@/shared/components/PageTitle'
import SectionContainer from '@/features/site/components/SectionContainer'
import Tag from '@/features/content/components/Tag'
import siteMetadata from '@/config/site'
import { getServerDictionary } from '@/shared/utils/i18n-server'
import ReadingProgressBar from '@/features/site/components/ReadingProgressBar'
import { TocProvider } from '@/features/content/components/TocContext'
import { PostLayoutContent } from '@/features/content/components/PostLayoutContent'

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
  const { slug, date, title, tags } = content
  const dictionary = await getServerDictionary()
  const dateLocale = 'zh-CN'

  return (
    <SectionContainer>
      <TocProvider>
        <ReadingProgressBar />
        <PostLayoutContent>
          <FloatingToc toc={toc} />
        <div className="xl:divide-y xl:divide-gray-200 xl:dark:divide-gray-700">
          <header className="pt-4 xl:pb-4">
            <div className="mx-auto max-w-5xl space-y-1 text-center">
              <dl className="space-y-4">
                <div>
                  <dt className="sr-only">{dictionary.common.publishedOn}</dt>
                  <dd className="text-base leading-6 font-medium text-gray-500 dark:text-gray-400">
                    <time dateTime={date}>
                      {new Date(date).toLocaleDateString(dateLocale, postDateTemplate)}
                    </time>
                  </dd>
                </div>
              </dl>
              <div>
                <PageTitle>{title}</PageTitle>
              </div>
              {tags && tags.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
                  <div className="flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.707 8.707a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
                  </div>
                  {tags.map((tag) => (
                    <Tag key={tag} text={tag} />
                  ))}
                </div>
              )}
            </div>
          </header>
          <div className="divide-y divide-gray-200 pb-4 dark:divide-gray-700">
            <div className="prose dark:prose-invert prose-headings:scroll-mt-24 prose-p:leading-8 prose-img:mx-auto prose-img:rounded-xl prose-img:bg-background/40 dark:prose-img:bg-gray-900/55 mx-auto max-w-5xl pt-5 pb-5">
              {children}
            </div>

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
                <Comments slug={slug} />
              </div>
            )}
          </div>
        </div>
        </PostLayoutContent>
      </TocProvider>
    </SectionContainer>
  )
}
