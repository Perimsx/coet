import { headers } from 'next/headers'
import { MapPin, Zap } from 'lucide-react'

export default async function TerminalGreeting() {
  const headersList = await headers()
  
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  let ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1'

  // 将 IPv6 的 localhost 转换为更直观的 127.0.0.1
  if (ip === '::1') {
    ip = '127.0.0.1'
  }

  // 识别本地主机
  const isLocalhost = ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')
  const city = headersList.get('x-vercel-ip-city') || (isLocalhost ? 'Local LAN' : 'Unknown')
  const weather = isLocalhost ? 'Active' : 'Online'

  // 增加系统/环境探测
  const userAgent = headersList.get('user-agent') || ''
  let os = 'Unknown OS'
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac OS')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS'

  return (
    <div className="flex items-center gap-2 mb-4 w-fit rounded-md bg-zinc-50/50 px-2.5 py-1.5 border border-zinc-200/50 dark:bg-zinc-900/30 dark:border-zinc-800/50 backdrop-blur-sm">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
      </span>
      
      <code className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500">~</span>
        <span className="text-primary-500/80">./probe.sh</span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        
        <span className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
          <Zap className="h-3 w-3" />
          {ip}
        </span>
        <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">|</span>
        
        <span className="hidden sm:flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
          <MapPin className="h-3 w-3" />
          {city} · {weather}
        </span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>

        <span className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
          {os}
        </span>
      </code>
    </div>
  )
}
