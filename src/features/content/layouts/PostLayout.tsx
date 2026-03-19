import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Authors, Blog } from 'contentlayer/generated'
import Comments from '@/features/comments/components/Comments'
import FloatingToc from '@/features/content/components/FloatingToc'
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

const navDateTemplate: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
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

function formatNavDate(value: string | undefined) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('zh-CN', navDateTemplate)
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
          <header className="pt-6 xl:pb-6">
            <div className="mx-auto max-w-5xl space-y-1 text-center">
              <dl className="space-y-10">
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
          <div className="divide-y divide-gray-200 pb-8 dark:divide-gray-700">
            <div className="prose dark:prose-invert prose-headings:scroll-mt-24 prose-p:leading-8 prose-img:mx-auto prose-img:rounded-xl prose-img:bg-background/40 dark:prose-img:bg-gray-900/55 mx-auto max-w-5xl pt-10 pb-8">
              {children}
            </div>

            <div className="py-4 sm:py-6">
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
              <nav className="flex items-start justify-between gap-6 py-6 text-sm">
                <div className="min-w-0 flex-1">
                  {prev?.path ? (
                    <>
                      <p className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                        {dictionary.post.previousArticle}
                      </p>
                      <Link
                        href={`/${prev.path}`}
                        className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 mt-1 inline-flex max-w-full items-center"
                      >
                        <span className="truncate">{prev.title}</span>
                      </Link>
                      {formatNavDate(prev.date) && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatNavDate(prev.date)}
                        </p>
                      )}
                    </>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 text-right">
                  {next?.path ? (
                    <>
                      <p className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                        {dictionary.post.nextArticle}
                      </p>
                      <Link
                        href={`/${next.path}`}
                        className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 mt-1 inline-flex max-w-full items-center justify-end"
                      >
                        <span className="truncate">{next.title}</span>
                      </Link>
                      {formatNavDate(next.date) && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatNavDate(next.date)}
                        </p>
                      )}
                    </>
                  ) : null}
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
