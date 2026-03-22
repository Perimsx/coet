'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import ScrollTitle from './ScrollTitle'

interface HeaderClientProps {
  fixedNav: boolean
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
    ? 'fixed inset-x-0 top-0 z-50 flex justify-center transition-all duration-500 sm:top-3 sm:px-6 [&:has([data-is-article-mode="true"])]:max-sm:-translate-y-16'
    : 'fixed inset-x-0 top-0 z-50 flex justify-center transition-all duration-700 sm:top-5 sm:px-6 [&:has([data-is-article-mode="true"])]:max-sm:-translate-y-24'

  const containerActiveClasses = isScrolled
    ? 'mx-auto flex h-[3.25rem] w-full max-w-[800px] items-center justify-between px-4 sm:px-6 gap-4 sm:gap-6 rounded-full border border-border/50 bg-background/80 backdrop-blur-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-all duration-500 dark:border-white/20 dark:bg-black/60 dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]'
    : 'mx-auto flex h-14 w-full max-w-[800px] items-center justify-between gap-4 sm:gap-6 border border-white/20 bg-background/40 px-4 sm:px-6 rounded-full backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_-6px_rgba(0,0,0,0.1),0_4px_8px_-4px_rgba(0,0,0,0.06)] transition-all duration-700 sm:h-[3.75rem] dark:border-white/10 dark:bg-black/30 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_20px_40px_-12px_rgba(0,0,0,0.3)]'

  return (
    <header className={fixedNav ? headerActiveClasses : 'relative z-50 flex justify-center px-4 py-4 transition-all duration-300'}>
      <div className={fixedNav ? containerActiveClasses : 'mx-auto flex h-14 w-full max-w-[800px] items-center justify-between gap-4 rounded-full border border-white/20 bg-background/50 px-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-3xl sm:h-16 sm:px-6 transition-all duration-500 dark:border-white/10 dark:bg-black/30 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'}>
        <ScrollTitle
          logo={logo}
          centerContent={centerContent}
          navContent={navContent}
          stats={stats}
        />
      </div>
    </header>
  )
}
