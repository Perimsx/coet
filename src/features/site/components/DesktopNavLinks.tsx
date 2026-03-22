'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { HeaderNavLink } from '@/config/navigation'
import Link from '@/shared/components/Link'
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
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)

  return (
    <div 
      className="hidden items-center gap-x-1 sm:flex relative"
      onMouseLeave={() => setHoveredPath(null)}
    >
      {links.map((link) => {
          const isDirectActive = isNavLinkActive(pathname, link.href)
          const isSubActive = link.children?.some((child) => isNavLinkActive(pathname, child.href))
          const isActive = isDirectActive || isSubActive

          const isHovered = hoveredPath === link.href

          const triggerClass = `relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-medium tracking-tight transition-colors duration-200 whitespace-nowrap outline-none focus:outline-none ${
            isActive 
              ? 'text-primary-600 dark:text-primary-400 font-extrabold' 
              : isHovered
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground text-gray-600/90 dark:text-gray-300/90'
          }`
          
          const activePill = (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 z-0 border border-primary-500/15 bg-primary-500/8 shadow-[0_4px_12px_-2px_rgba(59,130,246,0.12)] dark:border-primary-400/20 dark:bg-primary-400/10 dark:shadow-[0_4px_12px_-2px_rgba(96,165,250,0.08)] rounded-full"
              transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
            />
          )

          const hoverPill = isHovered && !isActive ? (
             <motion.div
               layoutId="nav-hover-pill"
               className="absolute inset-0 z-0 bg-muted/60 dark:bg-white/10 rounded-full"
               transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
             />
          ) : null

          if (link.children && link.children.length > 0) {
            return (
              <DropdownMenu key={link.href} modal={false}>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    onMouseEnter={() => setHoveredPath(link.href)}
                    className={triggerClass}
                  >
                    {isActive ? activePill : hoverPill}
                    <NavIcon href={link.href} className="h-4 w-4 shrink-0 relative z-10" />
                    <span className="relative z-10">{link.title}</span>
                    <ChevronDown className="h-3 w-3 opacity-50 relative z-10" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={12} className="w-[160px] overflow-hidden rounded-2xl p-1.5 shadow-2xl border-border/40 bg-background/80 backdrop-blur-xl animate-in fade-in zoom-in duration-200">
                  {link.children.map((child) => {
                    const isChildActive = isNavLinkActive(pathname, child.href)
                    return (
                      <DropdownMenuItem asChild key={child.href} className="rounded-xl cursor-pointer transition-colors focus:bg-primary-500/10 focus:text-primary-600 dark:focus:bg-primary-400/15 dark:focus:text-primary-400">
                        <Link href={child.href} className="w-full flex items-center gap-2.5 px-3 py-2">
                           <NavIcon href={child.href} className={`h-4 w-4 shrink-0 transition-colors ${isChildActive ? 'text-primary-500' : 'text-muted-foreground/70'}`} />
                           <span className={`text-[13.5px] ${isChildActive ? 'font-bold' : 'font-medium'}`}>{child.title}</span>
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
              onMouseEnter={() => setHoveredPath(link.href)}
            >
              <Link
                href={link.href}
                className={triggerClass}
              >
                {isActive ? activePill : hoverPill}
                <NavIcon href={link.href} className="h-4 w-4 shrink-0 relative z-10" />
                <span className="relative z-10">{link.title}</span>
              </Link>
            </motion.div>
          )
        })}
    </div>
  )
}
