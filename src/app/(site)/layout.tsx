import dynamic from 'next/dynamic'
import { Analytics, type AnalyticsConfig } from 'pliny/analytics'
import type { SearchConfig } from 'pliny/search'
import { siteMetadata } from '@/blog.config'
import Footer from '@/features/site/components/Footer'
import Header from '@/features/site/components/Header'
import { InteractiveBackground } from '@/features/site/components/BackgroundWrapper'
import SectionContainer from '@/features/site/components/SectionContainer'
import { ThemeProviders } from '@/app/theme-providers'

const SearchProvider = dynamic(() => import('@/features/search/components/SearchProvider'))

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProviders>
      <div className="blog-root min-h-dvh bg-background text-foreground">
        <InteractiveBackground />
        <div className="relative z-10">
          <Analytics analyticsConfig={siteMetadata.analytics as AnalyticsConfig} />
          <SectionContainer>
            <SearchProvider searchConfig={siteMetadata.search as SearchConfig}>
              <Header />
              <main className="mb-auto">{children}</main>
            </SearchProvider>
            <Footer />
          </SectionContainer>
        </div>
      </div>
    </ThemeProviders>
  )
}
