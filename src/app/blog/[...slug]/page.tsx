import '@/app/prism.css'
// import 'katex/dist/katex.css'

import { sortPosts, coreContent, allCoreContent } from 'pliny/utils/contentlayer'
import { getAllBlogs, getAllAuthors } from '@/features/content/lib/contentlayer-adapter'
import type { Authors, Blog } from 'contentlayer/generated'
import PostSimple from '@/features/content/layouts/PostSimple'
import PostLayout from '@/features/content/layouts/PostLayout'
import PostBanner from '@/features/content/layouts/PostBanner'
import { Metadata } from 'next'
import siteMetadata from '@/config/site'
import { notFound } from 'next/navigation'
import PostBodyRenderer from '@/features/content/components/PostBodyRenderer'
import brandingConfig from '@/config/branding'
import { genBreadcrumbJsonLd, joinSiteUrl, normalizeSiteUrl, resolveImageUrl } from '@/features/site/lib/seo'
import { getSiteSettings } from '@/server/site-settings'

const defaultLayout = 'PostLayout'
const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  const settings = await getSiteSettings()
  const siteUrl = normalizeSiteUrl(settings.siteUrl || siteMetadata.siteUrl)
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  const allBlogs = getAllBlogs()
  const allAuthors = getAllAuthors()
  const post = allBlogs.find((p) => p.slug === slug)
  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })
  if (!post) {
    return
  }

  const publishedAt = new Date(post.date).toISOString()
  const modifiedAt = new Date(post.lastmod || post.date).toISOString()
  const authors = authorDetails.map((author) => author.name)
  
  const defaultBanner = settings.socialBanner || siteMetadata.socialBanner
  let imageList = [defaultBanner]
  
  if (post.images) {
    imageList = typeof post.images === 'string' ? [post.images] : post.images
  }
  
  const ogImages = imageList.map((img) => {
    return {
      url: resolveImageUrl(siteUrl, img) || joinSiteUrl(siteUrl, '/'),
    }
  })
  const canonicalUrl = joinSiteUrl(siteUrl, `/${post.path}`)

  return {
    title: { absolute: post.title },
    description: post.summary,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.summary,
      siteName: settings.title,
      locale: 'zh_CN',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: canonicalUrl,
      images: ogImages,
      authors: authors.length > 0 ? authors : [settings.title],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: imageList,
    },
  }
}

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  // 生产环境中过滤草稿
  const allBlogs = getAllBlogs()
  const allAuthors = getAllAuthors()
  const sortedCoreContents = allCoreContent(sortPosts(allBlogs))
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slug)
  if (postIndex === -1) {
    return notFound()
  }

  const prev = sortedCoreContents[postIndex + 1]
  const next = sortedCoreContents[postIndex - 1]
  const post = allBlogs.find((p) => p.slug === slug) as Blog

  const settings = await getSiteSettings()
  const siteUrl = normalizeSiteUrl(settings.siteUrl || siteMetadata.siteUrl)
  const publishedAt = new Date(post.date).toISOString()
  const modifiedAt = new Date(post.lastmod || post.date).toISOString()
  
  const defaultBanner = settings.socialBanner || siteMetadata.socialBanner
  let imageList = [defaultBanner]
  if (post.images) {
    imageList = typeof post.images === 'string' ? [post.images] : post.images
  }
  const ogImages = imageList.map((img) => ({
    url: resolveImageUrl(siteUrl, img) || joinSiteUrl(siteUrl, '/'),
  }))

  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })

  const mainContent = {
    ...coreContent(post),
  }

  const blogJsonLd = {
    ...post.structuredData,
    headline: post.title,
    description: post.summary,
    image: ogImages.map((img) => img.url),
    datePublished: publishedAt,
    dateModified: modifiedAt,
    author: authorDetails.map((author) => ({
      '@type': 'Person',
      name: author.name,
      url: author.github || author.twitter || siteUrl,
    })),
    publisher: {
      '@type': 'Organization',
      name: settings.title,
      logo: {
        '@type': 'ImageObject',
        url: joinSiteUrl(siteUrl, brandingConfig.logo),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': joinSiteUrl(siteUrl, `/${post.path}`),
    },
    inLanguage: 'zh-CN',
  }

  const breadcrumbJsonLd = genBreadcrumbJsonLd([
    { name: '首页', item: '/' },
    { name: '博客', item: '/blog' },
    { name: post.title, item: `/${post.path}` },
  ], siteUrl)

  const Layout = layouts[post.layout || defaultLayout]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Layout
        content={mainContent}
        authorDetails={authorDetails}
        toc={post.toc}
        next={next}
        prev={prev}
      >
        <PostBodyRenderer code={post.body.code} toc={post.toc} />
      </Layout>
    </>
  )
}

