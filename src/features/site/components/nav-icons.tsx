import { 
  Home, 
  NotebookPen, 
  LibraryBig, 
  Hash, 
  User, 
  LayoutDashboard, 
  HeartHandshake, 
  Layers, 
  ChevronDown, 
  Construction, 
  Mail,
  Activity,
  type LucideIcon 
} from 'lucide-react'

export { ChevronDown, Construction }

const navIconMap: Record<string, LucideIcon> = {
  '/': Home,
  '/blog': NotebookPen,
  '/archive': LibraryBig,
  '/tags': Hash,
  '/blog/category': Layers,
  '/about': User,
  '/projects': Layers,
  '/logs': Activity,
  '/admin': LayoutDashboard,
  '/friends': HeartHandshake,
  'suggestion': Mail,
}

export function NavIcon({ href, className }: { href: string; className?: string }) {
  // 匹配前缀以支持子页面图标
  const matchedKey = Object.keys(navIconMap)
    .sort((a, b) => b.length - a.length)
    .find(key => href === key || (key !== '/' && href.startsWith(key)))
  
  const Icon = (matchedKey ? navIconMap[matchedKey] : navIconMap['/']) || Home

  return <Icon aria-hidden className={className || 'h-4 w-4'} />
}

export function isNavLinkActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}
