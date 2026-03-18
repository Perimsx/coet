import { Metadata } from 'next'

import { genPageMetadata } from '@/app/seo'
import AboutProfileShowcase from '@/features/content/components/AboutProfileShowcase'
import { getAboutPageData } from '@/features/content/lib/about-page'
import { buildAboutProfileViewModel } from '@/features/content/lib/about-profile'
import { renderMarkdownToHtml } from '@/features/content/lib/markdown-renderer'
import { getServerDictionary } from '@/shared/utils/i18n-server'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getServerDictionary()
  return genPageMetadata({
    title: dictionary.about.title,
    pathname: '/about',
  })
}

export default async function AboutPage() {
  const data = await getAboutPageData()
  const html = await renderMarkdownToHtml(data.content || '')
  const profile = buildAboutProfileViewModel(data.frontmatter)

  return <AboutProfileShowcase profile={profile} contentHtml={html} />
}
