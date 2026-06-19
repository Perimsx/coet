'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import type { HeaderNavLink } from '@/blog.config'
import Link from '@/shared/components/Link'
import { useNavLanguage } from '@/features/site/lib/nav-language'
import { NavIcon, isNavLinkActive, ChevronDown } from '@/features/site/components/nav-icons'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
 
export default function DesktopNavLinks({ links }: { links: HeaderNavLink[] }) {
  const pathname = usePathname()
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0 })
  const { translateNav } = useNavLanguage()

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setSpotlight({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
  }
 
  return (
    <motion.nav
      layout="size"
      className="group relative hidden overflow-hidden rounded-full bg-gradient-to-b from-zinc-50/70 to-white/90 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md dark:from-zinc-900/70 dark:to-zinc-800/90 dark:ring-zinc-100/10 lg:block"
      onPointerMove={handlePointerMove}
      style={{
        '--spotlight-x': `${spotlight.x}px`,
        '--spotlight-y': `${spotlight.y}px`,
      } as CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(7rem circle at var(--spotlight-x) var(--spotlight-y), hsl(var(--primary) / 0.13), transparent 70%)',
        }}
      />
      <div className="relative flex items-center px-4 py-1 font-medium text-zinc-800 dark:text-zinc-200">
      {links.map((link) => {
          const isDirectActive = isNavLinkActive(pathname, link.href)
          const isSubActive = link.children?.some((child) => isNavLinkActive(pathname, child.href))
          const isActive = isDirectActive || isSubActive
          const activeChild = link.children?.find((child) => isNavLinkActive(pathname, child.href))
          const displayHref = activeChild?.href || link.href
          const displayTitle = activeChild?.title || link.title

          const triggerClass = `relative inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap px-3.5 text-[13.5px] font-medium tracking-tight transition-colors duration-200 outline-none focus:outline-none ${
            isActive 
              ? 'text-primary-600 dark:text-primary-400 font-bold' 
              : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white'
          }`
          
          const activeIndicator = isActive ? (
            <motion.span
              layoutId="active-nav-line"
              className="absolute inset-x-2 -bottom-1 h-px bg-gradient-to-r from-primary-500/0 via-primary-500/80 to-primary-500/0 dark:via-primary-400/80"
              transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
            />
          ) : null

          const activeIcon = isActive ? (
            <motion.span
              layoutId="active-nav-icon"
              className="relative z-10 inline-flex"
              transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
            >
              <NavIcon href={displayHref} className="h-4 w-4 shrink-0" />
            </motion.span>
          ) : null

          if (link.children && link.children.length > 0) {
            return (
              <DropdownMenu key={link.href} modal={false}>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    className={triggerClass}
                  >
                    {activeIndicator}
                    {activeIcon}
                    <span className="relative z-10">{translateNav(displayTitle)}</span>
                    <ChevronDown className="relative z-10 h-3 w-3 opacity-50" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" sideOffset={14} className="w-[168px] overflow-hidden rounded-2xl border-border/40 bg-background/85 p-1.5 shadow-2xl shadow-zinc-800/10 backdrop-blur-xl animate-in fade-in zoom-in duration-200 dark:shadow-black/30">
                  {link.children.map((child) => {
                    const isChildActive = isNavLinkActive(pathname, child.href)
                    return (
                      <DropdownMenuItem asChild key={child.href} className="rounded-xl cursor-pointer transition-colors focus:bg-primary-500/10 focus:text-primary-600 dark:focus:bg-primary-400/15 dark:focus:text-primary-400">
                        <Link href={child.href} className="w-full flex items-center gap-2.5 px-3 py-2">
                           <NavIcon href={child.href} className={`h-4 w-4 shrink-0 transition-colors ${isChildActive ? 'text-primary-500' : 'text-muted-foreground/70'}`} />
                           <span className={`text-[13.5px] ${isChildActive ? 'font-bold' : 'font-medium'}`}>{translateNav(child.title)}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }

          return (
            <motion.div
              key={link.href}
              whileTap={{ scale: 0.96 }}
            >
              <Link
                href={link.href}
                className={triggerClass}
              >
                {activeIndicator}
                {activeIcon}
                <span className="relative z-10">{translateNav(link.title)}</span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.nav>
  )
}
