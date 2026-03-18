import { MetadataRoute } from 'next'
import { getSeoContext, joinSiteUrl } from '@/features/site/lib/seo'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { siteUrl } = await getSeoContext()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*'],
      },
    ],
    sitemap: joinSiteUrl(siteUrl, '/sitemap.xml'),
    host: siteUrl,
  }
}
