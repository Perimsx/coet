import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import ListLayout from '@/features/content/layouts/ListLayoutWithTags'
import { allBlogs } from 'contentlayer/generated'
import tagData from '@/generated/content/tag-data.json'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { genPageMetadata } from '@/app/seo'

export const dynamic = 'force-dynamic'

const POSTS_PER_PAGE = 5

export async function generateMetadata(props: {
  params: Promise<{ tag: string; page: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tag = decodeURI(params.tag)
  const pageNumber = Number.parseInt(params.page, 10)

  return genPageMetadata({
    title: `${tag} - 第 ${pageNumber} 页`,
    pathname: `/tags/${encodeURIComponent(tag)}/page/${pageNumber}`,
  })
}

export default async function TagPage(props: { params: Promise<{ tag: string; page: string }> }) {
  const params = await props.params
  const tag = decodeURI(params.tag)
  const rawTitle = tag[0].toUpperCase() + tag.split(' ').join('-').slice(1)

  const allTagKeys = Object.keys(tagData as Record<string, number>)
  const tagLabelMap = Object.fromEntries(
    allTagKeys.map((key) => [key, key])
  )
  const pageNumber = parseInt(params.page)
  const filteredPosts = allCoreContent(
    sortPosts(allBlogs.filter((post) => post.tags && post.tags.map((t) => slug(t)).includes(tag)))
  )
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)

  // 无效页码或空页面时返回 404
  if (pageNumber <= 0 || pageNumber > totalPages || isNaN(pageNumber)) {
    return notFound()
  }
  const initialDisplayPosts = filteredPosts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  const pagination = {
    currentPage: pageNumber,
    totalPages: totalPages,
  }

  return (
    <ListLayout
      posts={filteredPosts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title={rawTitle}
      tagLabelMap={tagLabelMap}
    />
  )
}

