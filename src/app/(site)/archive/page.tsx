import { Metadata } from 'next'
import { allCoreContent } from 'pliny/utils/contentlayer'
import { genPageMetadata } from '@/features/site/lib/seo'
import ArchiveClient from '@/features/archive/components/ArchiveClient'
import { getAllBlogs } from '@/features/content/lib/contentlayer-adapter'


export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: "归档",
    description: "按时间线浏览 kerntau 博客的全部文章归档。快速查找历史技术笔记、开发实战记录与学习总结。",
    pathname: '/archive',
  })
}

export default function ArchivePage() {
  const posts = allCoreContent(getAllBlogs())
  
  return <ArchiveClient posts={posts} />
}
