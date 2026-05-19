import { siteMetadata } from '@/blog.config'
import { getSiteSettings } from '@/server/site-settings'
import { getSitePresentation } from '@/features/site/services/site-presentation'
import Link from '@/shared/components/Link'
import BrandLogo from '@/shared/media/BrandLogo'
import DesktopNavLinks from './DesktopNavLinks'
import MobileNav from './MobileNav'
import SearchButton from '@/features/search/components/SearchButton'
import ThemeSwitch from './ThemeSwitch'
import LanguageSwitch from './LanguageSwitch'

import { getAllBlogs } from '@/features/content/lib/contentlayer-adapter'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { resolvePostCategories } from '@/features/content/lib/post-categories'
import { slug } from 'github-slugger'
import { getPublishedFriends } from '@/features/friends/lib/friends'
import HeaderClient from './HeaderClient'

const Header = async () => {
  const fixedNav = siteMetadata.stickyNav
  const settings = await getSiteSettings()
  const presentation = await getSitePresentation()
  const headerTitle = settings.headerTitle || siteMetadata.headerTitle

  const allBlogs = getAllBlogs().filter(post => post.draft !== true)
  const posts = allCoreContent(sortPosts(allBlogs))
  const postCount = posts.length
  
  const tagSet = new Set<string>()
  const categorySet = new Set<string>()
  
  allBlogs.forEach((post) => {
    post.tags?.forEach(t => tagSet.add(slug(t)))
    const cats = resolvePostCategories(post.categories, post._raw.sourceFilePath)
    cats.forEach(c => categorySet.add(c))
  })

  const friendsParams = await getPublishedFriends()

  const repoPath = siteMetadata.siteRepo.replace('https://github.com/', '')
  let commitCount = 0
  try {
    const res = await fetch(`https://api.github.com/repos/${repoPath}/commits?per_page=1`, {
      next: { revalidate: 3600 },
      headers: process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}
    })
    
    const linkHeader = res.headers.get('link')
    if (linkHeader) {
      const match = linkHeader.match(/page=(\d+)>; rel="last"/)
      if (match) {
        commitCount = parseInt(match[1], 10)
      }
    } else if (res.ok) {
      const data = await res.json()
      commitCount = Array.isArray(data) ? data.length : 0
    }
  } catch (e) {
    console.error('Failed to fetch commit count in header', e)
  }

  const stats = {
    postCount,
    tagCount: tagSet.size,
    categoryCount: categorySet.size,
    friendCount: friendsParams.length,
    commitCount,
  }

  const logo = (
    <Link href="/" aria-label={headerTitle} className="group relative flex shrink-0 items-center gap-2.5 outline-none transition-all duration-300 hover:opacity-80 active:scale-95">
      <BrandLogo className="relative h-8 w-8 shrink-0 sm:h-[34px] sm:w-[34px]" alt={headerTitle} />
      <span className="flex items-start text-lg sm:text-xl font-black tracking-tighter text-foreground">
        {siteMetadata.title}
        <span className="ml-0.5 mt-0.5 text-[10px] font-medium leading-none text-muted-foreground/50">©</span>
      </span>
    </Link>
  )

  return (
    <>
      <HeaderClient 
        fixedNav={!!fixedNav}
        logo={logo}
        centerContent={<DesktopNavLinks links={presentation.navigation.links} />}
        links={presentation.navigation.links}
        stats={stats}
        enableSearch={presentation.header.featureFlags.enableSearch}
        enableThemeSwitch={presentation.header.featureFlags.enableThemeSwitch}
        navContent={
          <div className="flex items-center gap-1.5 sm:gap-3">
            {presentation.header.featureFlags.enableSearch ? <SearchButton /> : null}
            {presentation.header.featureFlags.enableSuggestion ? <LanguageSwitch /> : null}
            {presentation.header.featureFlags.enableThemeSwitch ? <ThemeSwitch /> : null}
          </div>
        }
        mobileMenu={
          <MobileNav
            links={presentation.navigation.links}
            menuLabel={presentation.navigation.mobileMenuLabel}
          />
        }
      />
    </>
  )
}

export default Header
