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

  // 1. 首页移动端保持原状 (极简固定顶栏)
  if (isHomePage) {
    return (
      <>
        <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-center border-b border-zinc-200/50 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-2xl sm:hidden">
          <ScrollTitle 
            {...commonProps} 
            centerContent={null} 
            navContent={null}
            mobileMenu={null}
            isMobileCentered={true}
          />
        </header>
        <div className="h-14 sm:hidden" />
        
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
        <MobileBottomNav links={links} mobileMenu={mobileMenu} />
      </>
    )
  }

  // 2. 其他页面回退到提交 7c3003f 的形态
  const morphBgClasses = isScrolled
    ? 'translate-y-0 rounded-none border-b border-border/10 dark:border-white/5 bg-background/80 backdrop-blur-2xl shadow-sm px-0'
    : 'sm:translate-y-5 px-3 sm:px-6'

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none transition-all duration-500"
        style={{ height: '56px', minHeight: '56px' }}
      >
        <div
          className={cn(
            "w-full pointer-events-auto transition-[padding,background-color,border-radius,box-shadow,transform] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-visible",
            fixedNav ? morphBgClasses : 'sm:translate-y-5 px-4 sm:px-8 lg:px-10'
          )}
          style={{ height: '56px', minHeight: '56px' }}
        >
          <div
            className={cn(
              "mx-auto flex w-full max-w-5xl items-center justify-between transition-[padding,border-radius,border-color,background-color,box-shadow] duration-500",
              isScrolled 
                ? 'px-7 sm:px-12 rounded-none' 
                : 'px-4 sm:px-6 rounded-full border border-border/20 dark:border-white/10 bg-background/60 dark:bg-background/20 backdrop-blur-2xl shadow-[0_8px_32px_-6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_20px_40px_-12px_rgba(0,0,0,0.3)]',
              "gap-2 sm:gap-6"
            )}
            style={{ height: '56px', minHeight: '56px' }}
          >
            <ScrollTitle {...commonProps} />
          </div>
        </div>
      </header>
      <MobileBottomNav links={links} mobileMenu={mobileMenu} />
    </>
  )
}
