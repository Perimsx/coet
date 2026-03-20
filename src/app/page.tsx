import { Metadata } from 'next'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { getAllBlogs, getTagData, getCategoryData } from '@/features/content/lib/contentlayer-adapter'
import { genBreadcrumbJsonLd, genPageMetadata } from '@/app/seo'
import Hero from '@/features/site/components/Hero'
import HomeLatestContent from '@/features/site/components/HomeLatestContent'
import { getSiteSettings } from '@/server/site-settings'
import { getAboutPageData } from '@/features/content/lib/about-page'
import { buildAboutProfileViewModel } from '@/features/content/lib/about-profile'
import { getSeoContext } from '@/features/site/lib/seo'
import { getSitePresentation } from '@/features/site/services/site-presentation'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const siteTitle = settings.title
  const siteRole = settings.heroRole || ""
  
  return genPageMetadata({
    title: siteTitle,
    description: `欢迎来到 ${siteTitle} 的个人网站。这里是 ${siteRole} 的技术笔记、心得分享与项目实战记录。`,
    pathname: '/',
    absoluteTitle: true,
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
      <Hero socials={profile.socials} presentation={presentation.hero} />
      <HomeLatestContent 
        posts={posts} 
        tagData={tagData}
        categoryData={categoryData}
        labels={presentation.home}
      />
    </>
  )
}
