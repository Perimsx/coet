import { Metadata } from 'next'
import { allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { genPageMetadata } from '@/app/seo'
import ArchiveClient from '@/features/archive/components/ArchiveClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: '文章归档',
    description: "Chen Guitao (kerntau) 的历年技术归档。梳理从 2025 年至今全栈开发与信息安全实战历程，见证技术积累与知识成长的历史轨迹。",
    pathname: '/archive',
  })
}

export default function ArchivePage() {
  const posts = allCoreContent(allBlogs)
  
  return <ArchiveClient posts={posts} />
}
