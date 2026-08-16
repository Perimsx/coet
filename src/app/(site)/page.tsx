import type { Blog } from 'contentlayer/generated'
import { Metadata } from 'next'
import { allCoreContent, sortPosts, type CoreContent } from 'pliny/utils/contentlayer'
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
  let siteUrl = ''
  let settingsTitle = ''
  let presentation: Awaited<ReturnType<typeof getSitePresentation>>
  let profile: ReturnType<typeof buildAboutProfileViewModel>
  let posts: CoreContent<Blog>[] = []

  try {
    const seoCtx = await getSeoContext()
    siteUrl = seoCtx.siteUrl
    settingsTitle = seoCtx.settings.title
    presentation = await getSitePresentation()
    const aboutData = await getAboutPageData()
    profile = buildAboutProfileViewModel(aboutData.frontmatter)
    const allBlogs = (await getDatabaseBlogs()) || getAllBlogs()
    posts = allCoreContent(sortPosts(allBlogs))
  } catch {
    return <div>Failed to load page data.</div>
  }

  const breadcrumbJsonLd = genBreadcrumbJsonLd(
    [{ name: settingsTitle, item: '/' }],
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
}
