import { Metadata } from 'next'

import { genPageMetadata } from '@/app/seo'
import { getAboutPageData } from '@/features/content/lib/about-page'
import { buildAboutProfileViewModel } from '@/features/content/lib/about-profile'
import { renderMarkdownToHtml } from '@/features/content/lib/markdown-renderer'
import AboutPageShell from './AboutPageShell'

export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: 'About',
    description: 'About kerntau — full-stack engineer with a focus on security, systems, and clean architecture.',
    pathname: '/about',
  })
}

export default async function AboutPage() {
  const [zhData, enData] = await Promise.all([
    getAboutPageData('zh'),
    getAboutPageData('en'),
  ])

  const [zhHtml, enHtml] = await Promise.all([
    renderMarkdownToHtml(zhData.content || ''),
    renderMarkdownToHtml(enData.content || ''),
  ])

  const zhProfile = buildAboutProfileViewModel(zhData.frontmatter, 'zh')
  const enProfile = buildAboutProfileViewModel(enData.frontmatter, 'en')

  return (
    <AboutPageShell
      zhProfile={zhProfile}
      enProfile={enProfile}
      zhHtml={zhHtml}
      enHtml={enHtml}
    />
  )
}
