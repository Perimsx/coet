import { Metadata } from 'next'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { getAllBlogs, getTagData, getCategoryData } from '@/features/content/lib/contentlayer-adapter'
import { genBreadcrumbJsonLd, genPageMetadata } from '@/app/seo'
import Hero from '@/features/site/components/Hero'
import HomeLatestContent from '@/features/site/components/HomeLatestContent'
import { getAboutPageData } from '@/features/content/lib/about-page'
import { buildAboutProfileViewModel } from '@/features/content/lib/about-profile'
import { getSeoContext } from '@/features/site/lib/seo'
import { getSitePresentation } from '@/features/site/services/site-presentation'
import TerminalGreeting from '@/features/site/components/TerminalGreeting'

export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: "首页",
    description: "Chen Guitao (kerntau) | 信息安全专业毕业生。专注技术研究、开发实战与知识整理，记录成长，分享价值。",
    pathname: '/',
  })
}

export default async function HomePage() {
  const { siteUrl, settings } = await getSeoContext()
  const presentation = await getSitePresentation()
  const aboutData = await getAboutPageData()
  const profile = buildAboutProfileViewModel(aboutData.frontmatter)
  const allBlogs = getAllBlogs()
  const posts = allCoreContent(sortPosts(allBlogs))
  const tagData = getTagData()
  const categoryData = getCategoryData()

  const breadcrumbJsonLd = genBreadcrumbJsonLd([
    { name: settings.title, item: '/' }
  ], siteUrl)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Hero socials={profile.socials} presentation={presentation.hero} greetingElement={<TerminalGreeting />} />
      <HomeLatestContent 
        posts={posts} 
        tagData={tagData}
        categoryData={categoryData}
        labels={presentation.home}
      />
    </>
  )
}
