import { Metadata } from 'next'

import { genPageMetadata } from '@/app/seo'
import AboutProfileShowcase from '@/features/content/components/AboutProfileShowcase'
import { getAboutPageData } from '@/features/content/lib/about-page'
import { buildAboutProfileViewModel } from '@/features/content/lib/about-profile'
import { renderMarkdownToHtml } from '@/features/content/lib/markdown-renderer'
import { cookies } from 'next/headers'

export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: 'About',
    description: 'About kerntau — full-stack engineer with a focus on security, systems, and clean architecture.',
    pathname: '/about',
  })
}

export default async function AboutPage() {
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get('theme')?.value
  const locale = cookieStore.get('locale')?.value as 'zh' | 'en' || 'zh'

  const data = await getAboutPageData(locale)
  const html = await renderMarkdownToHtml(data.content || '')
  const profile = buildAboutProfileViewModel(data.frontmatter)

  return <AboutProfileShowcase profile={profile} contentHtml={html} locale={locale} />
}
