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
    description: "关于 Chen Guitao (kerntau) 的个人详细简介。包括职业规划、技术栈演变图谱、及我对信息安全与 Web 开发深度融合的思考。",
    pathname: '/about',
  })
}

export default async function AboutPage() {
  const data = await getAboutPageData()
  const html = await renderMarkdownToHtml(data.content || '')
  const profile = buildAboutProfileViewModel(data.frontmatter)

  return <AboutProfileShowcase profile={profile} contentHtml={html} />
}
