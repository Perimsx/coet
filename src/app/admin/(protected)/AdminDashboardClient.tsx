"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import {
  Activity,
  ArrowRight,
  Database,
  FileText,
  HardDrive,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Server,
  Settings,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/features/admin/components/admin-ui"
import type {
  AdminDashboardMetrics,
  DashboardMetricDelta,
} from "@/features/admin/lib/dashboard-metrics"

function formatDelta(delta: DashboardMetricDelta) {
  const ratePrefix = delta.changeRate > 0 ? "+" : ""
  const deltaPrefix = delta.delta > 0 ? "+" : ""
  const tone =
    delta.delta > 0
      ? "text-emerald-600"
      : delta.delta < 0
        ? "text-red-600"
        : "text-muted-foreground"

  return {
    rateLabel: `${ratePrefix}${delta.changeRate}%`,
    detailLabel: `${deltaPrefix}${delta.delta} vs previous window`,
    className: tone,
  }
}

function MetricCard({
  title,
  value,
  hint,
  delta,
}: {
  title: string
  value: string
  hint: string
  delta: DashboardMetricDelta
}) {
  const deltaView = formatDelta(delta)

  return (
    <AdminPanel className="overflow-hidden rounded-[28px]">
      <AdminPanelBody className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">{title}</div>
            <div className="text-3xl font-semibold tracking-tight text-foreground">{value}</div>
          </div>
          <Badge variant="outline" className="rounded-full bg-background">
            {deltaView.rateLabel}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className={deltaView.className}>{deltaView.detailLabel}</div>
          <div className="text-xs leading-6 text-muted-foreground">{hint}</div>
        </div>
      </AdminPanelBody>
    </AdminPanel>
  )
}

function TimelineChart({ metrics }: { metrics: AdminDashboardMetrics }) {
  const series = useMemo(() => {
    const maxValue = Math.max(
      1,
      ...metrics.timeline.flatMap((item) => [item.posts, item.comments, item.suggestions])
    )

    const createPoints = (key: "posts" | "comments" | "suggestions") =>
      metrics.timeline
        .map((item, index) => {
          const x = (index / Math.max(metrics.timeline.length - 1, 1)) * 100
          const y = 100 - (item[key] / maxValue) * 100
          return `${x},${y}`
        })
        .join(" ")

    return {
      posts: createPoints("posts"),
      comments: createPoints("comments"),
      suggestions: createPoints("suggestions"),
    }
  }, [metrics.timeline])

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-border/70 bg-muted/10 p-4">
        <svg viewBox="0 0 100 100" className="h-64 w-full overflow-visible">
          {[0, 25, 50, 75, 100].map((tick) => (
            <line
              key={tick}
              x1="0"
              y1={tick}
              x2="100"
              y2={tick}
              stroke="currentColor"
              className="text-border/60"
              strokeDasharray="1.5 3"
            />
          ))}
          <polyline
            fill="none"
            stroke="rgb(14 165 233)"
            strokeWidth="2.6"
            points={series.posts}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            fill="none"
            stroke="rgb(15 23 42)"
            strokeWidth="2.6"
            points={series.comments}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            fill="none"
            stroke="rgb(16 185 129)"
            strokeWidth="2.6"
            points={series.suggestions}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-sky-500" />
            Posts
          </div>
          <div className="mt-1 text-xs leading-6 text-muted-foreground">
            Content output over the last 7 days.
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-slate-900" />
            Comments
          </div>
          <div className="mt-1 text-xs leading-6 text-muted-foreground">
            Visitor interaction over the last 7 days.
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            Suggestions
          </div>
          <div className="mt-1 text-xs leading-6 text-muted-foreground">
            Feedback intake over the last 7 days.
          </div>
        </div>
      </div>
    </div>
  )
}

function Heatmap({ metrics }: { metrics: AdminDashboardMetrics }) {
  const maxCount = Math.max(1, ...metrics.heatmap.map((item) => item.count))

  const getTone = (count: number) => {
    if (count === 0) return "bg-muted/40"
    if (count / maxCount < 0.34) return "bg-sky-200"
    if (count / maxCount < 0.67) return "bg-sky-400"
    return "bg-sky-600"
  }

  return (
    <div className="space-y-4">
      <div className="grid max-w-full grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
        {metrics.heatmap.map((item) => (
          <div
            key={item.date}
            title={`${item.date}: ${item.count}`}
            className={`size-3 rounded-[4px] ${getTone(item.count)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Activity across the last 6 months.</span>
        <div className="flex items-center gap-1">
          <span>Low</span>
          <span className="size-3 rounded-[4px] bg-muted/40" />
          <span className="size-3 rounded-[4px] bg-sky-200" />
          <span className="size-3 rounded-[4px] bg-sky-400" />
          <span className="size-3 rounded-[4px] bg-sky-600" />
          <span>High</span>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboardClient({
  initialMetrics,
}: {
  initialMetrics: AdminDashboardMetrics
}) {
  const [metrics, setMetrics] = useState(initialMetrics)
  const [pending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/jobs/dashboard-refresh", {
          method: "POST",
        })
        const result = await response.json()

        if (!response.ok || !result.ok) {
          toast.error("Failed to refresh dashboard data")
          return
        }

        setMetrics(result.metrics)
        toast.success("Dashboard data refreshed")
      } catch {
        toast.error("Failed to refresh dashboard data")
      }
    })
  }

  return (
    <div className="space-y-5">
      <AdminPanel className="overflow-hidden rounded-[32px] border-border/70 bg-gradient-to-br from-card via-card to-sky-50/55 dark:to-sky-950/10">
        <AdminPanelBody className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-sky-700">
              Workspace overview
            </Badge>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Start from the signal, then move straight into the next action.
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Metrics, trends, quick links, and system health stay on one screen so the work path remains short.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={handleRefresh} disabled={pending}>
              <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} />
              Refresh data
            </Button>
            <Button asChild className="rounded-2xl">
              <Link href="/admin/posts/edit?new=1">
                <FileText className="size-4" />
                Create post
              </Link>
            </Button>
          </div>
        </AdminPanelBody>
      </AdminPanel>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Posts this week"
          value={metrics.deltas.weekPosts.current.toLocaleString()}
          hint={`Total posts: ${metrics.totals.posts}. Published: ${metrics.totals.publishedPosts}. Drafts: ${metrics.totals.draftPosts}.`}
          delta={metrics.deltas.weekPosts}
        />
        <MetricCard
          title="Comments this week"
          value={metrics.deltas.weekComments.current.toLocaleString()}
          hint={`Total comments: ${metrics.totals.comments}. Pending review: ${metrics.totals.pendingComments}.`}
          delta={metrics.deltas.weekComments}
        />
        <MetricCard
          title="Suggestions this week"
          value={metrics.deltas.weekSuggestions.current.toLocaleString()}
          hint={`Total suggestions: ${metrics.totals.suggestions}. Open items: ${metrics.totals.openSuggestions}.`}
          delta={metrics.deltas.weekSuggestions}
        />
        <MetricCard
          title="Posts this month"
          value={metrics.deltas.monthPosts.current.toLocaleString()}
          hint="Compared against the previous 30-day window."
          delta={metrics.deltas.monthPosts}
        />
        <MetricCard
          title="Comments this month"
          value={metrics.deltas.monthComments.current.toLocaleString()}
          hint="A quick view of engagement growth and moderation pressure."
          delta={metrics.deltas.monthComments}
        />
        <MetricCard
          title="Suggestions this month"
          value={metrics.deltas.monthSuggestions.current.toLocaleString()}
          hint="Useful for spotting bursts of support or product feedback."
          delta={metrics.deltas.monthSuggestions}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
        <AdminPanel>
          <AdminPanelHeader
            title="7-day trend"
            description="Posts, comments, and suggestions stay on one chart so you can judge workload together."
          />
          <AdminPanelBody className="pt-4">
            <TimelineChart metrics={metrics} />
          </AdminPanelBody>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title="Quick actions"
            description="Keep the common routes one click away without repeating them inside every page."
          />
          <AdminPanelBody className="space-y-3 pt-4">
            <Link
              href="/admin/posts/edit?new=1"
              className="flex items-center justify-between rounded-[24px] border border-border/70 bg-muted/10 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">Create post</div>
                <div className="text-xs leading-6 text-muted-foreground">
                  Jump directly into the immersive editor.
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>

            <Link
              href="/admin/comments"
              className="flex items-center justify-between rounded-[24px] border border-border/70 bg-muted/10 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">Review comments</div>
                <div className="text-xs leading-6 text-muted-foreground">
                  Pending moderation: {metrics.totals.pendingComments}
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>

            <Link
              href="/admin/settings?section=security"
              className="flex items-center justify-between rounded-[24px] border border-border/70 bg-muted/10 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">Review security</div>
                <div className="text-xs leading-6 text-muted-foreground">
                  Check access path, password policy, and recent sessions.
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          </AdminPanelBody>
        </AdminPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <AdminPanel>
          <AdminPanelHeader
            title="6-month activity heatmap"
            description="A compact view of busy periods across content production and visitor handling."
          />
          <AdminPanelBody className="pt-4">
            <Heatmap metrics={metrics} />
          </AdminPanelBody>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title="System health"
            description="Lightweight checks only, without introducing extra monitoring services."
          />
          <AdminPanelBody className="space-y-3 pt-4">
            <div className="rounded-[24px] border border-border/70 bg-muted/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Server className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Uptime</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    {metrics.system.uptimeMinutes} minutes
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-muted/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <HardDrive className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Memory</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    Heap {metrics.system.memoryUsedMb} MB / RSS {metrics.system.memoryRssMb} MB
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-muted/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Database className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Database</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    {metrics.system.databaseOk ? "SQLite responded normally." : "SQLite check failed."}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-muted/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Activity className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Last refresh</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    {metrics.system.lastDashboardRefreshAt
                      ? new Date(metrics.system.lastDashboardRefreshAt).toLocaleString()
                      : "No manual refresh yet"}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-dashed border-border/70 bg-muted/5 p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full">
                  <FileText className="mr-1 size-3.5" />
                  Posts {metrics.totals.posts}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  <MessageCircle className="mr-1 size-3.5" />
                  Comments {metrics.totals.comments}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  <MessageSquare className="mr-1 size-3.5" />
                  Suggestions {metrics.totals.suggestions}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  <Settings className="mr-1 size-3.5" />
                  Lightweight jobs
                </Badge>
              </div>
            </div>
          </AdminPanelBody>
        </AdminPanel>
      </section>
    </div>
  )
}
