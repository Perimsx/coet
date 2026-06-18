import type { MetadataRoute } from "next"

export const dynamic = "force-static";


import { getSeoContext } from "@/features/site/lib/seo"
import { joinSiteUrl } from "@/shared/utils/site-url"


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
    ],
    host: siteUrl,
  }
}
