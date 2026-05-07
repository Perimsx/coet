'use client'

import { motion } from 'framer-motion'
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

  // 只展示前三个核心链接，其余放在更多菜单里
  const coreLinks = links.slice(0, 3)

  return (
    <div className="fixed bottom-8 inset-x-0 z-[100] flex justify-center px-6 sm:hidden pointer-events-none">
      <motion.nav 
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="flex items-center gap-1 p-1.5 rounded-[2.5rem] border border-zinc-200/50 bg-white/80 backdrop-blur-3xl backdrop-saturate-150 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:border-white/10 dark:bg-zinc-900/80 pointer-events-auto ring-1 ring-black/5 dark:ring-white/5"
      >
        <div className="flex items-center gap-0.5 pl-1.5">
          {coreLinks.map((link) => {
            const isActive = isNavLinkActive(pathname, link.href)
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative flex flex-col items-center justify-center h-11 w-12 transition-all active:scale-90"
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 bg-zinc-900/5 dark:bg-white/10 rounded-full"
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                  />
                )}
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -1 : 0
                  }}
                  className={`relative z-10 flex flex-col items-center justify-center ${
                    isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  <NavIcon href={link.href} className="h-[22px] w-[22px]" />
                  <span className="text-[9px] font-bold leading-none tracking-tight mt-0.5">{link.title}</span>
                </motion.div>
              </Link>
            )
          })}
        </div>

        {/* 垂直分割线：带渐变 */}
        <div className="w-px h-6 bg-gradient-to-b from-transparent via-zinc-200 to-transparent dark:via-zinc-800 mx-1" />

        <div className="flex items-center gap-0.5 pr-1.5">
          {enableSearch && (
            <div className="flex h-11 w-10 items-center justify-center">
              <SearchButton />
            </div>
          )}
          {enableThemeSwitch && (
            <div className="flex h-11 w-10 items-center justify-center">
              <ThemeSwitch />
            </div>
          )}
          {mobileMenu && (
            <div className="flex h-11 w-10 items-center justify-center">
              {mobileMenu}
            </div>
          )}
        </div>
      </motion.nav>
    </div>
  )
}
