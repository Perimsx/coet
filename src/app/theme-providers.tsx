'use client'

import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { siteMetadata } from '@/blog.config'
import { LanguageProvider } from '@/shared/contexts/LanguageContext'
import { MotionConfig } from 'framer-motion'
import { useEffect, useState } from 'react'

export function ThemeProviders({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mql.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme={siteMetadata.theme} enableSystem={false}>
      <LanguageProvider>
        <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
          <TooltipProvider delayDuration={300}>
            {children}
          </TooltipProvider>
        </MotionConfig>
      </LanguageProvider>
    </ThemeProvider>
  )
}
