import { 
  Home, 
  NotebookPen, 
  Archive, 
  Tag, 
  User, 
  LayoutDashboard, 
  HeartHandshake, 
  Folder, 
  ChevronDown, 
  Construction, 
  Mail,
  type LucideIcon 
} from 'lucide-react'

export { ChevronDown, Construction }

const navIconMap: Record<string, LucideIcon> = {
  '/': Home,
  '/blog': NotebookPen,
  '/archive': Archive,
  '/tags': Tag,
  '/about': User,
  '/projects': Folder,
  '/admin': LayoutDashboard,
  '/friends': HeartHandshake,
  'suggestion': Mail,
}

export function NavIcon({ href, className }: { href: string; className?: string }) {
  const Icon = navIconMap[href] ?? Home

  return <Icon aria-hidden className={className || 'h-4 w-4'} />
}

export function isNavLinkActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}
