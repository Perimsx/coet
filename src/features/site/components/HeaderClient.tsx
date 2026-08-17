'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/utils/utils'
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

function isBlogPostPath(pathname: string) {
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
  const [mobileHidden, setMobileHidden] = useState(false)
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = useState(pathname)
  const lastScrollY = useRef(0)
  const headerRef = useRef<HTMLElement | null>(null)
  const isPostPage = isBlogPostPath(pathname)

  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setIsScrolled(false)
    setMobileHidden(false)
  }

  useEffect(() => {
    if (!fixedNav) return
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [fixedNav])

  // 移动端文章页：向下滚动隐藏，向上滚动恢复
  const handleMobileScroll = useCallback(() => {
    const currentY = window.scrollY
    const delta = currentY - lastScrollY.current

    if (currentY < 60) {
      setMobileHidden(false)
    } else if (delta > 8) {
      setMobileHidden(true)
    } else if (delta < -8) {
      setMobileHidden(false)
    }

    lastScrollY.current = currentY
  }, [])

  useEffect(() => {
    lastScrollY.current = 0
    if (!isPostPage) return

    window.addEventListener('scroll', handleMobileScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleMobileScroll)
  }, [isPostPage, handleMobileScroll, pathname])



  const commonProps = { logo, navContent, mobileMenu, centerContent, stats }

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-[100] h-12 w-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:h-16",
          isScrolled
            ? "bg-paper/85 backdrop-blur-md border-b border-border"
            : "bg-transparent",
          mobileHidden && "max-md:-translate-y-full"
        )}
      >
        <div className="relative mx-auto flex h-full w-full max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <ScrollTitle {...commonProps} />
        </div>
      </header>

      {/* 顶部占位 */}
      {fixedNav && <div className="h-12 lg:h-16" />}
    </>
  )
}
