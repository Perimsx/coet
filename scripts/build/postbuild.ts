import { copyFileSync, existsSync } from 'fs'
import path from 'path'
import rss from './rss'

export default async function postbuild() {
  // 定义品牌图标与根目录图标路径
  const brandingFavicon = path.join(process.cwd(), 'public', 'branding', 'favicon.ico')
  const rootFavicon = path.join(process.cwd(), 'public', 'favicon.ico')

  // 如果存在品牌专属图标，则将其复制到 public 根目录，以修复 Next.js 15 这里的元数据图标逻辑
  if (existsSync(brandingFavicon)) {
    copyFileSync(brandingFavicon, rootFavicon)
  }

  // 生成 RSS 订阅源
  await rss()
}

postbuild()
