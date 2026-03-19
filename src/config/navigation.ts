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
  { href: "/projects", title: "项目" },
  { href: "/about", title: "关于" },
  { href: "/friends", title: "友链" },
]

export default headerNavLinks
