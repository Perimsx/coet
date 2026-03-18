import Link from '@/shared/components/Link'
import PageHeader from '@/shared/components/PageHeader'
import PostListItem from '@/features/content/components/PostListItem'
import { formatDate } from 'pliny/utils/formatDate'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import { getServerDictionary } from '@/shared/utils/i18n-server'
import { resolvePostCategories } from '@/features/content/lib/post-categories'
import { getLocalizedCategoryLabel } from '@/features/content/lib/localized-category-label'

const MAX_DISPLAY = 5

interface HomeProps {
  posts: CoreContent<Blog>[]
}

export default async function Home({ posts }: HomeProps) {
  const dictionary = await getServerDictionary()
  const dateLocale = 'zh-CN'
  const displayedPosts = posts.slice(0, MAX_DISPLAY)

  return (
    <>
      <section className="pt-6 pb-8">
        <div className="border-border/60 from-card/85 to-background rounded-3xl border bg-linear-to-b px-5 py-6 sm:px-7 sm:py-8">
          <PageHeader
            title={dictionary.home.latest}
            meta={dictionary.home.latestSubtitle}
            action={
              posts.length > MAX_DISPLAY ? (
                <Link
                  href="/blog"
                  className="bg-muted/60 hover:bg-muted dark:bg-muted/35 dark:hover:bg-muted/55 inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold text-gray-700 transition-colors hover:text-gray-900 sm:h-9 sm:px-4 sm:text-sm dark:text-gray-200 dark:hover:text-gray-100"
                  aria-label={dictionary.common.allPosts}
                >
                  {dictionary.common.allPosts}
                </Link>
              ) : null
            }
          />

          <ul className="divide-border/60 mt-6 divide-y">
            {!displayedPosts.length && (
              <li className="py-8 text-center text-gray-500 dark:text-gray-400">
                {dictionary.common.noPostsFound}
              </li>
            )}

            {displayedPosts.map((post) => {
              const { slug, date, title, summary, tags } = post
              const postSourcePath = post.filePath || post.path || post.slug || ''
              const primaryCategory = resolvePostCategories(post.categories, postSourcePath)[0]
              const categoryLabel = getLocalizedCategoryLabel(primaryCategory)

              return (
                <li key={slug} className="py-5 first:pt-0 last:pb-0">
                  <PostListItem
                    href={`/blog/${slug}`}
                    dateLabel={dictionary.common.publishedOn}
                    dateTime={date}
                    dateText={formatDate(date, dateLocale)}
                    title={title}
                    summary={summary}
                    categorySlug={primaryCategory}
                    categoryLabel={categoryLabel}
                    tags={tags || []}
                    compact={true}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}
