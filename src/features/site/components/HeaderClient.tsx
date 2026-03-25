'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import ScrollTitle from './ScrollTitle'

interface HeaderClientProps {
  fixedNav: boolean
  logo: React.ReactNode
  navContent: React.ReactNode
  mobileMenu: React.ReactNode
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
  if (!pathname) {
    return false
  }
  // 匹配 /blog/xxx 但排除 /blog/page 和 /blog/category
  return /^\/blog\/(?!page(?:\/|$)|category(?:\/|$)).+/.test(pathname)
}

export default function HeaderClient({
  fixedNav,
  logo,
  navContent,
  mobileMenu,
  centerContent,
  stats,
}: HeaderClientProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const isPostDetailPage = isBlogPostDetailPath(pathname)
  const isHomePage = pathname === '/'

  // 检测移动端视口
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)')
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // 移动端首页完全不监听滚动
  const skipScroll = isHomePage && isMobile

  useEffect(() => {
    if (!fixedNav || skipScroll) return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [fixedNav, skipScroll])

  useEffect(() => {
    setIsScrolled(false)
  }, [pathname])

  // 移动端首页：纯静态渲染，无 transition，无变形
  if (skipScroll) {
    return (
      <header
        className={`fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none`}
        style={{ height: '56px' }}
      >
        <div
          className="w-full pointer-events-auto overflow-visible px-3"
          style={{ height: '56px' }}
        >
          <div
            className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 rounded-full border border-border/20 dark:border-white/10 bg-background/60 dark:bg-background/20 backdrop-blur-2xl shadow-[0_8px_32px_-6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_20px_40px_-12px_rgba(0,0,0,0.3)] gap-2"
            style={{ height: '56px' }}
          >
            <ScrollTitle
              logo={logo}
              centerContent={centerContent}
              navContent={navContent}
              mobileMenu={mobileMenu}
              stats={stats}
            />
          </div>
        </div>
      </header>
    )
  }

  const morphBgClasses = isScrolled
    ? 'translate-y-0 rounded-none border-b border-border/10 dark:border-white/5 bg-background/80 backdrop-blur-2xl shadow-sm px-0'
    : 'sm:translate-y-5 px-3 sm:px-6'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none ${isPostDetailPage ? 'hidden sm:flex' : ''}`}
      style={{ height: '56px', minHeight: '56px' }}
    >
      <div
        className={`w-full pointer-events-auto transition-[padding,background-color,border-radius,box-shadow,transform] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-visible ${fixedNav ? morphBgClasses : 'sm:translate-y-5 px-4 sm:px-8 lg:px-10'}`}
        style={{ height: '56px', minHeight: '56px' }}
      >
        <div
          className={`mx-auto flex w-full max-w-5xl items-center justify-between transition-[padding,border-radius,border-color,background-color,box-shadow] duration-500 ${isScrolled ? 'px-7 sm:px-12 rounded-none' : 'px-4 sm:px-6 rounded-full border border-border/20 dark:border-white/10 bg-background/60 dark:bg-background/20 backdrop-blur-2xl shadow-[0_8px_32px_-6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_20px_40px_-12px_rgba(0,0,0,0.3)]'} gap-2 sm:gap-6`}
          style={{ height: '56px', minHeight: '56px' }}
        >
          <ScrollTitle
            logo={logo}
            centerContent={centerContent}
            navContent={navContent}
            mobileMenu={mobileMenu}
            stats={stats}
          />
        </div>
      </div>
    </header>
  )
}
