import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { genPageMetadata } from '@/app/seo'
import ListLayout from '@/features/content/layouts/ListLayoutWithCategories'
import { resolvePostCategories } from '@/features/content/lib/post-categories'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import { getLocalizedCategoryLabel } from '@/features/content/lib/localized-category-label'

export const dynamic = 'force-dynamic'

const POSTS_PER_PAGE = 5

function getPostSourcePath(post: { filePath?: string; path?: string; slug?: string }) {
  return post.filePath || post.path || post.slug || ''
}

function filterPostsByCategory(posts: CoreContent<Blog>[], category: string) {
  return posts.filter((post) =>
    resolvePostCategories(post.categories, getPostSourcePath(post)).includes(category)
  )
}

export async function generateMetadata(props: {
  params: Promise<{ category: string; page: string }>
}): Promise<Metadata> {
  const params = await props.params
  const category = decodeURIComponent(params.category)
  const pageNumber = Number.parseInt(params.page, 10)
  const title = getLocalizedCategoryLabel(category)
  const displayTitle = `${title} - 第 ${pageNumber} 页`

  return genPageMetadata({
    title: displayTitle,
    description: `「${title}」分类下的文章列表，当前第 ${pageNumber} 页。`,
    pathname: `/blog/category/${encodeURIComponent(category)}/page/${pageNumber}`,
  })
}

export default async function CategoryPagePagination(props: {
  params: Promise<{ category: string; page: string }>
}) {
  const params = await props.params
  const category = decodeURIComponent(params.category)
  const pageNumber = parseInt(params.page, 10)
  const posts = allCoreContent(sortPosts(allBlogs))
  const filteredPosts = filterPostsByCategory(posts, category)
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const translatedTitle = getLocalizedCategoryLabel(category)

  if (!filteredPosts.length || pageNumber <= 0 || pageNumber > totalPages || isNaN(pageNumber)) {
    return notFound()
  }

  const initialDisplayPosts = filteredPosts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  const pagination = {
    currentPage: pageNumber,
    totalPages,
  }

  return (
    <ListLayout
      posts={filteredPosts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title={translatedTitle}
    />
  )
}
