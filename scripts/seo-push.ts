import "dotenv/config"

import { allBlogs } from "../.contentlayer/generated"
import siteMetadata from "../src/config/site"
import { resolvePostCategories } from "../src/features/content/lib/post-categories"
import { pushToBaidu, pushToIndexNow } from "../src/features/seo/lib/indexing"
import { normalizeSiteUrl } from "../src/features/site/lib/seo"

function buildPushUrls(siteUrl: string) {
  const publishedPosts = allBlogs.filter((post) => !post.draft)
  const tagSet = new Set<string>()
  const categorySet = new Set<string>()

  publishedPosts.forEach((post) => {
    post.tags?.forEach((tag) => tagSet.add(`/tags/${encodeURIComponent(tag)}`))
    resolvePostCategories(post.categories, post.filePath).forEach((category) => {
      categorySet.add(`/blog/category/${encodeURIComponent(category)}`)
    })
  })

  return Array.from(
    new Set([
      "/",
      "/blog",
      "/archive",
      "/tags",
      "/about",
      "/friends",
      ...publishedPosts.map((post) => `/${post.path}`),
      ...tagSet,
      ...categorySet,
    ]),
  ).map((pathname) => `${normalizeSiteUrl(siteUrl)}${pathname}`)
}

async function runPush() {
  const siteUrl = normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || siteMetadata.siteUrl,
  )
  const baiduToken = String(process.env.BAIDU_PUSH_TOKEN || "").trim()
  const indexNowKey = String(process.env.INDEXNOW_KEY || "").trim()

  if (!siteUrl) {
    console.error("Missing site URL. Set NEXT_PUBLIC_SITE_URL or SITE_URL first.")
    process.exitCode = 1
    return
  }

  const urls = buildPushUrls(siteUrl)
  console.log(`Preparing ${urls.length} URLs for submission...`)

  if (baiduToken) {
    console.log("Submitting URLs to Baidu...")
    const result = await pushToBaidu(siteUrl, urls, baiduToken)
    console.log("Baidu result:", result)
  } else {
    console.log("Skipping Baidu push: BAIDU_PUSH_TOKEN is not set.")
  }

  if (indexNowKey) {
    console.log("Submitting URLs to IndexNow...")
    const result = await pushToIndexNow(siteUrl, urls, indexNowKey)
    console.log("IndexNow result:", result)
  } else {
    console.log("Skipping IndexNow push: INDEXNOW_KEY is not set.")
  }

  console.log("SEO submission flow completed.")
}

runPush().catch((error) => {
  console.error("SEO push failed:", error)
  process.exitCode = 1
})
