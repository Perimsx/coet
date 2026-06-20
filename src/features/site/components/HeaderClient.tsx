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
  const lastScrollY = useRef(0)
  const isPostPage = isBlogPostPath(pathname)

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
    if (!isPostPage) {
      setMobileHidden(false)
      return
    }

    window.addEventListener('scroll', handleMobileScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleMobileScroll)
  }, [isPostPage, handleMobileScroll])

  // 路由切换时重置所有状态
  useEffect(() => {
    setIsScrolled(false)
    setMobileHidden(false)
    lastScrollY.current = 0
  }, [pathname])

  const commonProps = { logo, navContent, mobileMenu, centerContent, stats }

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[100] h-12 w-full shadow-none outline-none ring-0 transition-all duration-300 ease-out lg:h-16",
          isScrolled
            ? "bg-white/[0.72] dark:bg-black/[0.78] backdrop-blur-2xl border-solid border-b border-white/[0.18] dark:border-white/[0.08]"
            : "bg-transparent",
          mobileHidden && "max-md:-translate-y-full"
        )}
      >
        <div className="mx-auto flex h-full w-full max-w-7xl items-center px-2 sm:px-4 lg:px-8">
          <ScrollTitle {...commonProps} />
        </div>
      </header>

      {/* 顶部占位 */}
      {fixedNav && <div className="h-12 lg:h-16" />}
    </>
  )
}
