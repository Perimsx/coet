export type HeaderNavLink = {
  href: string
  title: string
  children?: {
    href: string
    title: string
  }[]
}

const headerNavLinks: HeaderNavLink[] = [
  { href: "/", title: "首页" },
  { href: "/archive", title: "归档" },
  { href: "/friends", title: "友链" },
  { href: "/logs", title: "日志" },
  { href: "/about", title: "关于" },
]

export default headerNavLinks
