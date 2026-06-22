import ListLayout from '@/features/content/layouts/ListLayoutWithCategories'

export const dynamic = "force-static";
export const dynamicParams = false;

import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { Metadata } from 'next'
import { genPageMetadata } from '@/features/site/lib/seo'


const POSTS_PER_PAGE = 5

export async function generateStaticParams() {
  const posts = allCoreContent(sortPosts(allBlogs))
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  return Array.from({ length: totalPages }, (_, i) => ({ page: (i + 1).toString() }))
}

export async function generateMetadata(props: {
  params: Promise<{ page: string }>
}): Promise<Metadata> {
  const params = await props.params
  const pageNumber = Number.parseInt(params.page, 10)

  return genPageMetadata({
    title: `文章 - 第 ${pageNumber} 页`,
    description: `kerntau 博客文章列表第 ${pageNumber} 页。按发布时间排序浏览全部技术文章。`,
    pathname: `/blog/page/${pageNumber}`,
  })
}

export default async function Page() {
  const posts = allCoreContent(sortPosts(allBlogs))
  return (
    <ListLayout
      posts={posts}
      title="文章"
    />
  )
}

