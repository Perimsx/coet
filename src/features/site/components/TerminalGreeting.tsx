'use client'

import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { useNavLanguage } from '@/features/site/lib/nav-language'

interface VisitorInfo {
  ip: string
  location: string
  os: string
  browser: string
}

function detectOS(): string {
  if (typeof navigator === 'undefined') return 'Unknown'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  return 'Unknown'
}

function detectBrowser(locale: string): string {
  if (typeof navigator === 'undefined') return 'Unknown'
  const ua = navigator.userAgent
  const isEn = locale === 'en'

  // 微信/QQ 内置浏览器需要优先判断（UA 中也包含 Chrome/Safari）
  if (/MicroMessenger/i.test(ua)) return isEn ? 'WeChat' : '微信'
  if (/QQ\//i.test(ua) || /MQQBrowser/i.test(ua)) return 'QQ'
  if (/DingTalk/i.test(ua)) return isEn ? 'DingTalk' : '钉钉'
  if (/AlipayClient/i.test(ua)) return isEn ? 'Alipay' : '支付宝'
  if (/baiduboxapp/i.test(ua)) return isEn ? 'Baidu' : '百度'
  if (/Weibo/i.test(ua)) return isEn ? 'Weibo' : '微博'

  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  return 'Browser'
}

// ─── 内置浏览器检测（微信 / QQ / 钉钉 / 微博等） ───
function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  return /MicroMessenger|QQBrowser|MQQBrowser|QQ\//i.test(ua)
      || /QihooBrowser|Weibo|DingTalk|MiuiBrowser/i.test(ua)
}

// 按优先级依次尝试多个 IP API，兼容微信/QQ 内置浏览器
// 内置浏览器：仅用 /api/geo（同域 EdgeOne 边缘函数），不发起任何外部请求
// 标准浏览器：/api/geo 优先，外部 API 降级
async function fetchIpAndLocation(locale: string): Promise<{ ip: string; location: string }> {
  const isEn = locale === 'en'
  const inApp = isInAppBrowser()

  const isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  // 策略 1：EdgeOne 边缘函数代理（所有浏览器通用，本地开发跳过以避免 404 报错）
  if (!isLocal) {
    try {
      const res = await fetch('/api/geo', {
        signal: AbortSignal.timeout(5000)
      })
      if (res.ok) {
        const data = await res.json()
        if (data.city) {
          return {
            ip: data.ip || '0.0.0.0',
            location: data.city || (isEn ? 'Unknown' : '未知'),
          }
        }
      }
    } catch {}
  }

  // 内置浏览器到此为止，不尝试外部 API（DNS 污染 / CORS 均不可控）
  if (inApp) {
    return { ip: isEn ? 'Unknown' : '未知', location: isEn ? 'Unknown' : '未知' }
  }

  // 策略 2：api.ip.sb
  try {
    const res = await fetch('https://api.ip.sb/geoip', {
      signal: AbortSignal.timeout(4000)
    })
    const data = await res.json()
    return {
      ip: data.ip || '0.0.0.0',
      location: [data.city, data.country_code].filter(Boolean).join(', ') || 'Unknown',
    }
  } catch {}

  // 策略 3：ip-api.com
  try {
    const res = await fetch('https://ip-api.com/json/?fields=query,city,countryCode&lang=zh-CN', {
      signal: AbortSignal.timeout(4000)
    })
    const data = await res.json()
    if (data.query) {
      return {
        ip: data.query,
        location: [data.city, data.countryCode].filter(Boolean).join(', ') || 'Unknown',
      }
    }
  } catch {}

  // 策略 4：仅获取 IP
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000)
    })
    const data = await res.json()
    return { ip: data.ip || '0.0.0.0', location: 'Unknown' }
  } catch {}

  // 全部失败
  return { ip: isEn ? 'Unknown' : '未知', location: isEn ? 'Unknown' : '未知' }
}

export default function TerminalGreeting() {
  const { locale } = useNavLanguage()
  const [info, setInfo] = useState<VisitorInfo>({
    ip: '···',
    location: '···',
    os: '···',
    browser: '···',
  })

  useEffect(() => {
    setInfo(prev => ({
      ...prev,
      os: detectOS(),
      browser: detectBrowser(locale),
    }))

    fetchIpAndLocation(locale).then(({ ip, location }) => {
      setInfo(prev => ({ ...prev, ip, location }))
    })
  }, [locale])

  return (
    <div className="flex items-center gap-2 mb-4 w-fit rounded-md bg-zinc-50/50 px-2.5 py-1.5 border border-zinc-200/50 dark:bg-zinc-900/30 dark:border-zinc-800/50 backdrop-blur-sm">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
      </span>
      
      <code className="flex items-center gap-1.5 text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
        <span id="terminal-greeting-ip" className="flex items-center gap-1 text-primary-500/80">
          <Zap className="h-3 w-3" />
          {info.ip}
        </span>
        
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        
        <span className="flex items-center gap-1">
          {info.location}
        </span>

        <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">·</span>

        <span className="hidden sm:flex items-center gap-1">
          {info.os} / {info.browser}
        </span>
      </code>
    </div>
  )
}
