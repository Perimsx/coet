"use client"

import type { LucideIcon } from "lucide-react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/components/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
        "rounded-[28px] border-border/60 bg-card/95 shadow-[0_10px_32px_rgba(15,23,42,0.04)]",
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
        "flex flex-col gap-3 border-b border-border/50 pb-4 md:flex-row md:items-start md:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <CardTitle className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-sm leading-6">{description}</CardDescription>
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
  return <CardContent className={cn("p-4 md:p-5", className)}>{children}</CardContent>
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
    <AdminPanel className="h-full overflow-hidden">
      <AdminPanelBody className="flex items-start justify-between gap-3 p-4 md:p-5">
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          <div className="text-3xl font-semibold leading-none tracking-tight text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
          {hint ? <div className="text-xs leading-5 text-muted-foreground">{hint}</div> : null}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
        "flex min-h-[220px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border/80 bg-muted/25 px-6 py-10 text-center",
        className
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-background text-muted-foreground shadow-sm">
        <Icon className="size-6" />
      </div>
      <div className="text-base font-semibold text-foreground">{title}</div>
      <div className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</div>
      {action ? <div className="mt-5">{action}</div> : null}
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
        "flex flex-col gap-3 rounded-[24px] border border-border/70 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between",
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
    <div className="rounded-2xl border border-border/60 bg-background/80 px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
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
      className="rounded-full border-border/70 bg-background px-3 py-1 text-xs font-medium"
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
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/15 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
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
          className="rounded-xl"
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
