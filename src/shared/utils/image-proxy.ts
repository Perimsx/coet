/**
 * 图像代理工具类
 * 用于处理外链图片的路径标准化、防盗链绕过及代理 URL 生成。
 */
const basePath = process.env.BASE_PATH || ''

// 默认开启防盗链保护的域名列表（这些域名通常不允许直接外链调用）
const DEFAULT_HOTLINK_DOMAINS = [
  'nlark.com',
  'yuque.com',
  'zhimg.com',
  'sinaimg.cn',
  'csdnimg.cn',
  'xiaohongshu.com',
  'xiaohongshu.net',
  'qlogo.cn',
  'qpic.cn',
  'alicdn.com',
  'byteimg.com',
  'toutiaoimg.com',
  'bcebos.com',
  'doubanio.com',
  'jianshu.io',
  'juejinimg.com',
  'weibo.com',
]

const HOTLINK_DOMAINS = Array.from(
  new Set([
    ...DEFAULT_HOTLINK_DOMAINS,
    ...(process.env.IMAGE_PROXY_DOMAINS || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  ])
)

/**
 * 针对特定域名设置伪造的 Referer
 */
const REFERER_BY_DOMAIN: Record<string, string[]> = {
  'nlark.com': ['https://www.yuque.com/'],
  'yuque.com': ['https://www.yuque.com/'],
  'zhimg.com': ['https://www.zhihu.com/'],
  'sinaimg.cn': ['https://weibo.com/', 'https://www.weibo.com/'],
  'weibo.com': ['https://weibo.com/', 'https://www.weibo.com/'],
  'csdnimg.cn': ['https://www.csdn.net/'],
  'juejinimg.com': ['https://juejin.cn/'],
  'xiaohongshu.com': ['https://www.xiaohongshu.com/'],
  'xiaohongshu.net': ['https://www.xiaohongshu.com/'],
  'qlogo.cn': ['https://qzone.qq.com/'],
  'qpic.cn': ['https://qzone.qq.com/'],
}

function isAbsoluteUrl(value: string) {
  return /^(?:https?:)?\/\//i.test(value)
}

function toSafeUrl(value: string) {
  if (!value) return null

  try {
    if (value.startsWith('//')) {
      return new URL(`https:${value}`)
    }
    return new URL(value)
  } catch {
    return null
  }
}

/**
 * 标准化图片 Source 路径
 * 处理相对路径、Base 路径补充及各种协议过滤。
 */
export function normalizeImageSrc(src: string) {
  if (!src) return src

  if (!basePath) {
    return src
  }

  if (isAbsoluteUrl(src) || src.startsWith('data:') || src.startsWith('blob:')) {
    return src
  }

  if (src.startsWith(`${basePath}/`)) {
    return src
  }

  if (src.startsWith('/')) {
    return `${basePath}${src}`
  }

  return src
}

export function isHotlinkProtectedHost(hostname: string) {
  const lower = hostname.toLowerCase()
  return HOTLINK_DOMAINS.some((domain) => lower === domain || lower.endsWith(`.${domain}`))
}

export function shouldProxyImageSrc(src: string) {
  const parsed = toSafeUrl(src)
  if (!parsed) return false
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
  return isHotlinkProtectedHost(parsed.hostname)
}

export function toProxiedImageSrc(src: string) {
  const normalized = normalizeImageSrc(src)
  if (!shouldProxyImageSrc(normalized)) {
    return normalized
  }
  return `${basePath}/api/image-proxy?url=${encodeURIComponent(normalized)}`
}

export function getImageSourceCandidates(src: string) {
  const normalized = normalizeImageSrc(src)
  if (!normalized) return []
  const proxied = toProxiedImageSrc(normalized)
  return Array.from(new Set([proxied, normalized]))
}

export function getImageProxyReferers(target: URL) {
  const referers: string[] = [`${target.protocol}//${target.host}/`]

  const hostname = target.hostname.toLowerCase()
  Object.entries(REFERER_BY_DOMAIN).forEach(([domain, values]) => {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) {
      referers.push(...values)
    }
  })

  if (isHotlinkProtectedHost(target.hostname) && referers.length === 1) {
    referers.push('https://www.yuque.com/')
  }

  return Array.from(new Set(referers))
}
