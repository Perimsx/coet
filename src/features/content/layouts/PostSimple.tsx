import { ReactNode } from 'react'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Comments from '@/features/comments/components/Comments'
import Link from '@/shared/components/Link'
import PageTitle from '@/shared/components/PageTitle'
import SectionContainer from '@/features/site/components/SectionContainer'
import { ScrollReveal } from '@/shared/components/ScrollReveal'
import { siteMetadata } from '@/blog.config'
import { getDictionary } from '@/shared/utils/i18n'

interface LayoutProps {
  content: CoreContent<Blog>
  toc?: { value: string; url: string; depth: number }[]
  children: ReactNode
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
}

export default function PostLayout({
  content,
  next,
  prev,
  children,
}: LayoutProps) {
  const { slug, date, title } = content
  const isEn = slug?.startsWith('en/') || content.path?.startsWith('en/') || content.filePath?.includes('.en.')
  const locale = isEn ? 'en' : 'zh'
  const dictionary = getDictionary(locale)
  const dateLocale = locale === 'en' ? 'en-US' : 'zh-CN'

  return (
    <SectionContainer>
      <article className="px-5 sm:px-10 md:px-14">
        <ScrollReveal>
          <header>
            <div className="mx-auto max-w-4xl space-y-2 border-b border-border pb-8 text-center">
              <dl>
                <div>
                  <dt className="sr-only">{dictionary.common.publishedOn}</dt>
                  <dd className="text-label-12 font-normal text-neutral-6">
                    <time dateTime={date}>{formatDate(date, dateLocale)}</time>
                  </dd>
                </div>
              </dl>
              <div>
                <PageTitle>{title}</PageTitle>
              </div>
            </div>
          </header>
        </ScrollReveal>
          <div className="mx-auto max-w-4xl border-t border-border pb-8">
            <div className="pt-8 pb-8">
              <div className="article-detail">
                {children}
              </div>
            </div>
            {siteMetadata.comments && (
              <div className="pt-6 pb-6 text-center text-neutral-8" id="comment">
                <Comments slug={slug || ''} locale={locale} />
              </div>
            )}
            <footer className="border-t border-border pt-4">
              <div className="flex flex-col text-label-12 font-medium sm:flex-row sm:justify-between">
                {prev && prev.path && (
                  <div className="pt-2">
                    <Link
                      href={`/${prev.path}`}
                      className="text-neutral-7 hover:text-accent transition-colors"
                      aria-label={`${dictionary.post.previousPostAria} ${prev.title}`}
                    >
                      &larr; {prev.title}
                    </Link>
                  </div>
                )}
                {next && next.path && (
                  <div className="pt-2">
                    <Link
                      href={`/${next.path}`}
                      className="text-neutral-7 hover:text-accent transition-colors"
                      aria-label={`${dictionary.post.nextPostAria} ${next.title}`}
                    >
                      {next.title} &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </footer>
          </div>
      </article>
    </SectionContainer>
  )
}
