import 'server-only'
import { formatLocationToChinese } from './location-formatter'

export type CommentClientMeta = {
  ipAddress: string | null
  location: string | null
  userAgent: string | null
  browser: string | null
  os: string | null
}

export type CommentClientMetaHint = Partial<CommentClientMeta>

const locationLookupCache = new Map<string, string | null>()
const UNKNOWN_VALUES = new Set(['', 'unknown', 'undefined', 'null', 'none', 'n/a', '-', '--'])

function normalizeKnownValue(value: string | null | undefined, maxLength = 256): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return null
  if (UNKNOWN_VALUES.has(normalized.toLowerCase())) return null
  return normalized.slice(0, maxLength)
}

function pickFirstIp(value: string | null): string | null {
  if (!value) return null
  const first = value
    .split(',')
    .map((part) => part.trim())
    .find(Boolean)
  return first || null
}

function normalizeIp(value: string | null): string | null {
  if (!value) return null
  let ip = value.trim()

  if (!ip) return null

  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7)
  }

  if (ip.startsWith('[')) {
    const end = ip.indexOf(']')
    if (end > 0) {
      ip = ip.slice(1, end)
    }
  } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.replace(/:\d+$/, '')
  }

  return ip || null
}

function isPrivateIp(ip: string | null) {
  if (!ip) return true

  const lower = ip.toLowerCase()

  if (lower === '::1' || lower === 'localhost') return true
  if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')) return true

  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!ipv4Match) return false

  const a = Number(ipv4Match[1])
  const b = Number(ipv4Match[2])

  if (a === 10 || a === 127 || a === 0) return true
  if (a === 192 && b === 168) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 100 && b >= 64 && b <= 127) return true

  return false
}

function normalizeVersion(version: string | undefined | null) {
  if (!version) return ''
  return version.replace(/_/g, '.').trim()
}

function extractVersion(userAgent: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = userAgent.match(pattern)
    const raw = normalizeVersion(match?.[1])
    if (raw) return raw
  }
  return ''
}

function withVersion(name: string, version: string) {
  return version ? `${name} ${version}` : name
}

function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase()

  if (ua.includes('micromessenger')) {
    return withVersion('WeChat', extractVersion(userAgent, [/micromessenger\/([\d.]+)/i]))
  }
  if (ua.includes('weibo'))
    return withVersion('Weibo', extractVersion(userAgent, [/weibo__([\d.]+)/i]))
  if (ua.includes('qqbrowser') || ua.includes('mqqbrowser')) {
    return withVersion(
      'QQ Browser',
      extractVersion(userAgent, [/(?:qqbrowser|mqqbrowser)\/([\d.]+)/i])
    )
  }
  if (ua.includes('qq/') && !ua.includes('qqbrowser')) {
    return withVersion('QQ', extractVersion(userAgent, [/qq\/([\d.]+)/i]))
  }
  if (ua.includes('baidubrowser') || ua.includes('bidubrowser')) {
    return withVersion(
      'Baidu Browser',
      extractVersion(userAgent, [/(?:baidubrowser|bidubrowser)\/([\d.]+)/i])
    )
  }
  if (ua.includes('qhbrowser') || ua.includes('360se') || ua.includes('360ee')) {
    return withVersion(
      '360 Browser',
      extractVersion(userAgent, [/(?:qhbrowser|360browser)\/([\d.]+)/i])
    )
  }
  if (ua.includes('ucbrowser')) {
    return withVersion('UC Browser', extractVersion(userAgent, [/ucbrowser\/([\d.]+)/i]))
  }
  if (ua.includes('metasr') || ua.includes('sogoumobilebrowser')) {
    return withVersion(
      'Sogou Browser',
      extractVersion(userAgent, [/(?:metasr|sogoumobilebrowser)\/([\d.]+)/i])
    )
  }
  if (ua.includes('lbbrowser') || ua.includes('liebaofast')) {
    return withVersion(
      'Liebao Browser',
      extractVersion(userAgent, [/(?:lbbrowser|liebaofast)\/([\d.]+)/i])
    )
  }
  if (ua.includes('quark'))
    return withVersion('Quark Browser', extractVersion(userAgent, [/quark\/([\d.]+)/i]))
  if (ua.includes('dingtalk'))
    return withVersion('DingTalk', extractVersion(userAgent, [/dingtalk\/([\d.]+)/i]))
  if (ua.includes('alipayclient'))
    return withVersion('Alipay', extractVersion(userAgent, [/alipayclient\/([\d.]+)/i]))
  if (ua.includes('vivaldi'))
    return withVersion('Vivaldi', extractVersion(userAgent, [/vivaldi\/([\d.]+)/i]))
  if (ua.includes('arc/')) return withVersion('Arc', extractVersion(userAgent, [/arc\/([\d.]+)/i]))
  if (ua.includes('brave'))
    return withVersion('Brave', extractVersion(userAgent, [/brave\/([\d.]+)/i]))
  if (ua.includes('yabrowser'))
    return withVersion('Yandex Browser', extractVersion(userAgent, [/yabrowser\/([\d.]+)/i]))
  if (ua.includes('samsungbrowser')) {
    return withVersion('Samsung Internet', extractVersion(userAgent, [/samsungbrowser\/([\d.]+)/i]))
  }

  if (ua.includes('edg/') || ua.includes('edge/')) {
    return withVersion('Edge', extractVersion(userAgent, [/(?:edg|edge|edga|edgios)\/([\d.]+)/i]))
  }
  if (ua.includes('opr/') || ua.includes('opera')) {
    return withVersion('Opera', extractVersion(userAgent, [/(?:opr|opera)\/([\d.]+)/i]))
  }
  if (ua.includes('firefox/') || ua.includes('fxios/')) {
    return withVersion('Firefox', extractVersion(userAgent, [/(?:firefox|fxios)\/([\d.]+)/i]))
  }
  if (ua.includes('msie') || ua.includes('trident/')) {
    return withVersion(
      'Internet Explorer',
      extractVersion(userAgent, [/msie\s([\d.]+)/i, /rv:([\d.]+)/i])
    )
  }
  if (ua.includes('chrome/') || ua.includes('crios/')) {
    return withVersion('Chrome', extractVersion(userAgent, [/(?:chrome|crios)\/([\d.]+)/i]))
  }
  if (ua.includes('safari/') && !ua.includes('chrome/')) {
    return withVersion('Safari', extractVersion(userAgent, [/version\/([\d.]+)/i]))
  }

  return 'Unknown'
}

function detectOs(userAgent: string): string {
  const ua = userAgent.toLowerCase()

  if (ua.includes('harmonyos') || ua.includes('openharmony')) {
    return withVersion('HarmonyOS', extractVersion(userAgent, [/harmonyos(?:\/|\s)?([\d.]+)/i]))
  }
  if (ua.includes('cros')) {
    return withVersion('ChromeOS', extractVersion(userAgent, [/cros [\w.-]+ ([\d.]+)/i]))
  }
  if (ua.includes('windows')) {
    const ntVersion = extractVersion(userAgent, [/windows nt ([\d.]+)/i])
    return ntVersion ? `Windows NT ${ntVersion}` : 'Windows'
  }
  if (ua.includes('android')) {
    return withVersion('Android', extractVersion(userAgent, [/android ([\d.]+)/i]))
  }
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod') || ua.includes('ios')) {
    return withVersion(
      'iOS',
      extractVersion(userAgent, [
        /(?:iphone os|cpu iphone os|cpu os|ipad; cpu os)\s([\d_]+)/i,
        /ios\s([\d_]+)/i,
      ])
    )
  }
  if (ua.includes('mac os') || ua.includes('macintosh')) {
    return withVersion('macOS', extractVersion(userAgent, [/mac os x ([\d_]+)/i]))
  }
  if (ua.includes('linux')) return 'Linux'

  return 'Unknown'
}

function pickHeader(headers: Headers, names: string[]) {
  for (const name of names) {
    const value = normalizeKnownValue(headers.get(name), 96)
    if (value) return value
  }
  return ''
}

function buildLocationFromHeaders(headers: Headers): string | null {
  const region = pickHeader(headers, [
    'x-vercel-ip-country-region',
    'cf-region',
    'x-region',
    'x-appengine-region',
  ])
  const country = pickHeader(headers, [
    'x-vercel-ip-country',
    'cf-ipcountry',
    'x-country',
    'x-country-code',
    'x-appengine-country',
  ])

  return formatLocationToChinese(country || null, region || null)
}

function resolveIpAddress(headerIp: string | null, hintedIp: string | null) {
  const normalizedHeader = normalizeIp(headerIp)
  const normalizedHint = normalizeIp(hintedIp)

  if (normalizedHeader && !isPrivateIp(normalizedHeader)) return normalizedHeader
  if (normalizedHint && !isPrivateIp(normalizedHint)) return normalizedHint
  return normalizedHint || normalizedHeader || null
}

function parseIpApiLocation(payload: {
  error?: boolean
  city?: string
  region?: string
  country_name?: string
  country?: string
}) {
  if (payload.error) return null

  return formatLocationToChinese(payload.country || null, payload.region || null)
}

function parseIpWhoisLocation(payload: {
  success?: boolean
  city?: string
  region?: string
  country?: string
  country_code?: string
}) {
  if (payload.success === false) return null

  return formatLocationToChinese(payload.country_code || null, payload.region || null)
}

async function lookupLocationByIp(ipAddress: string | null): Promise<string | null> {
  const ip = normalizeIp(ipAddress)
  if (!ip || isPrivateIp(ip)) return null

  if (locationLookupCache.has(ip)) {
    return locationLookupCache.get(ip) ?? null
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 1600)

  try {
    const primary = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })

    if (primary.ok) {
      const payload = (await primary.json()) as {
        error?: boolean
        city?: string
        region?: string
        country_name?: string
        country?: string
      }
      const location = parseIpApiLocation(payload)
      if (location) {
        locationLookupCache.set(ip, location)
        return location
      }
    }

    const secondary = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })

    if (secondary.ok) {
      const payload = (await secondary.json()) as {
        success?: boolean
        city?: string
        region?: string
        country?: string
      }
      const location = parseIpWhoisLocation(payload)
      if (location) {
        locationLookupCache.set(ip, location)
        return location
      }
    }

    locationLookupCache.set(ip, null)
    return null
  } catch {
    locationLookupCache.set(ip, null)
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function getCommentClientMeta(
  headers: Headers,
  hint?: CommentClientMetaHint
): Promise<CommentClientMeta> {
  const headerIp =
    normalizeIp(pickFirstIp(headers.get('x-forwarded-for'))) ||
    normalizeIp(pickFirstIp(headers.get('x-real-ip'))) ||
    normalizeIp(pickFirstIp(headers.get('cf-connecting-ip'))) ||
    normalizeIp(pickFirstIp(headers.get('fly-client-ip'))) ||
    normalizeIp(pickFirstIp(headers.get('x-client-ip'))) ||
    normalizeIp(pickFirstIp(headers.get('x-cluster-client-ip'))) ||
    normalizeIp(pickFirstIp(headers.get('true-client-ip'))) ||
    normalizeIp(pickFirstIp(headers.get('fastly-client-ip')))

  const hintedIp = normalizeIp(hint?.ipAddress ?? null)
  const ipAddress = resolveIpAddress(headerIp, hintedIp)

  const headerUserAgent = normalizeKnownValue(headers.get('user-agent'), 512)
  const hintedUserAgent = normalizeKnownValue(hint?.userAgent ?? null, 512)
  const userAgent = headerUserAgent || hintedUserAgent || null

  const detectedBrowser = userAgent ? detectBrowser(userAgent) : 'Unknown'
  const detectedOs = userAgent ? detectOs(userAgent) : 'Unknown'
  const hintedBrowser = normalizeKnownValue(hint?.browser ?? null, 64)
  const hintedOs = normalizeKnownValue(hint?.os ?? null, 64)

  const browser = detectedBrowser !== 'Unknown' ? detectedBrowser : hintedBrowser
  const os = detectedOs !== 'Unknown' ? detectedOs : hintedOs

  const headerLocation = buildLocationFromHeaders(headers)
  const ipLookupLocation = await lookupLocationByIp(ipAddress)
  const hintedLocation = normalizeKnownValue(hint?.location ?? null, 128)
  const location = headerLocation || ipLookupLocation || hintedLocation

  return {
    ipAddress,
    location,
    userAgent,
    browser,
    os,
  }
}
