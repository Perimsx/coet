import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'

export const dynamic = "force-static";

import { getAllBlogs, getCategoryData } from '@/features/content/lib/contentlayer-adapter'
import { genBreadcrumbJsonLd, genPageMetadata } from '@/app/seo'
import ListLayout from '@/features/content/layouts/ListLayoutWithCategories'

import { getServerDictionary } from '@/shared/utils/i18n-server'
import { Metadata } from 'next'
import { getSeoContext } from '@/features/site/lib/seo'


const POSTS_PER_PAGE = 5

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
  const categoryData = getCategoryData()
  const posts = allCoreContent(sortPosts(allBlogs))
  const pageNumber = 1
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = posts.slice(0, POSTS_PER_PAGE * pageNumber)
  const pagination = {
    currentPage: pageNumber,
    totalPages: totalPages,
  }

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
        initialDisplayPosts={initialDisplayPosts}
        pagination={pagination}
        title="全部文章"
        categoryData={categoryData}
      />
    </>
  )
}
