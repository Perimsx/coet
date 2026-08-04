import './globals.css'
import './blog.css'
import 'remark-github-blockquote-alert/alert.css'
import '@heroui/styles'

import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { brandingConfig, siteMetadata } from '@/blog.config'
import { cn } from '@/shared/utils/utils'
import {
  genWebSiteJsonLd,
  languageToOgLocale,
  parseSeoKeywords,
} from '@/features/site/lib/seo'
import {
  joinSiteUrl,
  normalizeSiteUrl,
  resolveImageUrl,
} from '@/shared/utils/site-url'
import { getSiteSettings } from '@/features/site/services/site-settings'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const siteUrl = normalizeSiteUrl(settings.siteUrl || siteMetadata.siteUrl)
  const socialBanner =
    resolveImageUrl(
      siteUrl,
      settings.socialBanner || siteMetadata.socialBanner
    ) || joinSiteUrl(siteUrl, '/')
  const siteTitle = settings.title || siteMetadata.title
  const siteDescription = settings.description || siteMetadata.description
  const siteAuthor = settings.author || siteMetadata.author || siteTitle

  return {
    metadataBase: new URL(siteUrl),
    applicationName: siteTitle,
    title: {
      default: `首页 | ${siteTitle}`,
      template: `%s | ${siteTitle}`,
    },
    description: siteDescription,
    keywords: parseSeoKeywords(''),
    authors: [{ name: siteAuthor, url: siteUrl }],
    creator: siteAuthor,
    publisher: siteTitle,
    category: 'technology',
    referrer: 'origin-when-cross-origin',
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      url: joinSiteUrl(siteUrl, '/'),
      siteName: siteTitle,
      images: [{ url: socialBanner, width: 1200, height: 630, alt: siteTitle }],
      locale: languageToOgLocale(siteMetadata.language),
      type: 'website',
    },
    alternates: {
      canonical: joinSiteUrl(siteUrl, '/'),
      types: {
        'application/rss+xml': joinSiteUrl(siteUrl, '/feed.xml'),
      },
    },
    manifest: joinSiteUrl(siteUrl, '/manifest.webmanifest'),
    icons: {
      icon: [
        { url: brandingConfig.favicon, type: 'image/x-icon' },
        { url: brandingConfig.favicon32, sizes: '32x32', type: 'image/png' },
        { url: brandingConfig.favicon16, sizes: '16x16', type: 'image/png' },
      ],
      shortcut: [{ url: brandingConfig.favicon }],
      apple: [
        {
          url: brandingConfig.appleTouchIcon,
          sizes: '180x180',
          type: 'image/png',
        },
      ],
    },
    formatDetection: {
      telephone: false,
      address: false,
      email: false,
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
      title: siteTitle,
      description: siteDescription,
      card: 'summary_large_image',
      images: [{ url: socialBanner, width: 1200, height: 630, alt: siteTitle }],
    },
    verification: {
      google: settings.googleSearchConsole || siteMetadata.googleSearchConsole,
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSiteSettings()
  const htmlLang = siteMetadata.language || 'zh-CN'
  const siteUrl = normalizeSiteUrl(settings.siteUrl || siteMetadata.siteUrl)
  const siteTitle = settings.title || siteMetadata.title
  const siteAuthor = settings.author || siteMetadata.author || siteTitle

  const webSiteJsonLd = genWebSiteJsonLd(
    siteTitle,
    siteUrl,
    settings.description || siteMetadata.description
  )
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteTitle,
    url: siteUrl,
    logo: joinSiteUrl(siteUrl, brandingConfig.logo),
    sameAs: [settings.github, settings.x, settings.yuque].filter(Boolean),
  }
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteAuthor,
    url: siteUrl,
    image: resolveImageUrl(siteUrl, brandingConfig.ogImage),
    sameAs: [settings.github, settings.x, settings.yuque].filter(Boolean),
  }

  return (
    <html
      lang={htmlLang}
      className={cn('scroll-smooth overflow-x-hidden w-full')}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <meta name="baidu-site-verification" content="codeva-PzTCdVnifM" />
        {brandingConfig.maskIcon ? (
          <link
            rel="mask-icon"
            href={brandingConfig.maskIcon}
            color="#5bbad5"
          />
        ) : null}
        <meta name="msapplication-TileColor" content="#000000" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body className="js-disabled min-h-dvh bg-background text-foreground antialiased overflow-x-hidden">
        {children}
        <Script
          id="js-cleanup-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: "document.body.classList.remove('js-disabled')",
          }}
        />
      </body>
    </html>
  )
}
