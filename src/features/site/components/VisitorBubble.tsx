import { headers } from 'next/headers'
import { getCommentClientMeta } from '@/features/comments/lib/comment-client-meta'
import { Cloud, Sun, Moon } from 'lucide-react'

// RSC 识别访客属地并返回个性化天气问候
export default async function VisitorBubble() {
  const headersList = await headers()
  const meta = await getCommentClientMeta(headersList)
  
  let ip = meta.ipAddress || '127.0.0.1'
  if (ip === '::1') ip = '127.0.0.1'
  
  const isLocalhost = ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')
  const location = isLocalhost ? '局域网' : (meta.location || '星辰大海')
  
  // 简单模拟基于当前服务器北京时间的早晚天气提示
  const hour = new Date().getHours()
  let greeting = '你好'
  let icon = <Cloud className="w-3.5 h-3.5 text-sky-500" />
  
  if (hour >= 5 && hour < 12) {
    greeting = '早安'
    icon = <Sun className="w-3.5 h-3.5 text-amber-500" />
  } else if (hour >= 12 && hour < 14) {
    greeting = '中午好'
    icon = <Sun className="w-3.5 h-3.5 text-orange-500" />
  } else if (hour >= 14 && hour < 18) {
    greeting = '下午好'
    icon = <Cloud className="w-3.5 h-3.5 text-sky-500" />
  } else {
    greeting = '晚安'
    icon = <Moon className="w-3.5 h-3.5 text-indigo-400" />
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-md rounded-2xl text-zinc-600 dark:text-zinc-300">
      {icon}
      <span>{greeting}，来自 {location} 的朋友</span>
    </div>
  )
}
