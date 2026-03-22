import siteMetadata from '@/config/site'
import { getSiteSettings } from '@/server/site-settings'
import { getSitePresentation } from '@/features/site/services/site-presentation'
import Link from '@/shared/components/Link'
import BrandLogo from '@/shared/media/BrandLogo'
import DesktopNavLinks from './DesktopNavLinks'
import MobileNav from './MobileNav'
import SearchButton from '@/features/search/components/SearchButton'
import ThemeSwitch from './ThemeSwitch'
import SuggestionBox from './SuggestionBox'

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

  const allBlogs = getAllBlogs()
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

  const stats = {
    postCount,
    tagCount: tagSet.size,
    categoryCount: categorySet.size,
    friendCount: friendsParams.length,
  }

  const logo = (
    <Link href="/" aria-label={headerTitle} className="group relative flex shrink-0 items-center justify-center outline-none rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ring-2 ring-transparent hover:ring-primary-500/15 dark:hover:ring-primary-400/15 hover:ring-offset-2 hover:ring-offset-background">
      <BrandLogo className="relative h-8 w-8 shrink-0 sm:h-[34px] sm:w-[34px] rounded-full shadow-sm border border-border/50" alt={headerTitle} />
    </Link>
  )

  return (
    <>
      {fixedNav && <div className="h-20 sm:h-24" aria-hidden />}
      <HeaderClient 
        fixedNav={!!fixedNav}
        logo={logo}
        centerContent={<DesktopNavLinks links={presentation.navigation.links} />}
        stats={stats}
        navContent={
          <div className="flex items-center gap-1.5 sm:gap-3">
            {presentation.header.featureFlags.enableSearch ? <SearchButton /> : null}
            {presentation.header.featureFlags.enableSuggestion ? <SuggestionBox /> : null}
            {presentation.header.featureFlags.enableThemeSwitch ? <ThemeSwitch /> : null}
            <div className="sm:hidden flex items-center">
               <MobileNav
                 links={presentation.navigation.links}
                 menuLabel={presentation.navigation.mobileMenuLabel}
               />
            </div>
          </div>
        }
      />
    </>
  )
}

export default Header
