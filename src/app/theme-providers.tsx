'use client'

import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { siteMetadata } from '@/blog.config'
import { LanguageProvider } from '@/shared/contexts/LanguageContext'
import { MotionConfig } from 'framer-motion'
import { useSyncExternalStore } from 'react'

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getServerSnapshot() {
  return false
}

export function ThemeProviders({ children }: { children: React.ReactNode }) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  )

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
