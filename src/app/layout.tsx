import "./globals.css";
import "pliny/search/algolia.css";
import "remark-github-blockquote-alert/alert.css";

import { Inter, Fira_Code } from 'next/font/google';
import { cn } from "@/shared/utils/utils";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fira',
});

import type { Metadata, Viewport } from "next";

import { Analytics, type AnalyticsConfig } from "pliny/analytics";
import type { SearchConfig } from "pliny/search";

import { brandingConfig, siteMetadata } from "@/blog.config";
import SearchProvider from "@/features/search/components/SearchProvider";
import Footer from "@/features/site/components/Footer";
import Header from "@/features/site/components/Header";
import SectionContainer from "@/features/site/components/SectionContainer";
import {
  genWebSiteJsonLd,
  joinSiteUrl,
  languageToOgLocale,
  normalizeSiteUrl,
  parseSeoKeywords,
  resolveImageUrl,
} from "@/features/site/lib/seo";
import { ThemeProviders } from "./theme-providers";

import { InteractiveBackground } from "@/features/site/components/BackgroundWrapper";


export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = normalizeSiteUrl(siteMetadata.siteUrl);
  const socialBanner =
    resolveImageUrl(
      siteUrl,
      siteMetadata.socialBanner,
    ) || joinSiteUrl(siteUrl, "/");
  const siteTitle = siteMetadata.title;
  const siteDescription = siteMetadata.description;
  const siteAuthor = siteMetadata.author || siteTitle;

  return {
    metadataBase: new URL(siteUrl),
    applicationName: siteTitle,
    title: {
      default: `首页 | ${siteTitle}`,
      template: `%s | ${siteTitle}`,
    },
    description: siteDescription,
    keywords: parseSeoKeywords(""),
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
      icon: [
        { url: brandingConfig.favicon, type: "image/x-icon" },
        { url: brandingConfig.favicon32, sizes: "32x32", type: "image/png" },
        { url: brandingConfig.favicon16, sizes: "16x16", type: "image/png" },
      ],
      shortcut: [{ url: brandingConfig.favicon }],
      apple: [
        {
          url: brandingConfig.appleTouchIcon,
          sizes: "180x180",
          type: "image/png",
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
      google: siteMetadata.googleSearchConsole,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const htmlLang = siteMetadata.language || "zh-CN";
  const siteUrl = normalizeSiteUrl(siteMetadata.siteUrl);
  const siteTitle = siteMetadata.title;
  const siteAuthor = siteMetadata.author || siteTitle;

  // 在 SSG 模式下，我们无法在服务端通过 headers 获取 pathname。
  // 管理员界面的特殊布局建议通过路由组 (admin) 自行管理。
  // 这里暂时移除动态判断以支持静态导出。

  const webSiteJsonLd = genWebSiteJsonLd(
    siteTitle,
    siteUrl,
    siteMetadata.description,
  );
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteTitle,
    url: siteUrl,
    logo: joinSiteUrl(siteUrl, brandingConfig.logo),
    sameAs: [siteMetadata.github, siteMetadata.x, siteMetadata.yuque].filter(Boolean),
  };
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteAuthor,
    url: siteUrl,
    image: resolveImageUrl(
      siteUrl,
      brandingConfig.ogImage,
    ),
    sameAs: [siteMetadata.github, siteMetadata.x, siteMetadata.yuque].filter(Boolean),
  };

  return (
    <html
      lang={htmlLang}
      className={cn("scroll-smooth", inter.variable, firaCode.variable)}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="dns-prefetch" href="https://ipwhois.app" />
        <link rel="dns-prefetch" href="https://api.ip.sb" />
        <link rel="preconnect" href="https://ipwhois.app" crossOrigin="anonymous" />
        <link rel="mask-icon" href={brandingConfig.maskIcon} color="#5bbad5" />
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
      <body className="bg-transparent text-foreground antialiased overflow-x-hidden">
        <ThemeProviders>
          
          <InteractiveBackground />
          <div className="relative z-10">
            <Analytics
              analyticsConfig={siteMetadata.analytics as AnalyticsConfig}
            />
            <SectionContainer>
              <SearchProvider
                searchConfig={siteMetadata.search as SearchConfig}
              >
                <Header />
                <main className="mb-auto">{children}</main>
              </SearchProvider>
              <Footer />
            </SectionContainer>
          </div>
        </ThemeProviders>
      </body>
    </html>
  );
}
