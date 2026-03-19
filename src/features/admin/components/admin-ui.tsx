"use client"

import type { LucideIcon } from "lucide-react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/components/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function formatPageValue(value: number) {
  return String(value).padStart(2, "0")
}

export function AdminPanel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card
      className={cn(
        "rounded-[30px] border-white/70 bg-white/82 shadow-[0_24px_60px_rgba(37,99,235,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/55 dark:shadow-[0_24px_60px_rgba(2,6,23,0.35)]",
        className
      )}
    >
      {children}
    </Card>
  )
}

export function AdminPanelHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <CardHeader
      className={cn(
        "flex flex-col gap-4 px-5 pt-5 pb-0 md:px-6 md:pt-6 lg:flex-row lg:items-start lg:justify-between",
        className
      )}
    >
      <div className="space-y-2">
        <CardTitle className="font-[family-name:var(--font-admin-display)] text-lg font-extrabold tracking-[-0.03em] text-foreground">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </CardDescription>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </CardHeader>
  )
}

export function AdminPanelBody({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <CardContent className={cn("p-5 md:p-6", className)}>{children}</CardContent>
}

export function AdminStatCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string
  value: string | number
  hint?: string
  icon: LucideIcon
}) {
  return (
    <AdminPanel className="group relative h-full overflow-hidden">
      <div className="pointer-events-none absolute right-0 top-0 size-28 -translate-y-10 translate-x-8 rounded-full bg-sky-200/60 blur-3xl transition-transform duration-500 group-hover:scale-110 dark:bg-sky-500/15" />
      <AdminPanelBody className="relative flex items-start justify-between gap-4 p-5 md:p-6">
        <div className="space-y-3">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {title}
          </div>
          <div className="font-[family-name:var(--font-admin-display)] text-4xl font-extrabold leading-none tracking-[-0.05em] text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
          {hint ? <div className="max-w-xs text-xs leading-6 text-muted-foreground">{hint}</div> : null}
        </div>
        <div className="flex size-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-blue-600/12 via-sky-100 to-cyan-100 text-blue-700 dark:from-blue-500/20 dark:via-sky-500/10 dark:to-cyan-500/10 dark:text-sky-200">
          <Icon className="size-5" />
        </div>
      </AdminPanelBody>
    </AdminPanel>
  )
}

export function AdminEmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: string
  description: string
  icon: LucideIcon
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-[240px] flex-col items-center justify-center rounded-[30px] bg-slate-100/75 px-6 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/45 dark:ring-white/10",
        className
      )}
    >
      <div className="mb-5 flex size-16 items-center justify-center rounded-[22px] bg-white text-sky-700 shadow-[0_18px_30px_rgba(37,99,235,0.12)] dark:bg-slate-950/70 dark:text-sky-300">
        <Icon className="size-7" />
      </div>
      <div className="font-[family-name:var(--font-admin-display)] text-lg font-bold tracking-[-0.03em] text-foreground">
        {title}
      </div>
      <div className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</div>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function AdminToolbar({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[26px] bg-slate-100/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-white/75 dark:bg-slate-900/40 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] dark:ring-white/10 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      {children}
    </div>
  )
}

export function AdminToolbarMeta({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-full bg-white/85 px-4 py-2.5 shadow-sm ring-1 ring-slate-200/65 dark:bg-slate-950/70 dark:ring-white/10">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

export function AdminCountBadge({
  value,
  label,
}: {
  value: number
  label: string
}) {
  return (
    <Badge
      variant="outline"
      className="rounded-full border-transparent bg-white/85 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-600 shadow-sm dark:bg-slate-950/70 dark:text-slate-300"
    >
      {label} {value.toLocaleString()}
    </Badge>
  )
}

export function AdminPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] bg-slate-100/80 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-white/75 dark:bg-slate-900/40 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] dark:ring-white/10 md:flex-row md:items-center md:justify-between">
      <div className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Page <span className="text-foreground">{formatPageValue(page)}</span> /{" "}
        <span className="text-foreground">{formatPageValue(totalPages)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full border-white/70 bg-white/90 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full border-white/70 bg-white/90 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
