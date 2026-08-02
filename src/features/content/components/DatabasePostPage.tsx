import { coreContent } from 'pliny/utils/contentlayer'
import type { Authors, Blog } from 'contentlayer/generated'
import PostLayout from '@/features/content/layouts/PostLayout'
import PostBodyRenderer from '@/features/content/components/PostBodyRenderer'
import { brandingConfig, siteMetadata } from '@/blog.config'
import { genBreadcrumbJsonLd } from '@/features/site/lib/seo'
import { joinSiteUrl, normalizeSiteUrl, resolveImageUrl } from '@/shared/utils/site-url'
import type { DatabasePost } from '@/features/content/lib/database-content-source'
import { compileDatabaseMDX, databaseToc } from '@/features/content/lib/database-mdx'

export async function DatabasePostPage({ post, authors }: { post: DatabasePost; authors: Authors[] }) {
  const date = post.publishedAt || post.updatedAt
  const content = { title: post.title, slug: post.slug, path: `blog/${post.slug}`, date, lastmod: post.updatedAt, summary: post.summary, tags: post.tags.map(tag => tag.name), categories: post.categoryName ? [post.categoryName] : [], images: post.coverUrl ? [post.coverUrl] : [], draft: false } as unknown as Blog
  const siteUrl = normalizeSiteUrl(siteMetadata.siteUrl)
  const canonicalUrl = joinSiteUrl(siteUrl, `/blog/${post.slug}`)
  const image = resolveImageUrl(siteUrl, post.coverUrl || siteMetadata.socialBanner) || joinSiteUrl(siteUrl, '/')
  const authorDetails = authors.filter(author => author.slug === 'default').map(author => coreContent(author))
  const toc = databaseToc(post.content)
  const code = await compileDatabaseMDX(post.content)
  const blogJsonLd = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.summary, image: [image], datePublished: new Date(date).toISOString(), dateModified: new Date(post.updatedAt).toISOString(), author: authorDetails.map(author => ({ '@type': 'Person', name: author.name, url: author.github || author.twitter || siteUrl })), publisher: { '@type': 'Organization', name: siteMetadata.title, logo: { '@type': 'ImageObject', url: joinSiteUrl(siteUrl, brandingConfig.logo) } }, mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl }, keywords: post.tags.map(tag => tag.name), inLanguage: post.language === 'en' ? 'en' : 'zh-CN' }
  const breadcrumbJsonLd = genBreadcrumbJsonLd([{ name: '首页', item: '/' }, { name: '博客', item: '/blog' }, { name: post.title, item: `/blog/${post.slug}` }], siteUrl)
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} /><PostLayout content={coreContent(content)} authorDetails={authorDetails} toc={toc}><PostBodyRenderer code={code} toc={toc} /></PostLayout></>
}
