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
  {
    href: "/archive",
    title: "文章",
    children: [
      { href: "/archive", title: "文章归档" },
      { href: "/blog/category", title: "分类浏览" },
      { href: "/tags", title: "标签云" },
    ],
  },
  { href: "/friends", title: "友链" },
  { href: "/about", title: "关于" },
]

export default headerNavLinks
