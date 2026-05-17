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
  links: { href: string; title: string; children?: { href: string; title: string }[] }[]
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
}: HeaderClientProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!fixedNav) return
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
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
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[100] w-full transition-all duration-500 ease-out",
          isScrolled
            ? "bg-background/65 backdrop-blur-2xl border-b border-border/10 shadow-sm"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6 sm:px-12">
          <ScrollTitle {...commonProps} isMobileCentered={false} />
        </div>
      </header>

      {/* 顶部占位 */}
      {fixedNav && <div className="h-14" />}
    </>
  )
}
