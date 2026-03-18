import { copyFileSync, existsSync } from 'fs'
import path from 'path'
import rss from './rss'

export default async function postbuild() {
  const brandingFavicon = path.join(process.cwd(), 'public', 'branding', 'favicon.ico')
  const rootFavicon = path.join(process.cwd(), 'public', 'favicon.ico')

  if (existsSync(brandingFavicon)) {
    copyFileSync(brandingFavicon, rootFavicon)
  }

  await rss()
}

postbuild()
