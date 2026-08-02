'use client'

import React from 'react'

export function AdminPageHeader({
  title,
  subtitle,
  extra,
}: {
  title: string
  subtitle?: string
  extra?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 m-0">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 m-0 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {extra && (
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {extra}
        </div>
      )}
    </div>
  )
}
