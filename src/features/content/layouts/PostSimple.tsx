import { ReactNode } from 'react'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Comments from '@/features/comments/components/Comments'
import Link from '@/shared/components/Link'
import PageTitle from '@/shared/components/PageTitle'
import ScrollTopAndComment from '@/features/site/components/ScrollTopAndComment'
import SectionContainer from '@/features/site/components/SectionContainer'
import siteMetadata from '@/config/site'
import { getServerDictionary } from '@/shared/utils/i18n-server'

interface LayoutProps {
  content: CoreContent<Blog>
  toc?: { value: string; url: string; depth: number }[]
  children: ReactNode
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
}

export default async function PostLayout({
  content,
  next,
  prev,
  children,
}: LayoutProps) {
  const { slug, date, title } = content
  const dictionary = await getServerDictionary()
  const dateLocale = 'zh-CN'

  return (
    <SectionContainer>
      <ScrollTopAndComment labels={dictionary.scroll} />
      <article className="px-5 sm:px-10 md:px-14">
        <div>
          <header>
            <div className="mx-auto max-w-5xl space-y-1 border-b border-gray-200 pb-10 text-center dark:border-gray-700">
              <dl>
                <div>
                  <dt className="sr-only">{dictionary.common.publishedOn}</dt>
                  <dd className="text-base leading-6 font-medium text-gray-500 dark:text-gray-400">
                    <time dateTime={date}>{formatDate(date, dateLocale)}</time>
                  </dd>
                </div>
              </dl>
              <div>
                <PageTitle>{title}</PageTitle>
              </div>
            </div>
          </header>
          <div className="grid-rows-[auto_1fr] divide-y divide-gray-200 pb-8 xl:divide-y-0 dark:divide-gray-700">
            <div className="divide-y divide-gray-200 xl:col-span-3 xl:row-span-2 xl:pb-0 dark:divide-gray-700">
              <div className="prose dark:prose-invert prose-headings:scroll-mt-24 prose-p:leading-8 prose-img:mx-auto prose-img:cursor-zoom-in prose-img:rounded-xl prose-img:border prose-img:border-gray-200/80 prose-img:bg-background/40 prose-img:shadow-[0_14px_34px_-24px_rgba(15,23,42,0.55)] dark:prose-img:border-gray-700/80 dark:prose-img:bg-gray-900/55 prose-blockquote:border-l-primary-500/75 prose-blockquote:bg-background/20 prose-blockquote:px-4 prose-blockquote:py-2 dark:prose-blockquote:border-l-primary-400/75 dark:prose-blockquote:bg-gray-900/40 mx-auto max-w-5xl pt-10 pb-8">
                {children}
              </div>
            </div>
            {siteMetadata.comments && (
              <div className="pt-6 pb-6 text-center text-gray-700 dark:text-gray-300" id="comment">
                <Comments slug={slug} />
              </div>
            )}
            <footer>
              <div className="flex flex-col text-sm font-medium sm:flex-row sm:justify-between sm:text-base">
                {prev && prev.path && (
                  <div className="pt-4 xl:pt-8">
                    <Link
                      href={`/${prev.path}`}
                      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                      aria-label={`${dictionary.post.previousPostAria} ${prev.title}`}
                    >
                      &larr; {prev.title}
                    </Link>
                  </div>
                )}
                {next && next.path && (
                  <div className="pt-4 xl:pt-8">
                    <Link
                      href={`/${next.path}`}
                      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                      aria-label={`${dictionary.post.nextPostAria} ${next.title}`}
                    >
                      {next.title} &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </footer>
          </div>
        </div>
      </article>
    </SectionContainer>
  )
}
