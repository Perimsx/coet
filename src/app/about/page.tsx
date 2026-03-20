import { Metadata } from 'next'

import { genPageMetadata } from '@/app/seo'
import AboutProfileShowcase from '@/features/content/components/AboutProfileShowcase'
import { getAboutPageData } from '@/features/content/lib/about-page'
import { buildAboutProfileViewModel } from '@/features/content/lib/about-profile'
import { renderMarkdownToHtml } from '@/features/content/lib/markdown-renderer'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: "关于",
    description: "关于 Chen Guitao (kerntau)。记录信息安全专业研究、全栈开发实战与个人成长心得。",
    pathname: '/about',
  })
}

export default async function AboutPage() {
  const data = await getAboutPageData()
  const html = await renderMarkdownToHtml(data.content || '')
  const profile = buildAboutProfileViewModel(data.frontmatter)

  return <AboutProfileShowcase profile={profile} contentHtml={html} />
}
