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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return genPageMetadata({
    title: settings.title,
    description: settings.description,
    pathname: '/',
    absoluteTitle: true,
  })
}

export default async function HomePage() {
  const { siteUrl, settings } = await getSeoContext()
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
      <Hero socials={profile.socials} />
      <HomeLatestContent 
        posts={posts} 
        tagData={tagData}
        categoryData={categoryData}
      />
    </>
  )
}
