import type { MetadataRoute } from "next"

import brandingConfig from "@/config/branding"
import siteMetadata from "@/config/site"
import { getSiteSettings } from "@/server/site-settings"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings()
  const name = settings.title || siteMetadata.title
  const shortName = (settings.headerTitle || name).slice(0, 32)
  const description = settings.description || siteMetadata.description

  return {
    name,
    short_name: shortName,
    description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: brandingConfig.logo,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: brandingConfig.favicon,
        sizes: "48x48 32x32 16x16",
        type: "image/x-icon",
        purpose: "any",
      },
    ],
  }
}
