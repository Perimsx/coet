import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'

export const dynamic = "force-static";

import { genBreadcrumbJsonLd, genPageMetadata } from '@/app/seo'
import ListLayout from '@/features/content/layouts/ListLayoutWithCategories'

import { getServerDictionary } from '@/shared/utils/i18n-server'
import { Metadata } from 'next'
import { getSeoContext } from '@/features/site/lib/seo'
import { getAllBlogs } from '@/features/content/lib/contentlayer-adapter'


export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: "文章",
    description: "浏览 kerntau 博客的全部技术文章。涵盖网络安全、前端开发、全栈工程、开发工具等多个技术方向的原创内容。",
    pathname: '/blog',
  })
}

export default async function BlogPage() {
  const { siteUrl } = await getSeoContext()
  const dictionary = await getServerDictionary()
  const allBlogs = getAllBlogs()
  const posts = allCoreContent(sortPosts(allBlogs))

  const breadcrumbJsonLd = genBreadcrumbJsonLd([
    { name: dictionary.nav.home, item: '/' },
    { name: dictionary.nav.blog, item: '/blog' }
  ], siteUrl)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ListLayout
        posts={posts}
        title="全部文章"
      />
    </>
  )
}
