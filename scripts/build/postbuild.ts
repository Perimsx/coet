import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs"
import path from "path"

import rss from "./rss"

function syncBrandingFavicon() {
  const brandingFavicon = path.join(process.cwd(), "public", "branding", "favicon.ico")
  const rootFavicon = path.join(process.cwd(), "public", "favicon.ico")

  if (existsSync(brandingFavicon)) {
    copyFileSync(brandingFavicon, rootFavicon)
  }
}

function writeIndexNowKeyFile() {
  const key = String(process.env.INDEXNOW_KEY || "").trim()
  if (!key) return

  const publicDir = path.join(process.cwd(), "public")
  const keyFilePath = path.join(publicDir, `${key}.txt`)

  mkdirSync(publicDir, { recursive: true })
  writeFileSync(keyFilePath, `${key}\n`, "utf8")
}

export default async function postbuild() {
  syncBrandingFavicon()
  writeIndexNowKeyFile()
  await rss()
}

postbuild()
