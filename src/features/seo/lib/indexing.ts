import { normalizeSiteUrl } from '@/features/site/lib/seo'

/**
 * IndexNow 推送协议实现
 * 覆盖 Bing, Yandex 等
 */
export async function pushToIndexNow(siteUrl: string, urlList: string[], key: string) {
  const host = new URL(normalizeSiteUrl(siteUrl)).host
  const endpoint = 'https://api.indexnow.org/indexnow'
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${normalizeSiteUrl(siteUrl)}/${key}.txt`,
        urlList: urlList.map(url => url.startsWith('http') ? url : `${normalizeSiteUrl(siteUrl)}${url}`),
      }),
    })
    
    return { success: response.status === 200 || response.status === 202, status: response.status }
  } catch (error) {
    console.error('IndexNow Push Error:', error)
    return { success: false, error }
  }
}

/**
 * 百度链接提交 (API 手动模式)
 */
export async function pushToBaidu(siteUrl: string, urlList: string[], token: string) {
  const host = new URL(normalizeSiteUrl(siteUrl)).host
  const endpoint = `http://data.zz.baidu.com/urls?site=${host}&token=${token}`
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: urlList.map(url => url.startsWith('http') ? url : `${normalizeSiteUrl(siteUrl)}${url}`).join('\n'),
    })
    
    const data = await response.json()
    return { success: !!data.success, data }
  } catch (error) {
    console.error('Baidu Push Error:', error)
    return { success: false, error }
  }
}
