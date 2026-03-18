import { MetadataRoute } from 'next'
import { allBlogs } from 'contentlayer/generated'
import { slug } from 'github-slugger'

import { resolvePostCategories } from '@/features/content/lib/post-categories'
import { getSeoContext, joinSiteUrl } from '@/features/site/lib/seo'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl } = await getSeoContext()
  const publishedPosts = allBlogs.filter((post) => !post.draft)
  const postsPerPage = 5

  const blogRoutes = publishedPosts.map((post) => ({
    url: joinSiteUrl(siteUrl, `/${post.path}`),
    lastModified: post.lastmod || post.date,
  }))

  const tagMap = new Map<string, number>()
  const categoryMap = new Map<string, number>()

  publishedPosts.forEach((post) => {
    const resolvedCategories = resolvePostCategories(post.categories, post.filePath)
    post.tags?.forEach((tag) => {
      const tagSlug = slug(tag)
      tagMap.set(tagSlug, (tagMap.get(tagSlug) || 0) + 1)
    })
    resolvedCategories.forEach((category) => {
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    })
  })

  const tagRoutes = Array.from(tagMap.keys()).map((tag) => ({
    url: joinSiteUrl(siteUrl, `/tags/${tag}`),
    lastModified: new Date().toISOString().split('T')[0],
  }))

  const categoryRoutes = Array.from(categoryMap.keys()).map((category) => ({
    url: joinSiteUrl(siteUrl, `/blog/category/${encodeURIComponent(category)}`),
    lastModified: new Date().toISOString().split('T')[0],
  }))

  const routes = ['/', '/blog', '/archive', '/tags', '/about', '/friends'].map((route) => ({
    url: joinSiteUrl(siteUrl, route),
    lastModified: new Date().toISOString().split('T')[0],
  }))

  const blogPaginationRoutes = Array.from(
    { length: Math.max(0, Math.ceil(publishedPosts.length / postsPerPage) - 1) },
    (_, index) => ({
      url: joinSiteUrl(siteUrl, `/blog/page/${index + 2}`),
      lastModified: new Date().toISOString().split('T')[0],
    })
  )

  const tagPaginationRoutes = Array.from(tagMap.entries()).flatMap(([tag, count]) =>
    Array.from({ length: Math.max(0, Math.ceil(count / postsPerPage) - 1) }, (_, index) => ({
      url: joinSiteUrl(siteUrl, `/tags/${tag}/page/${index + 2}`),
      lastModified: new Date().toISOString().split('T')[0],
    }))
  )

  const categoryPaginationRoutes = Array.from(categoryMap.entries()).flatMap(([category, count]) =>
    Array.from({ length: Math.max(0, Math.ceil(count / postsPerPage) - 1) }, (_, index) => ({
      url: joinSiteUrl(siteUrl, `/blog/category/${encodeURIComponent(category)}/page/${index + 2}`),
      lastModified: new Date().toISOString().split('T')[0],
    }))
  )

  return [
    ...routes,
    ...blogRoutes,
    ...blogPaginationRoutes,
    ...tagRoutes,
    ...tagPaginationRoutes,
    ...categoryRoutes,
    ...categoryPaginationRoutes,
  ]
}
