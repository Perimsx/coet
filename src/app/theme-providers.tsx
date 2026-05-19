'use client'

import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { siteMetadata } from '@/blog.config'
import { LanguageProvider } from '@/shared/contexts/LanguageContext'

export function ThemeProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme={siteMetadata.theme} enableSystem={false}>
      <LanguageProvider>
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
