import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { getAllBlogs, getCategoryData } from '@/features/content/lib/contentlayer-adapter'
import { notFound } from 'next/navigation'
import { genPageMetadata } from '@/app/seo'
import ListLayout from '@/features/content/layouts/ListLayoutWithCategories'
import { resolvePostCategories } from '@/features/content/lib/post-categories'
import { Metadata } from 'next'
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
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const params = await props.params
  const category = decodeURIComponent(params.category)
  const title = getLocalizedCategoryLabel(category)
  return genPageMetadata({
    title,
    pathname: `/blog/category/${encodeURIComponent(category)}`,
  })
}

export default async function CategoryPage(props: { params: Promise<{ category: string }> }) {
  const params = await props.params
  const category = decodeURIComponent(params.category)
  const allBlogs = getAllBlogs()
  const categoryData = getCategoryData()
  const posts = allCoreContent(sortPosts(allBlogs))
  const filteredPosts = filterPostsByCategory(posts, category)
  const translatedTitle = getLocalizedCategoryLabel(category)

  if (!filteredPosts.length) {
    return notFound()
  }

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = filteredPosts.slice(0, POSTS_PER_PAGE)
  const pagination = {
    currentPage: 1,
    totalPages,
  }

  return (
    <ListLayout
      posts={filteredPosts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title={translatedTitle}
      categoryData={categoryData}
    />
  )
}
