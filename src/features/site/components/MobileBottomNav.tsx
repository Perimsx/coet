'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from '@/shared/components/Link'
import { NavIcon, isNavLinkActive } from './nav-icons'
import type { HeaderNavLink } from '@/blog.config'
import SearchButton from '@/features/search/components/SearchButton'
import ThemeSwitch from './ThemeSwitch'

interface MobileBottomNavProps {
  links: HeaderNavLink[]
  enableSearch?: boolean
  enableThemeSwitch?: boolean
  mobileMenu?: React.ReactNode
}

export default function MobileBottomNav({ 
  links, 
  enableSearch, 
  enableThemeSwitch,
  mobileMenu
}: MobileBottomNavProps) {
  const pathname = usePathname()
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null)

  // 只展示前三个核心链接
  const coreLinks = links.slice(0, 3)

  // 点击处理逻辑
  const handleLinkClick = (e: React.MouseEvent, href: string, hasChildren: boolean, children?: { href: string }[]) => {
    const isActive = isNavLinkActive(pathname, href, children)
    
    // 如果已经激活且有子菜单，则切换子菜单显示，不跳转
    if (isActive && hasChildren) {
      e.preventDefault()
      setActiveSubMenu(activeSubMenu === href ? null : href)
    } else {
      setActiveSubMenu(null)
    }
  }

  return (
    <div className="fixed bottom-8 inset-x-0 z-[100] flex justify-center px-6 sm:hidden pointer-events-none">
      {/* 强制隐藏竞争元素 */}
      <style jsx global>{`
        @media (max-width: 639px) {
          .kbar-button, [aria-label="回到顶部"], [aria-label="滚动到评论区"], [aria-label="分享当前页面"] {
            display: none !important;
          }
        }
      `}</style>
      
      <motion.nav 
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="flex items-center gap-1 p-1.5 rounded-[2.5rem] 
          bg-white/70 dark:bg-zinc-900/75 backdrop-blur-3xl backdrop-saturate-[200%]
          border border-white/40 dark:border-white/10
          shadow-[0_8px_32px_-4px_rgba(0,0,0,0.1),0_16px_48px_-8px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)]
          dark:shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]
          pointer-events-auto ring-1 ring-black/[0.03] dark:ring-white/[0.05]"
      >
        <div className="flex items-center gap-0.5 pl-1.5">
          {coreLinks.map((link) => {
            const hasChildren = !!link.children?.length
            const isActive = isNavLinkActive(pathname, link.href, link.children)
            const isSubMenuOpen = activeSubMenu === link.href
            
            return (
              <div key={link.href} className="relative">
                {/* 二级菜单气泡 */}
                <AnimatePresence>
                  {isSubMenuOpen && hasChildren && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 flex flex-col min-w-[120px] p-1.5 rounded-2xl border border-white/40 dark:border-white/10 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-xl"
                    >
                      {link.children?.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setActiveSubMenu(null)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                            pathname === child.href 
                              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' 
                              : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
                          }`}
                        >
                          {child.title}
                        </Link>
                      ))}
                      {/* 气泡小三角 */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white/90 dark:border-t-zinc-800/90" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Link
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href, hasChildren, link.children)}
                  className="relative flex flex-col items-center justify-center h-11 w-12 transition-all active:scale-90"
                >
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-active"
                      className="absolute inset-x-0.5 inset-y-1 bg-primary-500/15 dark:bg-primary-400/20 rounded-[1.25rem] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none"
                      transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                    />
                  )}
                  <motion.div
                    animate={{ 
                      scale: isActive ? 1.05 : 1,
                      y: isActive ? -1 : 0
                    }}
                    className={`relative z-10 flex flex-col items-center justify-center ${
                      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-500/80 dark:text-zinc-400/80'
                    }`}
                  >
                    <div className="relative">
                      <NavIcon href={link.href} className="h-[22px] w-[22px]" />
                      {hasChildren && (
                        <div className={`absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full ${isActive ? 'bg-primary-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                      )}
                    </div>
                    <span className={`text-[9px] leading-none tracking-tight mt-1 ${isActive ? 'font-bold' : 'font-semibold'}`}>
                      {link.title}
                    </span>
                  </motion.div>
                </Link>
              </div>
            )
          })}
        </div>

        {/* 分割线 */}
        <div className="w-[1.2px] h-5 bg-zinc-900/[0.08] dark:bg-white/[0.1] mx-1 rounded-full" />

        <div className="flex items-center gap-0.5 pr-1.5">
          {enableSearch && (
            <div className="flex h-11 w-10 items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
              <SearchButton />
            </div>
          )}
          {enableThemeSwitch && (
            <div className="flex h-11 w-10 items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
              <ThemeSwitch />
            </div>
          )}
          {mobileMenu && (
            <div className="flex h-11 w-10 items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
              {mobileMenu}
            </div>
          )}
        </div>
      </motion.nav>
    </div>
  )
}
