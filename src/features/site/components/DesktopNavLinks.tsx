'use client'

import { usePathname } from 'next/navigation'
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
  const { translateNav } = useNavLanguage()
 
  return (
    <nav
      className="relative hidden items-center rounded-full border border-border bg-paper/85 px-2 py-0.5 shadow-sm backdrop-blur-md lg:flex"
    >
      <div className="relative flex items-center gap-1 font-medium text-neutral-8">
        {links.map((link) => {
          const isDirectActive = isNavLinkActive(pathname, link.href)
          const isSubActive = link.children?.some((child) => isNavLinkActive(pathname, child.href))
          const isActive = isDirectActive || isSubActive
          const activeChild = link.children?.find((child) => isNavLinkActive(pathname, child.href))
          const displayHref = activeChild?.href || link.href
          const displayTitle = activeChild?.title || link.title

          const triggerClass = `relative inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-copy-13 font-medium tracking-tight transition-colors duration-200 outline-none focus:outline-none ${
            isActive 
              ? 'text-accent bg-neutral-2' 
              : 'text-neutral-7 hover:text-neutral-10 hover:bg-neutral-2/50'
          }`

          const activeIcon = isActive ? (
            <span className="relative z-10 inline-flex">
              <NavIcon href={displayHref} className="h-3.5 w-3.5 shrink-0" />
            </span>
          ) : null

          if (link.children && link.children.length > 0) {
            return (
              <DropdownMenu key={link.href} modal={false}>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    className={triggerClass}
                  >
                    {activeIcon}
                    <span className="relative z-10">{translateNav(displayTitle)}</span>
                    <ChevronDown className="relative z-10 h-3 w-3 opacity-60" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" sideOffset={8} className="w-[160px] overflow-hidden rounded-lg border border-border bg-paper/95 p-1 shadow-lg backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  {link.children.map((child) => {
                    const isChildActive = isNavLinkActive(pathname, child.href)
                    return (
                      <DropdownMenuItem asChild key={child.href} className={`rounded-md cursor-pointer transition-colors px-2.5 py-1.5 text-copy-13 ${isChildActive ? 'text-accent bg-neutral-2 font-medium' : 'text-neutral-8 hover:bg-neutral-2 hover:text-neutral-10'}`}>
                        <Link href={child.href} className="w-full flex items-center gap-2">
                           <NavIcon href={child.href} className={`h-3.5 w-3.5 shrink-0 transition-colors ${isChildActive ? 'text-accent' : 'text-neutral-6'}`} />
                           <span>{translateNav(child.title)}</span>
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
              whileTap={{ scale: 0.97 }}
            >
              <Link
                href={link.href}
                className={triggerClass}
              >
                {activeIcon}
                <span className="relative z-10">{translateNav(link.title)}</span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </nav>
  )
}
