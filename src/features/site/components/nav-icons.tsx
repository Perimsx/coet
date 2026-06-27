import {
  Home,
  NotebookPen,
  LibraryBig,
  BookOpen,
  Hash,
  User,
  LayoutDashboard,
  HeartHandshake,
  Layers,
  ChevronDown,
  Mail,
  Activity,
  type LucideIcon
} from 'lucide-react'

export { ChevronDown }

const navIconMap: Record<string, LucideIcon> = {
  '/': Home,
  '/blog': NotebookPen,
  '/kb': BookOpen,
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

export function isNavLinkActive(pathname: string, href: string, children?: { href: string }[]) {
  if (href === '/') {
    return pathname === '/'
  }

  // 1. 检查主路径匹配
  const isDirectMatch = pathname === href || pathname.startsWith(`${href}/`)
  if (isDirectMatch) return true

  // 2. 博客详情页 (/blog/xxx) 同时高亮 /blog 和 /archive 主项
  //    排除 /blog/category/ 和 /blog/page/ 等子路由
  if (pathname.startsWith('/blog/') && !pathname.startsWith('/blog/category/') && !pathname.startsWith('/blog/page/') && (href === '/blog' || href === '/archive')) {
    return true
  }

  // 3. 递归检查子菜单匹配
  if (children && children.length > 0) {
    return children.some(child => pathname === child.href || pathname.startsWith(`${child.href}/`))
  }

  return false
}
