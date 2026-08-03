import { Metadata } from 'next'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { getAllBlogs } from '@/features/content/lib/contentlayer-adapter'
import { getDatabaseBlogs } from '@/features/content/lib/database-content-source'
import { genBreadcrumbJsonLd, genPageMetadata } from '@/features/site/lib/seo'
import Hero from '@/features/site/components/Hero'
import HomeLatestContent from '@/features/site/components/HomeLatestContent'
import { getSeoContext } from '@/features/site/lib/seo'
import { getSitePresentation } from '@/features/site/services/site-presentation'
import { getAboutPageData } from '@/features/content/lib/about-page'
import { buildAboutProfileViewModel } from '@/features/content/lib/about-profile'
import dynamic from 'next/dynamic'

const SplashScreen = dynamic(
  () => import('@/features/site/components/SplashScreen')
)
const SiteNotice = dynamic(
  () => import('@/features/site/components/SiteNotice')
)

export async function generateMetadata(): Promise<Metadata> {
  const { siteTitle, description } = await getSeoContext()
  return genPageMetadata({
    title: siteTitle,
    description,
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
    const allBlogs = (await getDatabaseBlogs()) || getAllBlogs()
    const posts = allCoreContent(sortPosts(allBlogs))

    const breadcrumbJsonLd = genBreadcrumbJsonLd(
      [{ name: settings.title, item: '/' }],
      siteUrl
    )

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
