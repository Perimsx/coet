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

  const stats = {
    postCount,
    tagCount: tagSet.size,
    categoryCount: categorySet.size,
  }

  const logo = (
    <Link href="/" aria-label={headerTitle} className="group relative flex shrink-0 items-center justify-center outline-none">
      <div className="absolute -inset-1.5 sm:-inset-2 rounded-full border border-primary-500/0 bg-primary-500/0 transition-all duration-500 group-hover:border-primary-500/20 group-hover:bg-primary-500/10 dark:group-hover:border-primary-400/20 dark:group-hover:bg-primary-400/10" />
      <BrandLogo className="relative h-8 w-8 shrink-0 sm:h-[38px] sm:w-[38px] transition-transform duration-500 group-hover:scale-105 group-active:scale-95 shadow-sm rounded-full" alt={headerTitle} />
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
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              {presentation.header.featureFlags.enableSearch ? <SearchButton /> : null}
              {presentation.header.featureFlags.enableSuggestion ? <SuggestionBox /> : null}
              {presentation.header.featureFlags.enableThemeSwitch ? <ThemeSwitch /> : null}
            </div>

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
