import type { MetadataRoute } from "next";

import brandingConfig from "@/config/branding";
import siteMetadata from "@/config/site";
export default function manifest(): MetadataRoute.Manifest {
  const name = siteMetadata.title;
  const shortName = name.slice(0, 32);
  const description = siteMetadata.description;

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
        src: brandingConfig.androidIcon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandingConfig.androidIcon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandingConfig.favicon,
        sizes: "48x48 32x32 16x16",
        type: "image/x-icon",
        purpose: "any",
      },
    ],
  };
}
