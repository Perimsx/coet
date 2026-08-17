'use client'

import type { Blog } from 'contentlayer/generated'
import type { CoreContent } from 'pliny/utils/contentlayer'
import Link from '@/shared/components/Link'
import { motion } from 'framer-motion'

interface HomeWritingTimelineProps {
  posts: CoreContent<Blog>[]
}

function formatIndex(num: number): string {
  return num < 10 ? `0${num}` : `${num}`
}

function formatPostDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}月${day}日`
}

export default function HomeWritingTimeline({ posts }: HomeWritingTimelineProps) {
  const recentPosts = posts.slice(0, 6)
  const firstPost = recentPosts[0]
  const otherPosts = recentPosts.slice(1)

  return (
    <section id="recent-writing" className="mx-auto mt-10 max-w-[1400px] px-4 font-serif lg:px-12">
      <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-[1.6fr_1fr]">
        {/* 左栏：近期笔墨 / Recent Writing */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:pr-10"
        >
          <div className="mb-5 lg:mb-6">
            <div className="text-caption-10 uppercase tracking-[1.5px] text-neutral-5">
              Recent Writing
            </div>
            <h2 className="mt-1.5 font-serif text-title-20 tracking-[2px] text-neutral-7 lg:text-title-24">
              近期笔墨
            </h2>
          </div>

          <div className="relative">
            {/* 贯穿时间轴轨道 */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-2 left-[18px] w-0.5 bg-border"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-[18px] top-2 h-[58%] w-0.5 bg-gradient-to-b from-accent to-transparent"
            />

            {/* 首篇重点文章 */}
            {firstPost && (
              <div className="relative py-4 pl-10">
                <span className="absolute left-[19px] top-4 -translate-x-1/2 bg-paper px-1 text-label-12 font-medium tabular-nums tracking-[0.5px] text-accent">
                  01
                </span>
                <Link className="block group" href={`/${firstPost.path}`}>
                  <div className="text-label-12 text-neutral-6">
                    文章 {firstPost.categories?.[0] ? `· ${firstPost.categories[0]}` : ''}
                  </div>
                  <h3 className="mt-2 hyphens-auto break-words text-title-20 font-medium leading-normal text-neutral-9 transition-colors group-hover:text-accent">
                    {firstPost.title}
                  </h3>
                </Link>
              </div>
            )}

            {/* 后续文章列表 */}
            {otherPosts.map((post, idx) => {
              const displayIndex = formatIndex(idx + 2)
              return (
                <div key={post.slug || post.path} className="relative py-4 pl-10">
                  <span className="absolute left-[19px] top-4 -translate-x-1/2 bg-paper px-1 text-label-12 font-medium tabular-nums tracking-[0.5px] text-neutral-6">
                    {displayIndex}
                  </span>
                  <Link className="block group" href={`/${post.path}`}>
                    <div className="flex items-baseline justify-between gap-5">
                      <h3 className="hyphens-auto break-words text-copy-14 font-normal text-neutral-8 transition-colors group-hover:text-accent">
                        {post.title}
                      </h3>
                      {post.date && (
                        <span className="shrink-0 whitespace-nowrap text-label-12 tabular-nums text-neutral-6">
                          {formatPostDate(post.date)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-label-12 text-neutral-6">
                      文章 {post.categories?.[0] ? `· ${post.categories[0]}` : ''}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pl-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-label-12 text-neutral-6 transition-colors hover:text-accent"
            >
              <span>查看全部文章</span>
              <span>→</span>
            </Link>
          </div>
        </motion.div>

        {/* 右栏：随想短记 / Short Notes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:border-l lg:border-border lg:pl-10"
        >
          <div className="mb-5 lg:mb-6">
            <div className="text-caption-10 uppercase tracking-[1.5px] text-neutral-5">
              Short Notes
            </div>
            <h2 className="mt-1.5 font-serif text-title-20 tracking-[2px] text-neutral-7 lg:text-title-24">
              随想短记
            </h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-paper/40 p-4 transition-all hover:border-border hover:bg-paper shadow-xs">
              <div className="text-label-12 text-neutral-5">日常杂录</div>
              <p className="mt-2 text-copy-13 font-normal leading-relaxed text-neutral-8">
                在有序的代码与无序的生活之间，用文字留出一方余白。
              </p>
              <div className="mt-3 flex items-center justify-between text-caption-10 text-neutral-5">
                <span>序栈 · 记录</span>
                <Link href="/about" className="hover:text-accent transition-colors">
                  了解更多 →
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-paper/40 p-4 transition-all hover:border-border hover:bg-paper shadow-xs">
              <div className="text-label-12 text-neutral-5">思考碎片</div>
              <p className="mt-2 text-copy-13 font-normal leading-relaxed text-neutral-8">
                所谓设计的克制，并非简陋，而是让内容在最纯粹的纸面呼吸。
              </p>
              <div className="mt-3 flex items-center justify-between text-caption-10 text-neutral-5">
                <span>Yohaku · 余白</span>
                <Link href="/archive" className="hover:text-accent transition-colors">
                  时间轴归档 →
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
