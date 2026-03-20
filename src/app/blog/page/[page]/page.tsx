import ListLayout from '@/features/content/layouts/ListLayoutWithCategories'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { genPageMetadata } from '@/app/seo'

export const dynamic = 'force-dynamic'

const POSTS_PER_PAGE = 5

export async function generateMetadata(props: {
  params: Promise<{ page: string }>
}): Promise<Metadata> {
  const params = await props.params
  const pageNumber = Number.parseInt(params.page, 10)

  return genPageMetadata({
    title: `文章 - 第 ${pageNumber} 页`,
    description: `文章 - 第 ${pageNumber} 页`,
    pathname: `/blog/page/${pageNumber}`,
  })
}

export default async function Page(props: { params: Promise<{ page: string }> }) {
  const params = await props.params
  const posts = allCoreContent(sortPosts(allBlogs))
  const pageNumber = parseInt(params.page as string)
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)

  // 无效页码或空页面时返回 404
  if (pageNumber <= 0 || pageNumber > totalPages || isNaN(pageNumber)) {
    return notFound()
  }
  const initialDisplayPosts = posts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  const pagination = {
    currentPage: pageNumber,
    totalPages: totalPages,
  }

  return (
    <ListLayout
      posts={posts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title="文章"
    />
  )
}

