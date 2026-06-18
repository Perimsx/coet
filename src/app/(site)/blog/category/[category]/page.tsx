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
import { getPostSourcePath } from '@/features/content/lib/post-utils'


export async function generateStaticParams() {
  const categoryData = getCategoryData()
  return Object.keys(categoryData).map((category) => ({
    category: encodeURIComponent(category),
  }))
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
    description: `查看「${title}」分类下的全部文章。`,
    pathname: `/blog/category/${encodeURIComponent(category)}`,
  })
}

export default async function CategoryPage(props: { params: Promise<{ category: string }> }) {
  const params = await props.params
  const category = decodeURIComponent(params.category)
  const allBlogs = getAllBlogs()
  const posts = allCoreContent(sortPosts(allBlogs))
  const filteredPosts = filterPostsByCategory(posts, category)
  const translatedTitle = getLocalizedCategoryLabel(category)

  if (!filteredPosts.length) {
    return notFound()
  }

  return (
    <ListLayout
      posts={filteredPosts}
      title={translatedTitle}
    />
  )
}
