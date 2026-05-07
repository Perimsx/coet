'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/utils/utils'
import ScrollTitle from './ScrollTitle'
import MobileBottomNav from './MobileBottomNav'

interface HeaderClientProps {
  fixedNav: boolean
  logo: React.ReactNode
  navContent: React.ReactNode
  mobileMenu: React.ReactNode
  links: import('@/blog.config').HeaderNavLink[]
  centerContent?: React.ReactNode
  stats: {
    postCount: number
    tagCount: number
    categoryCount: number
    friendCount: number
    commitCount: number
  }
}

function isBlogPostDetailPath(pathname: string | null) {
  if (!pathname) return false
  return /^\/blog\/(?!page(?:\/|$)|category(?:\/|$)).+/.test(pathname)
}

export default function HeaderClient({
  fixedNav,
  logo,
  navContent,
  mobileMenu,
  links,
  centerContent,
  stats,
}: HeaderClientProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const isPostDetailPage = isBlogPostDetailPath(pathname)

  useEffect(() => {
    if (!fixedNav) return
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [fixedNav])

  useEffect(() => {
    setIsScrolled(false)
  }, [pathname])

  const commonProps = { logo, navContent, mobileMenu, centerContent, stats, links }

  const isHomePage = pathname === '/'
  const showMobileHeader = !isPostDetailPage

  return (
    <>
      {/* 1. 移动端专属：顶部导航栏 (sm:hidden) */}
      {showMobileHeader && (
        <>
          <header 
            className={cn(
              "inset-x-0 top-0 z-50 flex h-14 items-center justify-center transition-all duration-500 sm:hidden",
              isHomePage 
                ? "fixed border-b border-zinc-200/50 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-2xl"
                : isScrolled 
                  ? "fixed border-b border-zinc-200/50 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-2xl translate-y-0"
                  : "absolute bg-transparent border-transparent translate-y-2"
            )}
          >
            <ScrollTitle 
              {...commonProps} 
              centerContent={null} 
              navContent={null}
              mobileMenu={null}
              isMobileCentered={true}
            />
          </header>
          {/* 首页占位符，非首页采用绝对定位不占位 */}
          {isHomePage && <div className="h-14 sm:hidden" />}
        </>
      )}

      {/* 2. 移动端专属：底部悬浮 Dock */}
      <MobileBottomNav 
        links={links}
        enableSearch={true}
        enableThemeSwitch={true}
        mobileMenu={mobileMenu}
      />

      {/* 2. 桌面端专属：高级吸附形态变换 (hidden sm:flex) */}
      <header
        className="fixed inset-x-0 top-0 z-50 hidden justify-center pointer-events-none sm:flex"
        style={{ height: '56px' }}
      >
        <div
          className={`w-full pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-visible 
            ${fixedNav ? (isScrolled ? 'translate-y-0 rounded-none border-b border-border/10 dark:border-white/5 bg-background/80 backdrop-blur-2xl shadow-sm px-0' : 'translate-y-5 px-6') : 'translate-y-5 px-8'}`}
          style={{ height: '56px' }}
        >
          <div
            className={`mx-auto flex h-full w-full max-w-5xl items-center justify-between transition-all duration-500
              ${isScrolled ? 'px-12 rounded-none' : 'px-6 rounded-full border border-border/20 dark:border-white/10 bg-background/60 dark:bg-background/20 backdrop-blur-2xl shadow-lg'} gap-6`}
            style={{ height: '56px' }}
          >
            <ScrollTitle {...commonProps} />
          </div>
        </div>
      </header>
    </>
  )
}
