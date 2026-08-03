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
    <header className="flex items-center justify-between gap-3 px-0.5 mb-1">
      <div className="min-w-0 flex flex-col gap-0.5">
        <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-zinc-500 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
      {extra && (
        <div className="flex items-center gap-2 shrink-0">
          {extra}
        </div>
      )}
    </header>
  )
}

