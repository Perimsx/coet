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
        className="flex items-center gap-1.5 p-1.5 rounded-[2.5rem] 
          /* 核心材质：超高饱和度毛玻璃 */
          bg-white/70 dark:bg-zinc-900/75 backdrop-blur-3xl backdrop-saturate-[200%]
          /* 物理质感：双层边框模拟光影 */
          border border-white/40 dark:border-white/10
          /* 深度阴影：多层叠加 */
          shadow-[0_8px_32px_-4px_rgba(0,0,0,0.1),0_16px_48px_-8px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)]
          dark:shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]
          pointer-events-auto ring-1 ring-black/[0.03] dark:ring-white/[0.05]"
      >
        <div className="flex items-center gap-0.5 pl-1.5">
          {coreLinks.map((link) => {
            const isActive = isNavLinkActive(pathname, link.href)
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative flex flex-col items-center justify-center h-12 w-14 transition-all active:scale-90"
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute inset-x-0 inset-y-1 bg-primary-500/15 dark:bg-primary-400/20 rounded-[1.25rem] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none"
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                  />
                )}
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.08 : 1,
                    y: isActive ? -1 : 0
                  }}
                  className={`relative z-10 flex flex-col items-center justify-center ${
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-500/80 dark:text-zinc-400/80'
                  }`}
                >
                  <NavIcon href={link.href} className="h-[24px] w-[24px]" />
                  <span className={`text-[10px] leading-none tracking-tight mt-1.5 ${isActive ? 'font-bold' : 'font-semibold'}`}>
                    {link.title}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </div>

        {/* 物理质感垂直分割线 */}
        <div className="w-[1.5px] h-6 bg-zinc-900/[0.08] dark:bg-white/[0.1] mx-1 rounded-full" />

        <div className="flex items-center gap-0.5 pr-1.5">
          {enableSearch && (
            <div className="flex h-12 w-10 items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
              <SearchButton />
            </div>
          )}
          {enableThemeSwitch && (
            <div className="flex h-12 w-10 items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
              <ThemeSwitch />
            </div>
          )}
          {mobileMenu && (
            <div className="flex h-12 w-10 items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
              {mobileMenu}
            </div>
          )}
        </div>
      </motion.nav>
    </div>
  )
}
