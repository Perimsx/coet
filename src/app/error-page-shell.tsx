'use client'

import { ThemeProviders } from '@/app/theme-providers'
import BackgroundDecoration from '@/features/site/components/BackgroundDecoration'
import HeaderClient from '@/features/site/components/HeaderClient'
import BrandLogo from '@/shared/media/BrandLogo'
import Link from '@/shared/components/Link'
import { siteMetadata } from '@/blog.config'
import LegalInfo from '@/features/site/components/LegalInfo'
import { ScrollReveal } from '@/shared/components/ScrollReveal'
import type { ReactNode } from 'react'

const zeroStats = {
  postCount: 0,
  tagCount: 0,
  categoryCount: 0,
  friendCount: 0,
  commitCount: 0,
}

function ErrorHeader() {
  const logo = (
    <Link href="/" aria-label={siteMetadata.headerTitle} className="group relative flex shrink-0 items-center gap-2.5 outline-none transition-all duration-300 hover:opacity-80 active:scale-95">
      <BrandLogo className="relative h-8 w-8 shrink-0 sm:h-[34px] sm:w-[34px]" alt={siteMetadata.headerTitle} />
      <span className="hidden items-start text-lg font-black tracking-tighter text-foreground sm:flex sm:text-xl">
        {siteMetadata.title}
        <span className="ml-0.5 mt-0.5 text-[10px] font-medium leading-none text-muted-foreground/50">©</span>
      </span>
    </Link>
  )

  return (
    <HeaderClient
      fixedNav
      logo={logo}
      centerContent={null}
      navContent={null}
      mobileMenu={null}
      stats={zeroStats}
    />
  )
}

function ErrorFooter() {
  return (
    <ScrollReveal>
      <footer className="mt-0.5 pt-0.5 sm:mt-0.5 sm:pt-0.5">
        <div className="pb-4">
          <LegalInfo />
        </div>
      </footer>
    </ScrollReveal>
  )
}

export default function ErrorPageShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProviders>
      <main className="relative min-h-dvh bg-background text-foreground overflow-x-hidden flex flex-col justify-between selection:bg-accent/20 transition-colors duration-500">
        <BackgroundDecoration />
        <ErrorHeader />
        <div className="relative z-10 mx-auto max-w-5xl w-full px-6 pt-28 pb-12 sm:pt-36 sm:pb-16 md:pt-44 md:pb-20 flex flex-col items-center text-center my-auto">
          {children}
        </div>
        <ErrorFooter />
      </main>
    </ThemeProviders>
  )
}
