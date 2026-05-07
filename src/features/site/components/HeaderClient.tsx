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
  links: any[]
  centerContent?: React.ReactNode
  stats: {
    postCount: number
    tagCount: number
    categoryCount: number
    friendCount: number
    commitCount: number
  }
  enableSearch?: boolean
  enableThemeSwitch?: boolean
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
  enableSearch,
  enableThemeSwitch,
}: HeaderClientProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const isPostDetailPage = isBlogPostDetailPath(pathname)
  const isHomePage = pathname === '/'

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

  // 1. 首页移动端 (非固定顶栏，仅显示 Logo)
  if (isHomePage) {
    return (
      <>
        <header className="flex h-14 items-center justify-center sm:hidden w-full px-4">
          <ScrollTitle 
            {...commonProps} 
            centerContent={null} 
            navContent={null}
            mobileMenu={null}
            isMobileCentered={true}
          />
        </header>
        
        {/* 桌面端 Morph 逻辑 (保持提交 7c3003f 风格) */}
        <header className="fixed inset-x-0 top-0 z-50 hidden justify-center pointer-events-none sm:flex" style={{ height: '56px' }}>
          <div className={cn(
            "w-full pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-visible",
            isScrolled ? 'translate-y-0 rounded-none border-b border-border/10 bg-background/80 backdrop-blur-2xl shadow-sm px-0' : 'translate-y-5 px-6'
          )} style={{ height: '56px' }}>
            <div className={cn(
              "mx-auto flex h-full w-full max-w-5xl items-center justify-between transition-all duration-500",
              isScrolled ? 'px-12' : 'px-6 rounded-full border border-border/20 bg-background/60 backdrop-blur-2xl shadow-lg',
              "gap-6"
            )} style={{ height: '56px' }}>
              <ScrollTitle {...commonProps} />
            </div>
          </div>
        </header>
        <MobileBottomNav 
          links={links} 
          mobileMenu={mobileMenu} 
          enableSearch={enableSearch}
          enableThemeSwitch={enableThemeSwitch}
        />
      </>
    )
  }

  // 2. 其他页面：逻辑与桌面端保持一致 (Morph 变形)
  const morphBgClasses = isScrolled
    ? 'translate-y-0 rounded-none border-b border-border/10 dark:border-white/5 bg-background/80 backdrop-blur-2xl shadow-sm px-0 w-full'
    : 'translate-y-2 px-0 w-[calc(100%-1.5rem)] sm:w-full sm:px-6 sm:translate-y-5'

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[100] flex justify-center w-full pointer-events-none">
        <div
          className={cn(
            "pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] mx-auto",
            morphBgClasses
          )}
          style={{ height: '56px' }}
        >
          <div
            className={cn(
              "mx-auto flex w-full max-w-5xl items-center justify-between transition-all duration-500",
              isScrolled 
                ? 'px-6 sm:px-12 rounded-none' 
                : 'px-4 sm:px-6 rounded-full border border-border/20 dark:border-white/10 bg-background/60 dark:bg-background/20 backdrop-blur-2xl shadow-lg',
              "gap-2 sm:gap-6"
            )}
            style={{ height: '56px' }}
          >
            <ScrollTitle {...commonProps} />
          </div>
        </div>
      </header>
      
      {/* 顶部占位，防止遮挡内容 */}
      <div className="h-16 sm:h-20" />
    </>
  )
}
