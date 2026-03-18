import { getTagData } from '@/features/content/lib/contentlayer-adapter'
import { genPageMetadata } from '@/app/seo'
import TagsClient from './TagsClient'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return await genPageMetadata({
    title: 'Tags',
    description: 'Things I blog about',
    pathname: '/tags',
  })
}

export default async function TagsPage() {
  const tagData = getTagData()
  
  return (
    <TagsClient tagCounts={tagData} />
  )
}
