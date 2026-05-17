'use client'

import { Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

interface VisitorInfo {
  ip: string
  location: string
  os: string
  browser: string
}

function detectOS(): string {
  if (typeof navigator === 'undefined') return 'Unknown'
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
  return 'Unknown'
}

function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'Unknown'
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  return 'Browser'
}

export default function TerminalGreeting() {
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
      browser: detectBrowser(),
    }))

    // 主用：ipwhois.app（HTTPS + 中文）
    fetch('https://ipwhois.app/json/?lang=zh-CN&objects=ip,city,region,country,country_code')
      .then(res => res.json())
      .then(data => {
        if (data.ip) {
          setInfo(prev => ({
            ...prev,
            ip: data.ip,
            location: [data.city, data.country_code]
              .filter(Boolean)
              .join(', ') || 'Unknown',
          }))
        } else {
          throw new Error('ipwhois failed')
        }
      })
      .catch(() => {
        // 备用：api.ip.sb
        fetch('https://api.ip.sb/geoip')
          .then(res => res.json())
          .then(data => {
            setInfo(prev => ({
              ...prev,
              ip: data.ip || prev.ip,
              location: [data.city, data.country_code]
                .filter(Boolean)
                .join(', ') || 'Unknown',
            }))
          })
          .catch(() => {
            fetch('https://api.ipify.org?format=json')
              .then(res => res.json())
              .then(data => setInfo(prev => ({ ...prev, ip: data.ip || '0.0.0.0' })))
              .catch(() => {})
          })
      })
  }, [])

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
