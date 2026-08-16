export interface Metadata {
  title?: string | { default?: string; template?: string; absolute?: string }
  description?: string
  keywords?: string | string[]
  authors?: Array<{ name: string; url?: string }>
  creator?: string
  publisher?: string
  category?: string
  referrer?: string
  metadataBase?: URL
  applicationName?: string
  openGraph?: Record<string, unknown>
  twitter?: Record<string, unknown>
  alternates?: {
    canonical?: string | URL
    types?: Record<string, string>
  }
  manifest?: string
  icons?: unknown
  formatDetection?: Record<string, unknown>
  robots?: unknown
  verification?: Record<string, unknown>
}

export type Viewport = {
  themeColor?: Array<{ media: string; color: string }> | string
  width?: string | number
  initialScale?: number
  maximumScale?: number
  userScalable?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace MetadataRoute {
  export type Sitemap = Array<{
    url: string
    lastModified?: string | Date
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
    priority?: number
    images?: string[]
  }>
  export type Robots = {
    rules: Array<{
      userAgent: string | string[]
      allow?: string | string[]
      disallow?: string | string[]
    }>
    sitemap?: string | string[]
    host?: string
  }
  export type Manifest = Record<string, unknown>
}

