import { Metadata } from 'next'
import { allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { genPageMetadata } from '@/app/seo'
import ArchiveClient from '@/features/archive/components/ArchiveClient'


export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: "归档",
    description: "按时间线浏览 kerntau 博客的全部文章归档。快速查找历史技术笔记、开发实战记录与学习总结。",
    pathname: '/archive',
  })
}

export default function ArchivePage() {
  const posts = allCoreContent(allBlogs)
  
  return <ArchiveClient posts={posts} />
}
