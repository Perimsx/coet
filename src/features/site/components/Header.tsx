'use client'

import { useEffect, useState } from 'react'
import { siteMetadata, sitePresentationDefaults } from '@/blog.config'
import { getSiteSettings, type SiteSettings } from '@/features/site/services/site-settings'
import { getSitePresentation } from '@/features/site/services/site-presentation'
import Link from '@/shared/components/Link'
import BrandLogo from '@/shared/media/BrandLogo'
import DesktopNavLinks from './DesktopNavLinks'
import MobileNav from './MobileNav'
import SearchButton from '@/features/search/components/SearchButton'
import ThemeSwitch from './ThemeSwitch'
import LanguageSwitch from './LanguageSwitch'

import { getAllBlogs } from '@/features/content/lib/contentlayer-adapter'
import {
  getDatabaseBlogs,
  getDatabaseCategoryCounts,
  getDatabaseFriends,
  getDatabaseTagCounts,
} from '@/features/content/lib/database-content-source'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { resolvePostCategories } from '@/features/content/lib/post-categories'
import { getPostSourcePath } from '@/features/content/lib/post-utils'
import { slug } from 'github-slugger'
import { getPublishedFriends } from '@/features/friends/lib/friends'
import HeaderClient from './HeaderClient'

export default function Header() {
  const fixedNav = siteMetadata.stickyNav
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [presentation, setPresentation] = useState<
    Awaited<ReturnType<typeof getSitePresentation>> | null
  >(null)
  const [stats, setStats] = useState({
    postCount: 0,
    tagCount: 0,
    categoryCount: 0,
    friendCount: 0,
    commitCount: 0,
  })

  useEffect(() => {
    let active = true
    Promise.all([
      getSiteSettings(),
      getSitePresentation(),
      getDatabaseBlogs(),
      getDatabaseTagCounts(),
      getDatabaseCategoryCounts(),
      getDatabaseFriends(),
    ]).then(
      async ([
        siteSettings,
        sitePres,
        databaseBlogs,
        databaseTagCounts,
        databaseCategoryCounts,
        databaseFriends,
      ]) => {
        if (!active) return
        setSettings(siteSettings)
        setPresentation(sitePres)

        const allBlogs = (databaseBlogs || getAllBlogs()).filter(
          (post) => post.draft !== true
        )
        const posts = allCoreContent(sortPosts(allBlogs))
        const postCount = posts.length

        const tagSet = new Set<string>()
        const categorySet = new Set<string>()

        allBlogs.forEach((post) => {
          post.tags?.forEach((t) => tagSet.add(slug(t)))
          const cats = resolvePostCategories(
            post.categories,
            getPostSourcePath(post)
          )
          cats.forEach((c) => categorySet.add(c))
        })

        const friendsParams = databaseFriends || getPublishedFriends()

        setStats({
          postCount,
          tagCount: databaseTagCounts
            ? Object.keys(databaseTagCounts).length
            : tagSet.size,
          categoryCount: databaseCategoryCounts
            ? Object.keys(databaseCategoryCounts).length
            : categorySet.size,
          friendCount: friendsParams.length,
          commitCount: 0,
        })
      }
    )

    return () => {
      active = false
    }
  }, [])

  const headerTitle = settings?.headerTitle || siteMetadata.headerTitle
  const navLinks =
    presentation?.navigation.links || sitePresentationDefaults.navigation.links
  const featureFlags =
    presentation?.header.featureFlags ||
    sitePresentationDefaults.header.featureFlags
  const mobileMenuLabel =
    presentation?.navigation.mobileMenuLabel ||
    sitePresentationDefaults.navigation.mobileMenuLabel

  const logo = (
    <Link
      href="/"
      aria-label={headerTitle}
      className="group relative flex shrink-0 items-center gap-2.5 outline-none transition-all duration-300 hover:opacity-80 active:scale-95"
    >
      <BrandLogo
        className="relative h-8 w-8 shrink-0 sm:h-[34px] sm:w-[34px]"
        alt={headerTitle}
      />
      <span
        className="hidden items-start text-lg font-black tracking-tighter text-foreground sm:flex sm:text-xl"
        style={{ fontFamily: '"XuandongKaishu"' }}
      >
        {settings?.title || siteMetadata.title}
        <span className="ml-0.5 mt-0.5 text-[10px] font-medium leading-none text-muted-foreground/50">
          ©
        </span>
      </span>
    </Link>
  )

  return (
    <HeaderClient
      fixedNav={!!fixedNav}
      logo={logo}
      centerContent={<DesktopNavLinks links={navLinks} />}
      stats={stats}
      navContent={
        <div className="flex items-center justify-end gap-2">
          {featureFlags.enableSearch ? <SearchButton /> : null}
          {featureFlags.enableSuggestion ? (
            <div className="hidden md:block">
              <LanguageSwitch />
            </div>
          ) : null}
          {featureFlags.enableThemeSwitch ? (
            <div className="hidden md:block">
              <ThemeSwitch />
            </div>
          ) : null}
        </div>
      }
      mobileMenu={<MobileNav links={navLinks} menuLabel={mobileMenuLabel} />}
    />
  )
}
