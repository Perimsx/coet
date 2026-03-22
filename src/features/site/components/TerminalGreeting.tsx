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

  // 极致精简信息
  const isLocalhost = ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')
  const city = headersList.get('x-vercel-ip-city') || (isLocalhost ? 'LAN' : 'Unknown')

  // 系统/环境探测缩写
  const userAgent = headersList.get('user-agent') || ''
  let os = 'Unknown'
  if (userAgent.includes('Windows')) os = 'Win'
  else if (userAgent.includes('Mac OS')) os = 'Mac'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS'

  return (
    <div className="flex items-center gap-1.5 mb-3 w-fit rounded bg-zinc-50/40 px-1.5 py-0.5 border border-zinc-200/30 dark:bg-zinc-900/20 dark:border-zinc-800/30 backdrop-blur-sm">
      <span className="relative flex h-1 w-1 ml-0.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500"></span>
      </span>
      
      <code className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-500">
        <span>~</span>
        <span className="text-primary-500/70">./probe.sh</span>
        <span className="text-zinc-300 dark:text-zinc-700">|</span>
        
        <span className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
          <Zap className="h-2.5 w-2.5" />
          {ip}
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">|</span>
        
        <span className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
          <MapPin className="h-2.5 w-2.5" />
          {city}
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">|</span>

        <span className="flex items-center hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors pr-0.5">
          {os}
        </span>
      </code>
    </div>
  )
}
