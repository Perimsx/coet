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
    console.error('Missing siteUrl. Check .env or config/site.ts')
    return
  }

  const urls = [
    `${siteUrl}/`,
    `${siteUrl}/blog`,
    ...allBlogs.filter(p => !p.draft).map(p => `${siteUrl}/${p.path}`)
  ]

  console.log(`🚀 Starting SEO Push for ${urls.length} URLs...`)

  if (baiduToken) {
    console.log('Sending to Baidu...')
    const res = await pushToBaidu(siteUrl, urls, baiduToken)
    console.log('Baidu response:', res)
  } else {
    console.warn('⚠️  Baidu Token not found, skipping...')
  }

  if (indexNowKey) {
    console.log('Sending to IndexNow...')
    const res = await pushToIndexNow(siteUrl, urls, indexNowKey)
    console.log('IndexNow response:', res)
  } else {
    console.warn('⚠️  IndexNow Key not found, skipping...')
  }

  console.log('✅ SEO Push process finished.')
}

runPush().catch(console.error)
