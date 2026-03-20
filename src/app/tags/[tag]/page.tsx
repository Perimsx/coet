import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import ListLayout from '@/features/content/layouts/ListLayoutWithTags'
import { getAllBlogs, getTagData } from '@/features/content/lib/contentlayer-adapter'
import { genPageMetadata } from '@/app/seo'
import { Metadata } from 'next'
import { getServerDictionary } from '@/shared/utils/i18n-server'

export const dynamic = 'force-dynamic'

const POSTS_PER_PAGE = 5

export async function generateMetadata(props: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tag = decodeURI(params.tag)
  
  return await genPageMetadata({
    title: tag,
    description: `欢迎查看 kerntau 站内关于 [${tag}] 标签的所有技术文章。这里汇集了该技术栈相关的实战心得、深度解析与全栈开发笔记，致力于为您提供高质量的 ${tag} 专题内容索引。`,
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
  const tag = decodeURI(params.tag)
  const rawTitle = tag[0].toUpperCase() + tag.split(' ').join('-').slice(1)

  const allBlogs = getAllBlogs()
  const tagData = getTagData()
  
  const allTagKeys = Object.keys(tagData)
  const tagLabelMap = Object.fromEntries(
    allTagKeys.map((key) => [key, key])
  )
  const filteredPosts = allCoreContent(
    sortPosts(allBlogs.filter((post) => post.tags && post.tags.map((t) => slug(t)).includes(tag)))
  )
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = filteredPosts.slice(0, POSTS_PER_PAGE)
  const pagination = {
    currentPage: 1,
    totalPages: totalPages,
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
