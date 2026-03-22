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

  const morphBgClasses = isScrolled
    ? 'w-full max-w-[100vw] h-[3.25rem] sm:h-[3.75rem] rounded-none border-b border-border/40 bg-background/80 backdrop-blur-xl'
    : 'w-[calc(100%-2rem)] max-w-[640px] h-14 sm:h-14 mt-3 sm:mt-5 rounded-full border border-border/20 dark:border-white/10 bg-background/60 dark:bg-background/20 backdrop-blur-2xl shadow-[0_8px_32px_-6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_20px_40px_-12px_rgba(0,0,0,0.3)]'

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center [&:has([data-is-article-mode='true'])]:max-sm:-translate-y-24 transition-transform duration-500 pointer-events-none">
      <div className={`pointer-events-auto transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden sm:overflow-visible ${fixedNav ? morphBgClasses : 'w-[calc(100%-2rem)] max-w-[640px] mt-4 rounded-full border border-transparent'}`}>
        <div className="mx-auto flex h-full w-full max-w-[1024px] items-center justify-between px-3 sm:px-6 gap-2 sm:gap-6">
          <ScrollTitle
            logo={logo}
            centerContent={centerContent}
            navContent={navContent}
            stats={stats}
          />
        </div>
      </div>
    </header>
  )
}
