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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
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
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto [&_button]:inline-flex [&_button]:items-center [&_button]:justify-center [&_button]:whitespace-nowrap [&_button]:px-3.5 [&_button]:py-2 [&_button]:rounded-xl [&_button]:text-xs [&_button]:font-semibold [&_button]:transition-all [&_a]:inline-flex [&_a]:items-center [&_a]:justify-center [&_a]:whitespace-nowrap [&_a]:px-3.5 [&_a]:py-2 [&_a]:rounded-xl [&_a]:text-xs [&_a]:font-semibold [&_a]:transition-all">
          {extra}
        </div>
      )}
    </div>
  )
}
