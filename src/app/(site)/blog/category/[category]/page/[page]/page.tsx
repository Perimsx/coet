import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'

export const dynamic = "force-static";
export const dynamicParams = false;

import { allBlogs } from 'contentlayer/generated'
import { getCategoryData } from '@/features/content/lib/contentlayer-adapter'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { genPageMetadata } from '@/features/site/lib/seo'
import ListLayout from '@/features/content/layouts/ListLayoutWithCategories'
import { resolvePostCategories } from '@/features/content/lib/post-categories'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import { getLocalizedCategoryLabel } from '@/features/content/lib/localized-category-label'
import { getPostSourcePath } from '@/features/content/lib/post-utils'


const POSTS_PER_PAGE = 5

export async function generateStaticParams() {
  const categoryData = getCategoryData()
  const paths: { category: string; page: string }[] = []

  Object.entries(categoryData).forEach(([category, count]) => {
    const totalPages = Math.ceil(count as number / POSTS_PER_PAGE)
    for (let i = 1; i <= totalPages; i++) {
      paths.push({
        category: encodeURIComponent(category),
        page: i.toString(),
      })
    }
  })

  return paths
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
  const title = getLocalizedCategoryLabel(category, "zh")
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
  const translatedTitle = getLocalizedCategoryLabel(category, "zh")

  if (!filteredPosts.length || isNaN(pageNumber) || pageNumber <= 0) {
    return notFound()
  }

  return (
    <ListLayout
      posts={filteredPosts}
      title={translatedTitle}
    />
  )
}
