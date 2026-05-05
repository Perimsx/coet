import { headers } from 'next/headers'
import { MapPin, Zap } from 'lucide-react'
import { getCommentClientMeta } from '@/features/comments/lib/comment-client-meta'

export default async function TerminalGreeting() {
  const headersList = await headers()
  const meta = await getCommentClientMeta(headersList)
  
  let ip = meta.ipAddress || '127.0.0.1'

  // 将 IPv6 的 localhost 转换为更直观的 127.0.0.1
  if (ip === '::1') {
    ip = '127.0.0.1'
  }

  const isLocalhost = ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')
  const location = isLocalhost ? 'Local LAN' : (meta.location || 'Unknown')
  const weather = isLocalhost ? 'Active' : 'Online'

  const os = meta.os || 'Unknown OS'
  const browser = meta.browser || 'Unknown Browser'

  return (
    <div className="flex items-center gap-2 mb-4 w-fit rounded-md bg-zinc-50/50 px-2.5 py-1.5 border border-zinc-200/50 dark:bg-zinc-900/30 dark:border-zinc-800/50 backdrop-blur-sm">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
      </span>
      
      <code className="flex items-center gap-1.5 text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
        <span id="terminal-greeting-ip" className="flex items-center gap-1 text-primary-500/80">
          <Zap className="h-3 w-3" />
          {ip}
        </span>
        
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        
        <span className="flex items-center gap-1">
          {location}
        </span>

        <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">·</span>

        <span className="hidden sm:flex items-center gap-1">
          {os} / {browser.split(' ')[0]}
        </span>
      </code>
    </div>
  )
}
