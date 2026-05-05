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
        "rounded-xl border bg-card text-card-foreground shadow-sm",
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
        "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
        className
      )}
    >
      <div className="space-y-1.5">
        <CardTitle className="text-lg font-semibold leading-none tracking-tight">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-sm text-muted-foreground">
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
  return <CardContent className={className}>{children}</CardContent>
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
    <AdminPanel className="flex flex-col justify-between p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <div className="text-sm font-medium tracking-tight text-foreground">
          {title}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <div className="text-2xl font-bold">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
      </div>
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
        "flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/40 p-8 text-center",
        className
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
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
        "flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between",
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
    <div className="flex flex-col rounded-lg border bg-card px-3 py-1.5 shadow-sm">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-medium text-foreground">{value}</div>
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
      variant="secondary"
      className="rounded-lg font-mono text-[11px] uppercase tracking-wider text-secondary-foreground"
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
    <div className="flex items-center justify-between border-t pt-4 mt-4">
      <div className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{formatPageValue(page)}</span> of{" "}
        <span className="font-medium text-foreground">{formatPageValue(totalPages)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
