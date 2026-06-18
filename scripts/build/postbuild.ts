import { copyFileSync, existsSync, mkdirSync, writeFileSync, cpSync } from "fs"
import path from "path"

import rss from "./rss"

function clearInsecureTlsOverride() {
  if (String(process.env.NODE_TLS_REJECT_UNAUTHORIZED || "").trim() !== "0") {
    return
  }

  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
}

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

function copyStandaloneAssets() {
  const standaloneDir = path.join(process.cwd(), ".next", "standalone")
  if (!existsSync(standaloneDir)) return

  // .next/static → .next/standalone/.next/static
  const staticDir = path.join(process.cwd(), ".next", "static")
  const staticDest = path.join(standaloneDir, ".next", "static")
  if (existsSync(staticDir)) {
    mkdirSync(staticDest, { recursive: true })
    cpSync(staticDir, staticDest, { recursive: true })
    console.log("[postbuild] .next/static → .next/standalone/.next/static")
  }

  // public → .next/standalone/public
  const publicDir = path.join(process.cwd(), "public")
  const publicDest = path.join(standaloneDir, "public")
  if (existsSync(publicDir)) {
    mkdirSync(publicDest, { recursive: true })
    cpSync(publicDir, publicDest, { recursive: true })
    console.log("[postbuild] public → .next/standalone/public")
  }
}

export default async function postbuild() {
  clearInsecureTlsOverride()
  syncBrandingFavicon()
  writeIndexNowKeyFile()
  copyStandaloneAssets()
  await rss()
}

postbuild()
