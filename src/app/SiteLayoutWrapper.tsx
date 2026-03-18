"use client"
import { usePathname } from "next/navigation"

export function SiteLayoutWrapper({
  children,
  frontendLayout,
}: {
  children: React.ReactNode
  frontendLayout: React.ReactNode
}) {
  const pathname = usePathname()

  if (pathname?.startsWith("/admin")) {
    return <main className="mb-auto w-full">{children}</main>
  }

  return <>{frontendLayout}</>
}
