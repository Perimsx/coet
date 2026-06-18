'use client'

import { useState, useEffect } from 'react'
import { TooltipIconButton } from '@/shared/components/TooltipIconButton'

const STORAGE_KEY = 'site-notice-dismissed'

export default function SiteNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-16 z-50 flex justify-center px-4 sm:top-20">
      <div className="pointer-events-auto relative flex items-center justify-center gap-1.5 rounded-full border border-amber-200/50 bg-amber-50/80 px-6 py-1.5 text-[11px] leading-tight text-amber-700/90 shadow-sm backdrop-blur-md dark:border-amber-800/30 dark:bg-amber-950/40 dark:text-amber-400/80">
        <span className="shrink-0 text-amber-500 dark:text-amber-400">&#9888;</span>
        <span>站点升级中，部分功能可能暂时不可用</span>
        <TooltipIconButton label="关闭通知" side="bottom">
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem(STORAGE_KEY, '1')
              setVisible(false)
            }}
            className="ml-1 shrink-0 rounded-full p-0.5 text-amber-500/60 transition-colors hover:text-amber-700 dark:hover:text-amber-300"
          >
            &#10005;
          </button>
        </TooltipIconButton>
      </div>
    </div>
  )
}
