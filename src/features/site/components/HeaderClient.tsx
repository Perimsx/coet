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
  const headerRef = useRef<HTMLElement | null>(null)
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, active: false })
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

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!canHover || reduceMotion) return

    const handlePointerMove = (event: PointerEvent) => {
      const rect = header.getBoundingClientRect()
      setSpotlight({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: true,
      })
    }
    const handlePointerLeave = () => setSpotlight((current) => ({ ...current, active: false }))

    header.addEventListener('pointermove', handlePointerMove)
    header.addEventListener('pointerleave', handlePointerLeave)
    return () => {
      header.removeEventListener('pointermove', handlePointerMove)
      header.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  const commonProps = { logo, navContent, mobileMenu, centerContent, stats }

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-[100] h-12 w-full overflow-hidden shadow-none outline-none ring-0 transition-all duration-300 ease-out lg:h-16",
          isScrolled
            ? "bg-white/[0.78] dark:bg-black/[0.78] backdrop-blur-2xl shadow-[0_1px_0_color-mix(in_oklab,var(--foreground)_6%,transparent),0_14px_36px_-30px_rgba(15,23,42,0.5)] dark:shadow-[0_1px_0_rgba(255,255,255,0.08),0_14px_36px_-30px_rgba(0,0,0,0.8)]"
            : "bg-transparent",
          mobileHidden && "max-md:-translate-y-full"
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-300 lg:block",
            spotlight.active && isScrolled && "opacity-100"
          )}
          style={{
            background: `radial-gradient(180px circle at ${spotlight.x}px ${spotlight.y}px, color-mix(in oklab, var(--accent) 14%, transparent), transparent 68%)`,
          }}
        />
        <div className="relative mx-auto flex h-full w-full max-w-7xl items-center px-2 sm:px-4 lg:px-8">
          <ScrollTitle {...commonProps} />
        </div>
      </header>

      {/* 顶部占位 */}
      {fixedNav && <div className="h-12 lg:h-16" />}
    </>
  )
}
