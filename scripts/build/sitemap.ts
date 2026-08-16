import { writeFileSync } from 'fs'
import path from 'path'
import { slug } from 'github-slugger'
import { siteMetadata } from '../../blog.config'
import tagData from '../../src/generated/content/tag-data.json'
import categoryData from '../../src/generated/content/category-data.json'
import { allBlogs } from '../../.contentlayer/generated/index.mjs'

const outputFolder = process.env.EXPORT ? 'out' : 'public'

function getLatestTimestamp(values: Array<string | Date | undefined>): Date {
  const timestamps = values
    .filter(Boolean)
    .map((value) => new Date(value as string | Date).getTime())
    .filter((value) => Number.isFinite(value))

  return timestamps.length ? new Date(Math.max(...timestamps)) : new Date()
}

function normalizeSiteUrl(url?: string): string {
  if (!url) return 'https://blog.cot.wiki'
  return url.replace(/\/+$/, '')
}

export async function generateSitemapAndRobots() {
  const siteUrl = normalizeSiteUrl(siteMetadata.siteUrl)
  const publishedPosts = allBlogs.filter((post) => !post.draft)
  const now = new Date()

  const tagMap = new Map<string, Date>()
  const categoryMap = new Map<string, Date>()

  const postUrls = publishedPosts.map((post) => {
    const postObj = post as unknown as { lastmod?: string; date: string; path: string; tags?: string[]; categories?: string[] | string }
    const updatedAt = getLatestTimestamp([postObj.lastmod, postObj.date])
    const postPath = postObj.path.startsWith('/') ? postObj.path : `/${postObj.path}`

    post.tags?.forEach((t: string) => {
      const tagSlug = slug(t)
      const current = tagMap.get(tagSlug)
      if (!current || updatedAt > current) {
        tagMap.set(tagSlug, updatedAt)
      }
    })

    if (post.categories) {
      const cats = Array.isArray(post.categories) ? post.categories : [post.categories]
      cats.forEach((cat: string) => {
        const catSlug = slug(cat)
        const current = categoryMap.get(catSlug)
        if (!current || updatedAt > current) {
          categoryMap.set(catSlug, updatedAt)
        }
      })
    }

    return {
      loc: `${siteUrl}${postPath}`,
      lastmod: updatedAt.toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.9',
    }
  })

  // 补齐 tagData 和 categoryData 中的其它条目
  Object.keys(tagData).forEach((tagSlug) => {
    if (!tagMap.has(tagSlug)) {
      tagMap.set(tagSlug, now)
    }
  })
  Object.keys(categoryData).forEach((catSlug) => {
    if (!categoryMap.has(catSlug)) {
      categoryMap.set(catSlug, now)
    }
  })

  const staticUrls = [
    { loc: `${siteUrl}/`, lastmod: now.toISOString().split('T')[0], changefreq: 'daily', priority: '1.0' },
    { loc: `${siteUrl}/blog`, lastmod: now.toISOString().split('T')[0], changefreq: 'daily', priority: '0.85' },
    { loc: `${siteUrl}/archive`, lastmod: now.toISOString().split('T')[0], changefreq: 'weekly', priority: '0.7' },
    { loc: `${siteUrl}/blog/category`, lastmod: now.toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },
    { loc: `${siteUrl}/tags`, lastmod: now.toISOString().split('T')[0], changefreq: 'weekly', priority: '0.75' },
    { loc: `${siteUrl}/friends`, lastmod: now.toISOString().split('T')[0], changefreq: 'weekly', priority: '0.5' },
    { loc: `${siteUrl}/about`, lastmod: now.toISOString().split('T')[0], changefreq: 'monthly', priority: '0.6' },
  ]

  const tagUrls = Array.from(tagMap.entries()).map(([tagSlug, updatedAt]) => ({
    loc: `${siteUrl}/tags/${tagSlug}`,
    lastmod: updatedAt.toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: '0.75',
  }))

  const categoryUrls = Array.from(categoryMap.entries()).map(([catSlug, updatedAt]) => ({
    loc: `${siteUrl}/blog/category/${encodeURIComponent(catSlug)}`,
    lastmod: updatedAt.toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: '0.8',
  }))

  const allUrls = [...staticUrls, ...postUrls, ...tagUrls, ...categoryUrls]

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

  writeFileSync(path.join(process.cwd(), outputFolder, 'sitemap.xml'), sitemapXml, 'utf-8')
  console.log('[postbuild] sitemap.xml 已生成')

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`
  writeFileSync(path.join(process.cwd(), outputFolder, 'robots.txt'), robotsTxt, 'utf-8')
  console.log('[postbuild] robots.txt 已生成')
}

export default generateSitemapAndRobots
