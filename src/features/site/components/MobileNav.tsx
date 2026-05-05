'use client'

import { Drawer } from 'vaul'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { HeaderNavLink } from '@/blog.config'
import Link from '@/shared/components/Link'
import { NavIcon, isNavLinkActive } from '@/features/site/components/nav-icons'
import { Menu, X } from 'lucide-react'

const MobileNav = ({
  links,
  menuLabel,
}: {
  links: HeaderNavLink[]
  menuLabel: string
}) => {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // 路径变化时关闭抽屉
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} shouldScaleBackground>
      <Drawer.Trigger asChild>
        <button
          aria-label={menuLabel}
          className="text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground active:scale-95 inline-flex h-10 w-10 items-center justify-center rounded-full sm:hidden outline-none focus:outline-none"
        >
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[210] mt-24 flex flex-col rounded-t-[2rem] border-t border-border bg-background outline-none focus:outline-none dark:bg-gray-900">
          <div className="flex-1 rounded-t-[2rem] bg-background px-6 py-4 dark:bg-gray-900">
            {/* 顶部手势指示条 */}
            <div className="mx-auto mb-6 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20" />
            
            <div className="mx-auto max-w-md">
              <Drawer.Title className="mb-4 text-center text-sm font-semibold tracking-widest text-muted-foreground uppercase opacity-60">
                {menuLabel}
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
                        className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-[15px] font-bold tracking-wide transition-all ${
                          isActive
                            ? 'bg-primary-500/10 text-primary-600 dark:bg-primary-400/20 dark:text-primary-300'
                            : 'text-gray-900 hover:bg-muted/50 dark:text-gray-100 transition-colors'
                        }`}
                      >
                        <NavIcon href={link.href} className="h-5 w-5 shrink-0" />
                        <span>{link.title}</span>
                      </Link>
                      
                      {hasChildren && (
                        <div className="ml-9 mt-1 flex flex-col space-y-1">
                          {link.children!.map((child) => {
                            const isChildActive = isNavLinkActive(pathname, child.href)
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13.5px] font-bold transition-all ${
                                  isChildActive
                                    ? 'text-primary-600 dark:text-primary-300'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                <NavIcon href={child.href} className="h-4 w-4 shrink-0" />
                                <span>{child.title}</span>
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
          
          <div className="h-6 w-full" /> {/* 底部缓冲空间 */}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export default MobileNav
