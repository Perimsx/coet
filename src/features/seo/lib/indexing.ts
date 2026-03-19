import { normalizeSiteUrl } from "@/features/site/lib/seo"

function buildAbsoluteUrls(siteUrl: string, urlList: string[]) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl)

  return Array.from(
    new Set(
      urlList
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) =>
          url.startsWith("http") ? url : `${normalizedSiteUrl}${url.startsWith("/") ? url : `/${url}`}`,
        ),
    ),
  )
}

export async function pushToIndexNow(siteUrl: string, urlList: string[], key: string) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl)
  const host = new URL(normalizedSiteUrl).host
  const endpoint = "https://api.indexnow.org/indexnow"
  const urls = buildAbsoluteUrls(normalizedSiteUrl, urlList)

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${normalizedSiteUrl}/${key}.txt`,
        urlList: urls,
      }),
    })

    return { success: response.status === 200 || response.status === 202, status: response.status }
  } catch (error) {
    console.error("IndexNow push failed:", error)
    return { success: false, error }
  }
}

export async function pushToBaidu(siteUrl: string, urlList: string[], token: string) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl)
  const host = new URL(normalizedSiteUrl).host
  const endpoint = `http://data.zz.baidu.com/urls?site=${host}&token=${token}`
  const urls = buildAbsoluteUrls(normalizedSiteUrl, urlList)

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: urls.join("\n"),
    })

    const data = await response.json()
    return { success: !!data.success, data }
  } catch (error) {
    console.error("Baidu push failed:", error)
    return { success: false, error }
  }
}
