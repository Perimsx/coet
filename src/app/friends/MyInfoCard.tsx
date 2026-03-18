'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface InfoRowProps {
  label: string
  value: string
}

const InfoRow = ({ label, value }: InfoRowProps) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        toast.success(`${label} 已复制到剪贴板`)
        setTimeout(() => setCopied(false), 2000)
      } else {
        throw new Error('Clipboard API not available')
      }
    } catch (err) {
      // 旧浏览器或受限环境的兜底
      const textArea = document.createElement('textarea')
      textArea.value = value
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        toast.success(`${label} 已复制到剪贴板`)
        setTimeout(() => setCopied(false), 2000)
      } catch (e) {
        toast.error('复制失败，请手动选择复制')
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-border/40 bg-white/30 dark:bg-gray-800/20">
      <div className="flex h-9 w-16 shrink-0 items-center justify-center border-r border-border/40 bg-gray-50/50 text-xs font-medium text-foreground/60 dark:bg-gray-900/40">
        {label}
      </div>
      <div className="flex flex-1 items-center justify-between px-3 py-1.5 min-w-0">
        <span className="truncate select-all font-mono text-[13px] text-foreground/80 min-w-0">
          {value}
        </span>
        <button
          onClick={handleCopy}
          className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-foreground/30 transition-all hover:bg-primary/10 hover:text-primary active:scale-90"
          title={`复制${label}`}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}

export default function MyInfoCard() {
  const myInfo = {
    owner: 'Chen Guitao',
    title: "Chen Guitao's Blog",
    desc: '关关难过关关过，长路漫漫亦灿灿。',
    url: 'https://chenguitao.com/',
    avatar: 'https://img1.tucang.cc/api/image/show/634a56a76f7455df0e2fb5419533e0cf'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mx-auto w-full max-w-xl"
    >
      <div className="flex flex-col items-center py-1">
        {/* Info Rows */}
        <div className="w-full space-y-2">
          <InfoRow label="名称" value={myInfo.title} />
          <InfoRow label="介绍" value={myInfo.desc} />
          <InfoRow label="网址" value={myInfo.url} />
          <InfoRow label="头像" value={myInfo.avatar} />
        </div>
      </div>
    </motion.div>
  )
}

