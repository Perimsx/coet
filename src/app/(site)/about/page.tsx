import { Metadata } from 'next'

import { genPageMetadata } from '@/app/seo'
import AboutProfileShowcase from '@/features/content/components/AboutProfileShowcase'
import { getAboutPageData } from '@/features/content/lib/about-page'
import { buildAboutProfileViewModel } from '@/features/content/lib/about-profile'
import { renderMarkdownToHtml } from '@/features/content/lib/markdown-renderer'

export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: "关于",
    description: "了解 Chen Guitao (kerntau) — 信息安全专业背景，从事全栈开发。这里是个人简介、技术栈、项目经历与联系方式。",
    pathname: '/about',
  })
}

export default async function AboutPage() {
  const data = await getAboutPageData()
  const html = await renderMarkdownToHtml(data.content || '')
  const profile = buildAboutProfileViewModel(data.frontmatter)

  return <AboutProfileShowcase profile={profile} contentHtml={html} />
}
