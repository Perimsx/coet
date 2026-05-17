import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import ListLayout from '@/features/content/layouts/ListLayoutWithTags'
import { getAllBlogs, getTagData } from '@/features/content/lib/contentlayer-adapter'
import { genPageMetadata } from '@/app/seo'
import { Metadata } from 'next'
import { getServerDictionary } from '@/shared/utils/i18n-server'

export async function generateStaticParams() {
  const tagData = getTagData()
  const tagKeys = Object.keys(tagData)
  return tagKeys.map((tag) => ({
    tag: encodeURIComponent(slug(tag)),
  }))
}

const POSTS_PER_PAGE = 5

export async function generateMetadata(props: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tagParam = decodeURIComponent(params.tag)
  const tagData = getTagData()
  const tagKeys = Object.keys(tagData)
  const tag = tagKeys.find(t => slug(t) === tagParam) || tagParam
  
  return await genPageMetadata({
    title: tag,
    description: `查看 kerntau 博客中标签为「${tag}」的所有文章。包含该方向的技术笔记、实战记录与学习总结。`,
    pathname: `/tags/${encodeURIComponent(tag)}`,
    alternates: {
      types: {
        'application/rss+xml': `/tags/${encodeURIComponent(tag)}/feed.xml`,
      },
    },
  })
}

export default async function TagPage(props: { params: Promise<{ tag: string }> }) {
  const dictionary = await getServerDictionary()
  const params = await props.params
  const tagParam = decodeURIComponent(params.tag)
  
  const allBlogs = getAllBlogs()
  const tagData = getTagData()
  const allTagKeys = Object.keys(tagData)
  
  // 找回原始标签名（处理 slug 匹配）
  const tag = allTagKeys.find(t => slug(t) === tagParam) || tagParam
  const rawTitle = tag[0].toUpperCase() + tag.split(' ').join('-').slice(1)

  const tagLabelMap = Object.fromEntries(
    allTagKeys.map((key) => [key, key])
  )
  const filteredPosts = allCoreContent(
    sortPosts(allBlogs.filter((post) => 
      post.tags && post.tags.some(t => t === tag || slug(t) === tagParam)
    ))
  )
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = filteredPosts.slice(0, POSTS_PER_PAGE)
  const pagination = {
    currentPage: 1,
    totalPages: totalPages || 1,
  }

  return (
    <ListLayout
      posts={filteredPosts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title={rawTitle || dictionary.tagsPage.title}
      tagLabelMap={tagLabelMap}
      tagData={tagData}
    />
  )
}
