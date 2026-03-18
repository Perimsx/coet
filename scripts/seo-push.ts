import 'dotenv/config'
import { allBlogs } from '../.contentlayer/generated'
import { pushToIndexNow, pushToBaidu } from '../src/features/seo/lib/indexing'
import siteMetadata from '../src/config/site'

/**
 * SEO 一键推送脚本
 * 用法: tsx scripts/seo-push.ts
 */
async function runPush() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || siteMetadata.siteUrl
  const baiduToken = process.env.BAIDU_PUSH_TOKEN
  const indexNowKey = process.env.INDEXNOW_KEY

  if (!siteUrl) {
    console.error('未找到 siteUrl。请检查 .env 文件或 config/site.ts 配置。')
    return
  }

  const urls = [
    `${siteUrl}/`,
    `${siteUrl}/blog`,
    ...allBlogs.filter(p => !p.draft).map(p => `${siteUrl}/${p.path}`)
  ]

  console.log(`🚀 正在开始推送 ${urls.length} 个 URL 到搜索引擎...`)

  if (baiduToken) {
    console.log('正在推送到百度...')
    const res = await pushToBaidu(siteUrl, urls, baiduToken)
    console.log('百度响应:', res)
  } else {
    console.warn('⚠️  未找到百度推送 Token (BAIDU_PUSH_TOKEN)，已跳过...')
  }

  if (indexNowKey) {
    console.log('正在推送到 IndexNow...')
    const res = await pushToIndexNow(siteUrl, urls, indexNowKey)
    console.log('IndexNow 响应:', res)
  } else {
    console.warn('⚠️  未找到 IndexNow Key (INDEXNOW_KEY)，已跳过...')
  }

  console.log('✅ SEO 推送流程已结束。')
}

runPush().catch(console.error)
