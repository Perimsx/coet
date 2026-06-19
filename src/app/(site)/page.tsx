import { Metadata } from 'next'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { getAllBlogs } from '@/features/content/lib/contentlayer-adapter'
import { genBreadcrumbJsonLd, genPageMetadata } from '@/app/seo'
import Hero from '@/features/site/components/Hero'
import HomeLatestContent from '@/features/site/components/HomeLatestContent'
import { getSeoContext } from '@/features/site/lib/seo'
import { getSitePresentation } from '@/features/site/services/site-presentation'
import { getAboutPageData } from '@/features/content/lib/about-page'
import { buildAboutProfileViewModel } from '@/features/content/lib/about-profile'
import dynamic from 'next/dynamic'

const SplashScreen = dynamic(() => import('@/features/site/components/SplashScreen'))
const SiteNotice = dynamic(() => import('@/features/site/components/SiteNotice'))

export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: "首页 | 序栈",
    description: "在有序的世界里，寻一处生活的归栈。用理性梳理日常，用技术温柔时光，不慌不忙，自在生长。这里是 Chen Guitao (kerntau) 的技术与生活空间。",
    pathname: '/',
    absoluteTitle: true,
  })
}

export default async function HomePage() {
  try {
    const { siteUrl, settings } = await getSeoContext()
    const presentation = await getSitePresentation()
    const aboutData = await getAboutPageData()
    const profile = buildAboutProfileViewModel(aboutData.frontmatter)
    const allBlogs = getAllBlogs()
    const posts = allCoreContent(sortPosts(allBlogs))

    const breadcrumbJsonLd = genBreadcrumbJsonLd([
      { name: settings.title, item: '/' }
    ], siteUrl)

    return (
      <>
        <SplashScreen />
        <SiteNotice />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <Hero presentation={presentation.hero} socials={profile.socials} />
        <HomeLatestContent posts={posts} />
      </>
    )
  } catch {
    return <div>Failed to load page data.</div>
  }
}
