import type { Blog } from 'contentlayer/generated'

import type { SiteSettings } from '@/server/site-settings'

import siteMetadata from '@/config/site'
import { joinSiteUrl, normalizeSiteUrl } from './seo'

export type RssItem = {
  title: string
  path: string
  description?: string
  publishedAt: string
  updatedAt?: string
  categories?: string[]
}

type CreateRssXmlOptions = {
  title: string
  description: string
  siteUrl: string
  feedPath: string
  language?: string
  items: RssItem[]
}

export function escapeXml(value?: string | null) {
  if (!value) return ''

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function createRssXml({
  title,
  description,
  siteUrl,
  feedPath,
  language = siteMetadata.language || 'zh-CN',
  items,
}: CreateRssXmlOptions) {
  const resolvedSiteUrl = normalizeSiteUrl(siteUrl)
  const feedUrl = joinSiteUrl(resolvedSiteUrl, feedPath)
  const lastBuildDate =
    items
      .map((item) => item.updatedAt || item.publishedAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || new Date().toISOString()

  const serializedItems = items
    .map((item) => {
      const itemUrl = joinSiteUrl(resolvedSiteUrl, item.path)
      const categories = (item.categories || [])
        .map((category) => `<category>${escapeXml(category)}</category>`)
        .join('')

      return `<item>
<title>${escapeXml(item.title)}</title>
<link>${itemUrl}</link>
<guid isPermaLink="true">${itemUrl}</guid>
<pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
${item.description ? `<description>${escapeXml(item.description)}</description>` : ''}
${categories}
</item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(title)}</title>
<link>${resolvedSiteUrl}</link>
<description>${escapeXml(description)}</description>
<language>${escapeXml(language)}</language>
<lastBuildDate>${new Date(lastBuildDate).toUTCString()}</lastBuildDate>
<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${serializedItems}
</channel>
</rss>`
}

export function buildPostRssItems(posts: Blog[]) {
  return posts
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map<RssItem>((post) => ({
      title: post.title,
      path: `/${post.path}`,
      description: post.summary,
      publishedAt: post.date,
      updatedAt: post.lastmod || post.date,
      categories: post.tags || [],
    }))
}

export function createRssResponse(xml: string) {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

export function buildFeedTitle(settings: SiteSettings, suffix?: string) {
  const siteTitle = settings.title || siteMetadata.title
  return suffix ? `${siteTitle} - ${suffix}` : siteTitle
}
