import { GoogleTagManager } from '@next/third-parties/google'
import './globals.css'
import './blog.css'
import 'remark-github-blockquote-alert/alert.css'

import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Fira_Code } from 'next/font/google'
import { brandingConfig, siteMetadata } from '@/blog.config'
import { cn } from '@/shared/utils/utils'
import {
  genWebSiteJsonLd,
  joinSiteUrl,
  languageToOgLocale,
  normalizeSiteUrl,
  parseSeoKeywords,
  resolveImageUrl,
} from '@/features/site/lib/seo'

const firaCode = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fira',
})

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = normalizeSiteUrl(siteMetadata.siteUrl)
  const socialBanner = resolveImageUrl(siteUrl, siteMetadata.socialBanner) || joinSiteUrl(siteUrl, '/')
  const siteTitle = siteMetadata.title
  const siteDescription = siteMetadata.description
  const siteAuthor = siteMetadata.author || siteTitle

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
      apple: [{ url: brandingConfig.appleTouchIcon, sizes: '180x180', type: 'image/png' }],
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
      google: siteMetadata.googleSearchConsole,
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
  const htmlLang = siteMetadata.language || 'zh-CN'
  const siteUrl = normalizeSiteUrl(siteMetadata.siteUrl)
  const siteTitle = siteMetadata.title
  const siteAuthor = siteMetadata.author || siteTitle

  const webSiteJsonLd = genWebSiteJsonLd(siteTitle, siteUrl, siteMetadata.description)
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteTitle,
    url: siteUrl,
    logo: joinSiteUrl(siteUrl, brandingConfig.logo),
    sameAs: [siteMetadata.github, siteMetadata.x, siteMetadata.yuque].filter(Boolean),
  }
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteAuthor,
    url: siteUrl,
    image: resolveImageUrl(siteUrl, brandingConfig.ogImage),
    sameAs: [siteMetadata.github, siteMetadata.x, siteMetadata.yuque].filter(Boolean),
  }

  return (
    <html
      lang={htmlLang}
      className={cn('scroll-smooth overflow-x-hidden w-full', firaCode.variable)}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="dns-prefetch" href="https://cn-font.claude-code-best.win" />
        <link rel="preconnect" href="https://cn-font.claude-code-best.win" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cn-font.claude-code-best.win/packages/lxgwwenkaibright/dist/LXGWBright-Medium/result.css"
        />
        <meta name="baidu-site-verification" content="codeva-PzTCdVnifM" />
        {brandingConfig.maskIcon ? (
          <link rel="mask-icon" href={brandingConfig.maskIcon} color="#5bbad5" />
        ) : null}
        <meta name="msapplication-TileColor" content="#000000" />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-923KSYBNY1"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-923KSYBNY1');",
          }}
        />
        <Script
          id="kb-theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('kb_theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark');else document.documentElement.classList.add('light')}catch(e){}})()",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <GoogleTagManager gtmId="GTM-W3XWTM5C" />
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
