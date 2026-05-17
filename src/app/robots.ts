import type { MetadataRoute } from "next"

export const dynamic = "force-static";


import { getSeoContext, joinSiteUrl } from "@/features/site/lib/seo"


export default async function robots(): Promise<MetadataRoute.Robots> {
  const { siteUrl } = await getSeoContext()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api", "/api/*"],
      },
    ],
    sitemap: [
      joinSiteUrl(siteUrl, "/sitemap.xml"),
      joinSiteUrl(siteUrl, "/feed.xml"),
    ],
    host: siteUrl,
  }
}
