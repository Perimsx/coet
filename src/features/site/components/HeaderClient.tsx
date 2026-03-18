'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import ScrollTitle from './ScrollTitle'

interface HeaderClientProps {
  fixedNav: boolean
  headerTitle: string
  logo: React.ReactNode
  navContent: React.ReactNode
  centerContent?: React.ReactNode
  stats: {
    postCount: number
    tagCount: number
    categoryCount: number
  }
}

export default function HeaderClient({
  fixedNav,
  headerTitle,
  logo,
  navContent,
  centerContent,
  stats,
}: HeaderClientProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!fixedNav) return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // 初始化检查

    return () => window.removeEventListener('scroll', handleScroll)
  }, [fixedNav])

  // 当路径改变时，重置滚动状态（通常滚动会回到顶部，但保险起见）
  useEffect(() => {
    setIsScrolled(false)
  }, [pathname])

  const headerActiveClasses = isScrolled
    ? 'fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all duration-500 [&:has([data-is-article-mode="true"])]:max-sm:-translate-y-16'
    : 'fixed inset-x-0 top-0 z-50 flex justify-center transition-all duration-700 sm:top-5 sm:px-6 [&:has([data-is-article-mode="true"])]:max-sm:-translate-y-24'

  const containerActiveClasses = isScrolled
    ? 'mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:h-[3.75rem] sm:px-6 transition-all duration-500'
    : 'mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 border-b border-border/40 bg-background/60 px-4 backdrop-blur-2xl transition-all duration-700 sm:h-[3.75rem] sm:gap-6 sm:rounded-full sm:border sm:border-border/20 sm:bg-background/30 sm:px-6 sm:shadow-[0_8px_32px_-6px_rgba(0,0,0,0.06),0_4px_8px_-4px_rgba(0,0,0,0.04)] sm:dark:border-white/10 sm:dark:bg-black/20 sm:dark:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)]'

  return (
    <header className={fixedNav ? headerActiveClasses : 'relative z-50 flex justify-center px-4 py-4 transition-all duration-300'}>
      <div className={fixedNav ? containerActiveClasses : 'mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 rounded-full border border-border/40 bg-background/70 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl sm:h-16 sm:px-6 transition-all duration-500'}>
        <ScrollTitle
          headerTitle={headerTitle}
          logo={logo}
          centerContent={centerContent}
          navContent={navContent}
          stats={stats}
        />
      </div>
    </header>
  )
}
