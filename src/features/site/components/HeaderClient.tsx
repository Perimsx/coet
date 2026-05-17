'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/utils/utils'
import ScrollTitle from './ScrollTitle'

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

  return (
    <>
      {/* 1. 移动端/平板标准顶栏：简约 Sticky 风格 */}
      <header className="fixed inset-x-0 top-0 z-[100] flex h-14 w-full items-center justify-between border-b border-border/5 bg-background/80 px-6 backdrop-blur-2xl md:hidden">
        <div className="flex items-center scale-95 origin-left">{logo}</div>
        <div className="flex items-center gap-1.5">
          {navContent}
          {mobileMenu}
        </div>
      </header>

      {/* 2. 桌面端灵动顶栏：保留原有 Morph 逻辑 */}
      <header className="fixed inset-x-0 top-0 z-50 hidden justify-center pointer-events-none md:flex">
        <div
          className={cn(
            "pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] mx-auto",
            isScrolled
              ? 'translate-y-0 rounded-none border-b border-border/10 dark:border-white/5 bg-background/80 backdrop-blur-2xl shadow-sm px-0 w-full'
              : 'px-6 translate-y-5'
          )}
          style={{ height: '56px' }}
        >
          <div
            className={cn(
              "mx-auto flex w-full max-w-5xl items-center justify-between transition-all duration-500",
              isScrolled 
                ? 'px-12 rounded-none' 
                : 'px-6 rounded-full border border-border/20 dark:border-white/10 bg-background/60 dark:bg-background/20 backdrop-blur-2xl shadow-lg',
              "gap-6"
            )}
            style={{ height: '56px' }}
          >
            <ScrollTitle {...commonProps} />
          </div>
        </div>
      </header>



      {/* 顶部占位 */}
      <div className="h-14 sm:h-20" />
    </>
  )
}
