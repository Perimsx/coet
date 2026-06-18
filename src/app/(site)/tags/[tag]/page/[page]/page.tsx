import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import ListLayout from '@/features/content/layouts/ListLayoutWithTags'
import { allBlogs } from 'contentlayer/generated'
import tagData from '@/generated/content/tag-data.json'
import { Metadata } from 'next'
import { genPageMetadata } from '@/app/seo'
import { normalizeTagToSlug, getTagLabel } from '@/features/content/lib/post-categories'

export const dynamic = "force-static";
export const dynamicParams = false;

const POSTS_PER_PAGE = 5

export async function generateStaticParams() {
  const tagKeys = Object.keys(tagData as Record<string, number>)
  const paths: { tag: string; page: string }[] = []

  tagKeys.forEach((tag) => {
    const count = (tagData as Record<string, number>)[tag]
    const totalPages = Math.ceil(count / POSTS_PER_PAGE)
    for (let i = 1; i <= totalPages; i++) {
      paths.push({
        tag: normalizeTagToSlug(tag),
        page: i.toString(),
      })
    }
  })

  return paths
}

export async function generateMetadata(props: {
  params: Promise<{ tag: string; page: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tagParam = params.tag
  const allTagKeys = Object.keys(tagData as Record<string, number>)
  const tag = allTagKeys.find(t => normalizeTagToSlug(t) === tagParam) || tagParam
  const displayName = getTagLabel(tag)
  const pageNumber = Number.parseInt(params.page, 10)

  return genPageMetadata({
    title: `${displayName} - 第 ${pageNumber} 页`,
    description: `kerntau 博客「${displayName}」标签下的文章列表，当前第 ${pageNumber} 页。`,
    pathname: `/tags/${tagParam}/page/${pageNumber}`,
  })
}

export default async function TagPage(props: { params: Promise<{ tag: string; page: string }> }) {
  const params = await props.params
  const tagParam = params.tag
  const allTagKeys = Object.keys(tagData as Record<string, number>)
  const tag = allTagKeys.find(t => normalizeTagToSlug(t) === tagParam) || tagParam
  const displayName = getTagLabel(tag)

  const tagLabelMap = Object.fromEntries(
    allTagKeys.map((key) => [normalizeTagToSlug(key), getTagLabel(key)])
  )
  const filteredPosts = allCoreContent(
    sortPosts(allBlogs.filter((post) =>
      post.tags && post.tags.some(t => normalizeTagToSlug(t) === tagParam)
    ))
  )
  return (
    <ListLayout
      posts={filteredPosts}
      title={displayName}
      tagLabelMap={tagLabelMap}
    />
  )
}
