import "./globals.css"
import "pliny/search/algolia.css"
import "remark-github-blockquote-alert/alert.css"

import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import { Analytics, type AnalyticsConfig } from "pliny/analytics"
import type { SearchConfig } from "pliny/search"

import brandingConfig from "@/config/branding"
import siteMetadata from "@/config/site"
import SearchProvider from "@/features/search/components/SearchProvider"
import Footer from "@/features/site/components/Footer"
import Header from "@/features/site/components/Header"
import SectionContainer from "@/features/site/components/SectionContainer"
import {
  genWebSiteJsonLd,
  joinSiteUrl,
  languageToOgLocale,
  normalizeSiteUrl,
  parseSeoKeywords,
  resolveImageUrl,
} from "@/features/site/lib/seo"
import { getSiteSettings } from "@/server/site-settings"

import { ThemeProviders } from "./theme-providers"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const siteUrl = normalizeSiteUrl(settings.siteUrl || siteMetadata.siteUrl)
  const socialBanner =
    resolveImageUrl(siteUrl, settings.socialBanner || siteMetadata.socialBanner) ||
    joinSiteUrl(siteUrl, "/")
  const siteTitle = settings.title || siteMetadata.title
  const siteDescription = settings.description || siteMetadata.description
  const siteAuthor = siteMetadata.author || siteTitle

  return {
    metadataBase: new URL(siteUrl),
    applicationName: siteTitle,
    title: {
      default: siteTitle,
      template: `%s | ${siteTitle}`,
    },
    description: siteDescription,
    keywords: parseSeoKeywords(settings.seoKeywords),
    authors: [{ name: siteAuthor, url: siteUrl }],
    creator: siteAuthor,
    publisher: siteTitle,
    category: "technology",
    referrer: "origin-when-cross-origin",
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      url: joinSiteUrl(siteUrl, "/"),
      siteName: siteTitle,
      images: [socialBanner],
      locale: languageToOgLocale(siteMetadata.language),
      type: "website",
    },
    alternates: {
      canonical: joinSiteUrl(siteUrl, "/"),
      types: {
        "application/rss+xml": joinSiteUrl(siteUrl, "/feed.xml"),
      },
    },
    manifest: joinSiteUrl(siteUrl, "/manifest.webmanifest"),
    icons: {
      icon: [{ url: brandingConfig.favicon }],
      shortcut: [{ url: brandingConfig.favicon }],
      apple: [{ url: brandingConfig.appleTouchIcon }],
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
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    twitter: {
      title: siteTitle,
      description: siteDescription,
      card: "summary_large_image",
      images: [socialBanner],
    },
    verification: {
      google: settings.googleSearchConsole,
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const htmlLang = siteMetadata.language || "zh-CN"
  const settings = await getSiteSettings()
  const siteUrl = normalizeSiteUrl(settings.siteUrl || siteMetadata.siteUrl)
  const siteTitle = settings.title || siteMetadata.title
  const siteAuthor = siteMetadata.author || siteTitle
  const requestHeaders = await headers()
  const isAdminShell = requestHeaders.get("x-app-shell") === "admin"
  const pathname = requestHeaders.get("x-pathname") || ""
  const isGamePage = /\/(?:[a-z]{2}\/)?game\/cube(?:\/|$)/.test(pathname)

  const webSiteJsonLd = genWebSiteJsonLd(siteTitle, siteUrl, settings.description)
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteTitle,
    url: siteUrl,
    logo: joinSiteUrl(siteUrl, brandingConfig.logo),
    sameAs: [settings.github, settings.x, settings.yuque].filter(Boolean),
  }
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteAuthor,
    url: siteUrl,
    image: resolveImageUrl(siteUrl, settings.heroAvatar || brandingConfig.ogImage),
    sameAs: [settings.github, settings.x, settings.yuque].filter(Boolean),
  }

  return (
    <html
      lang={htmlLang}
      className="scroll-smooth"
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body className="bg-background pl-[calc(100vw-100%)] text-foreground antialiased">
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
