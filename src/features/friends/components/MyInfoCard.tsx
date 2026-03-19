'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface InfoRowProps {
  label: string
  value: string
}

export interface FriendSiteInfo {
  title: string
  description: string
  url: string
  avatar: string
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
        return
      }

      throw new Error('Clipboard API unavailable')
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = value
      document.body.appendChild(textArea)
      textArea.select()

      try {
        document.execCommand('copy')
        setCopied(true)
        toast.success(`${label} 已复制到剪贴板`)
        setTimeout(() => setCopied(false), 2000)
      } catch {
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
      <div className="flex min-w-0 flex-1 items-center justify-between px-3 py-1.5">
        <span className="min-w-0 truncate select-all font-mono text-[13px] text-foreground/80">
          {value}
        </span>
        <button
          onClick={handleCopy}
          className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-foreground/30 transition-all hover:bg-primary/10 hover:text-primary active:scale-90"
          title={`复制${label}`}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}

export default function MyInfoCard({ siteInfo }: { siteInfo: FriendSiteInfo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mx-auto w-full max-w-xl"
    >
      <div className="flex flex-col items-center py-1">
        <div className="w-full space-y-2">
          <InfoRow label="名称" value={siteInfo.title} />
          <InfoRow label="介绍" value={siteInfo.description} />
          <InfoRow label="网址" value={siteInfo.url} />
          <InfoRow label="头像" value={siteInfo.avatar} />
        </div>
      </div>
    </motion.div>
  )
}
