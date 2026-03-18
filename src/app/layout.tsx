import './globals.css'
import 'pliny/search/algolia.css'
import 'remark-github-blockquote-alert/alert.css'

import { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Outfit } from 'next/font/google'
import { Analytics, AnalyticsConfig } from 'pliny/analytics'
import type { SearchConfig } from 'pliny/search'

import brandingConfig from '@/config/branding'
import siteMetadata from '@/config/site'
import Footer from '@/features/site/components/Footer'
import Header from '@/features/site/components/Header'
import SectionContainer from '@/features/site/components/SectionContainer'
import { genWebSiteJsonLd, joinSiteUrl, normalizeSiteUrl, parseSeoKeywords, resolveImageUrl } from '@/features/site/lib/seo'
import SearchProvider from '@/features/search/components/SearchProvider'
import { getSiteSettings } from '@/server/site-settings'

import { ThemeProviders } from './theme-providers'

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const siteUrl = normalizeSiteUrl(settings.siteUrl || siteMetadata.siteUrl)
  const socialBanner =
    resolveImageUrl(siteUrl, settings.socialBanner || siteMetadata.socialBanner) || joinSiteUrl(siteUrl, '/')

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.title,
      template: `%s | ${settings.title}`,
    },
    description: settings.description,
    keywords: parseSeoKeywords(settings.seoKeywords),
    openGraph: {
      title: settings.title,
      description: settings.description,
      url: joinSiteUrl(siteUrl, '/'),
      siteName: settings.title,
      images: [socialBanner],
      locale: 'zh_CN',
      type: 'website',
    },
    alternates: {
      canonical: joinSiteUrl(siteUrl, '/'),
      types: {
        'application/rss+xml': joinSiteUrl(siteUrl, '/feed.xml'),
      },
    },
    manifest: brandingConfig.manifest,
    icons: {
      icon: [{ url: brandingConfig.favicon }],
      shortcut: [{ url: brandingConfig.favicon }],
      apple: [{ url: brandingConfig.appleTouchIcon }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    twitter: {
      title: settings.title,
      description: settings.description,
      card: 'summary_large_image',
      images: [socialBanner],
    },
    verification: {
      google: settings.googleSearchConsole,
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fff' },
    { media: '(prefers-color-scheme: dark)', color: '#000' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const htmlLang = 'zh-CN'
  const settings = await getSiteSettings()
  const siteUrl = normalizeSiteUrl(settings.siteUrl || siteMetadata.siteUrl)
  const requestHeaders = await headers()
  const isAdminShell = requestHeaders.get('x-app-shell') === 'admin'
  const pathname = requestHeaders.get('x-pathname') || ''
  const isGamePage = /\/(?:[a-z]{2}\/)?game\/cube(?:\/|$)/.test(pathname)

  const webSiteJsonLd = genWebSiteJsonLd(settings.title, siteUrl, settings.description)

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.title,
    url: siteUrl,
    logo: joinSiteUrl(siteUrl, brandingConfig.logo),
    sameAs: [settings.github, settings.x, settings.yuque].filter(Boolean),
  }

  return (
    <html
      lang={htmlLang}
      className={`${outfit.variable} scroll-smooth`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="mask-icon" href={brandingConfig.maskIcon} color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#000000" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="bg-background text-foreground pl-[calc(100vw-100%)] antialiased">
        <ThemeProviders>
          {isAdminShell ? (
            children
          ) : (
            <>
              <Analytics analyticsConfig={siteMetadata.analytics as AnalyticsConfig} />
              <SectionContainer>
                <SearchProvider searchConfig={siteMetadata.search as SearchConfig}>
                  <Header />
                  <main className="mb-auto">{children}</main>
                </SearchProvider>
                {!isGamePage && <Footer />}
              </SectionContainer>
            </>
          )}
        </ThemeProviders>
      </body>
    </html>
  )
}
