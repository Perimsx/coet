'use client'

import { motion } from 'framer-motion'
import Link from '@/shared/components/Link'
import PageHeader from '@/shared/components/PageHeader'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'

type YearGroup = {
  year: string
  posts: CoreContent<Blog>[]
}

function sortArchivePosts(posts: CoreContent<Blog>[]) {
  return [...posts].sort((a, b) => {
    const aTime = new Date(a.date).getTime()
    const bTime = new Date(b.date).getTime()
    return bTime - aTime
  })
}

function groupPostsByYear(posts: CoreContent<Blog>[]): YearGroup[] {
  const grouped = new Map<string, CoreContent<Blog>[]>()

  posts.forEach((post) => {
    const year = new Date(post.date).getFullYear().toString()
    const yearPosts = grouped.get(year)
    if (yearPosts) {
      yearPosts.push(post)
    } else {
      grouped.set(year, [post])
    }
  })

  return Array.from(grouped.entries()).map(([year, yearPosts]) => ({
    year,
    posts: yearPosts,
  }))
}

export default function ArchiveClient({ posts: initialPosts }: { posts: CoreContent<Blog>[] }) {
  const posts = sortArchivePosts(initialPosts)
  const yearGroups = groupPostsByYear(posts)
  const totalPosts = posts.length

  return (
    <section className="mx-auto max-w-5xl px-4 pt-0 pb-4 sm:pt-2 sm:px-6 lg:px-8">
      <PageHeader
        title="归档"
        meta={`共计 ${totalPosts} 篇文章，记录了技术的点滴与思考。`}
      />

      {!yearGroups.length ? (
        <div className="py-24 text-center text-sm text-foreground/30">
          暂无归档文章
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mt-6 space-y-10 sm:mt-10 sm:space-y-16"
        >
          {yearGroups.map((group) => (
            <div key={group.year} className="space-y-5 sm:space-y-8">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold tracking-widest text-foreground/75 sm:text-xl">
                  {group.year}
                </h2>
                <div className="h-px flex-1 bg-border/20" />
              </div>
              <ul className="space-y-2 sm:space-y-3">
                {group.posts.map((post) => (
                  <motion.li
                    key={post.path}
                    className="flex items-center"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Link
                      href={`/${post.path}`}
                      className="group flex w-full items-end gap-1.5 py-0.5 sm:gap-2 sm:py-1"
                    >
                      <span className="min-w-0 flex-shrink truncate text-[15px] font-medium text-foreground/60 transition-colors group-hover:text-primary sm:text-[17px]">
                        {post.title}
                      </span>
                      <div className="mb-1.5 h-px min-w-[12px] flex-1 border-b border-dotted border-border/40 transition-colors group-hover:border-primary/30" />
                      <span className="shrink-0 text-[11px] tabular-nums text-foreground/25 transition-colors group-hover:text-foreground/40 sm:text-xs">
                        {new Date(post.date).toLocaleDateString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>
      )}
    </section>
  )
}
