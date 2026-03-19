export type HeaderNavLink = {
  href: string
  title: string
  children?: {
    href: string
    title: string
  }[]
}

const headerNavLinks: HeaderNavLink[] = [
  { href: "/", title: "Home" },
  { href: "/archive", title: "Archive" },
  { href: "/projects", title: "Projects" },
  { href: "/about", title: "About" },
  { href: "/friends", title: "Friends" },
]

export default headerNavLinks
