import { Metadata } from 'next'
import { allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { genPageMetadata } from '@/app/seo'
import ArchiveClient from '@/features/archive/components/ArchiveClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: "归档",
    description: "Chen Guitao (kerntau) | 文章归档。整理并记录技术研究、开发实战与成长心得，记录成长，分享价值。",
    pathname: '/archive',
  })
}

export default function ArchivePage() {
  const posts = allCoreContent(allBlogs)
  
  return <ArchiveClient posts={posts} />
}
