'use client'

import { Drawer } from 'vaul'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { TooltipIconButton } from '@/shared/components/TooltipIconButton'
import type { HeaderNavLink } from '@/blog.config'
import Link from '@/shared/components/Link'
import { NavIcon, isNavLinkActive } from '@/features/site/components/nav-icons'
import { Menu, X } from 'lucide-react'
import { useNavLanguage } from '@/features/site/lib/nav-language'
import ThemeSwitch from './ThemeSwitch'
import LanguageSwitch from './LanguageSwitch'

const MobileNav = ({
  links,
  menuLabel,
}: {
  links: HeaderNavLink[]
  menuLabel: string
}) => {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = useState(pathname)
  const { translateNav } = useNavLanguage()

  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} shouldScaleBackground>
      <Drawer.Trigger asChild>
        <TooltipIconButton label={translateNav(menuLabel)} side="bottom">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-paper/85 text-neutral-8 backdrop-blur-md transition-colors hover:text-accent active:scale-95 lg:hidden outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {open ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </TooltipIconButton>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[210] mt-24 flex flex-col rounded-t-2xl border-t border-border bg-paper outline-none focus:outline-none">
          <div className="flex-1 rounded-t-2xl bg-paper px-6 py-4">
            {/* 顶部手势指示条 */}
            <div className="mx-auto mb-4 h-1.5 w-10 shrink-0 rounded-full bg-neutral-4" />
            
            <div className="mx-auto max-w-md">
              <Drawer.Title className="mb-3 text-center text-caption-10 font-medium tracking-widest text-neutral-6 uppercase">
                {translateNav(menuLabel)}
              </Drawer.Title>

              <nav className="flex flex-col space-y-1">
                {links.map((link) => {
                  const isDirectActive = isNavLinkActive(pathname, link.href)
                  const hasChildren = link.children && link.children.length > 0
                  const isSubActive = link.children?.some((child) => isNavLinkActive(pathname, child.href))
                  const isActive = isDirectActive || isSubActive

                  return (
                    <div key={link.href} className="flex flex-col">
                      <Link
                        href={link.href}
                        className={`flex w-full items-center gap-3.5 rounded-lg px-3.5 py-2 text-copy-14 font-medium transition-colors ${
                          isActive
                            ? 'bg-neutral-2 text-accent'
                            : 'text-neutral-9 hover:bg-neutral-2/60'
                        }`}
                      >
                        <NavIcon href={link.href} className="h-4 w-4 shrink-0" />
                        <span>{translateNav(link.title)}</span>
                      </Link>
                      
                      {hasChildren && (
                        <div className="ml-7 mt-1 flex flex-col space-y-1 border-l border-border pl-2">
                          {link.children!.map((child) => {
                            const isChildActive = isNavLinkActive(pathname, child.href)
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-copy-13 font-medium transition-colors ${
                                  isChildActive
                                    ? 'text-accent bg-neutral-2/50'
                                    : 'text-neutral-7 hover:text-neutral-10 hover:bg-neutral-2/40'
                                }`}
                              >
                                <NavIcon href={child.href} className="h-3.5 w-3.5 shrink-0" />
                                <span>{translateNav(child.title)}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* 底部工具栏 */}
          <div className="flex items-center justify-center gap-4 border-t border-border px-6 py-3.5">
            <ThemeSwitch />
            <LanguageSwitch />
          </div>

          <div className="h-4 w-full" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export default MobileNav
