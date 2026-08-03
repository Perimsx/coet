import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import ListLayout from '@/features/content/layouts/ListLayoutWithTags'
import {
  getAllBlogs,
  getTagData,
} from '@/features/content/lib/contentlayer-adapter'
import { genPageMetadata } from '@/features/site/lib/seo'
import { Metadata } from 'next'
import { getServerDictionary } from '@/shared/utils/i18n-server'
import {
  normalizeTagToSlug,
  getTagLabel,
} from '@/features/content/lib/post-categories'
import {
  getDatabaseBlogs,
  getDatabaseTagCounts,
} from '@/features/content/lib/database-content-source'

export async function generateStaticParams() {
  const tagData = getTagData()
  const tagKeys = Object.keys(tagData)
  return tagKeys.map((tag) => ({
    tag: normalizeTagToSlug(tag),
  }))
}

export async function generateMetadata(props: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tagParam = params.tag
  const tagData = getTagData()
  const tagKeys = Object.keys(tagData)
  const tag =
    tagKeys.find((t) => normalizeTagToSlug(t) === tagParam) || tagParam
  const displayName = getTagLabel(tag, 'zh')

  return await genPageMetadata({
    title: displayName,
    description: `查看 Kerntau 博客中标签为「${displayName}」的所有文章。包含该方向的技术笔记、实战记录与学习总结。`,
    pathname: `/tags/${tagParam}`,
    alternates: {
      types: {
        'application/rss+xml': `/tags/${tagParam}/feed.xml`,
      },
    },
  })
}

export default async function TagPage(props: {
  params: Promise<{ tag: string }>
}) {
  const dictionary = await getServerDictionary()
  const params = await props.params
  const tagParam = params.tag

  const allBlogs = (await getDatabaseBlogs()) || getAllBlogs()
  const tagData = (await getDatabaseTagCounts()) || getTagData()
  const allTagKeys = Object.keys(tagData)

  // 通过英文 slug 反查原始标签名
  const tag =
    allTagKeys.find((t) => normalizeTagToSlug(t) === tagParam) || tagParam
  const displayName = getTagLabel(tag, 'zh')

  const filteredPosts = allCoreContent(
    sortPosts(
      allBlogs.filter(
        (post) =>
          post.tags &&
          post.tags.some(
            (t) =>
              t === tagParam ||
              t === tag ||
              normalizeTagToSlug(t) === tagParam ||
              (tag && normalizeTagToSlug(t) === normalizeTagToSlug(tag))
          )
      )
    )
  )
  return (
    <ListLayout
      posts={filteredPosts}
      title={displayName || dictionary.tagsPage.title}
    />
  )
}
