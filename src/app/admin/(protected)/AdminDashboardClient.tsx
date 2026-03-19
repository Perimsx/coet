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
    detailLabel: `${deltaPrefix}${delta.delta}，相较上一周期`,
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
            文章
          </div>
          <div className="mt-1 text-xs leading-6 text-muted-foreground">
            近 7 天内容产出趋势。
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-slate-900" />
            评论
          </div>
          <div className="mt-1 text-xs leading-6 text-muted-foreground">
            近 7 天访客互动变化。
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            建议
          </div>
          <div className="mt-1 text-xs leading-6 text-muted-foreground">
            近 7 天反馈收集情况。
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
        <span>近 6 个月活跃度分布。</span>
        <div className="flex items-center gap-1">
          <span>低</span>
          <span className="size-3 rounded-[4px] bg-muted/40" />
          <span className="size-3 rounded-[4px] bg-sky-200" />
          <span className="size-3 rounded-[4px] bg-sky-400" />
          <span className="size-3 rounded-[4px] bg-sky-600" />
          <span>高</span>
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
          toast.error("刷新仪表盘数据失败")
          return
        }

        setMetrics(result.metrics)
        toast.success("仪表盘数据已刷新")
      } catch {
        toast.error("刷新仪表盘数据失败")
      }
    })
  }

  return (
    <div className="space-y-5">
      <AdminPanel className="overflow-hidden rounded-[32px] border-border/70 bg-gradient-to-br from-card via-card to-sky-50/55 dark:to-sky-950/10">
        <AdminPanelBody className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-sky-700">
              工作台总览
            </Badge>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                先看信号，再直接进入下一步操作。
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                指标、趋势、快捷入口和系统状态集中在一个界面里，减少来回切换。
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={handleRefresh} disabled={pending}>
              <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} />
              刷新数据
            </Button>
            <Button asChild className="rounded-2xl">
              <Link href="/admin/posts/edit?new=1">
                <FileText className="size-4" />
                新建文章
              </Link>
            </Button>
          </div>
        </AdminPanelBody>
      </AdminPanel>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="本周文章"
          value={metrics.deltas.weekPosts.current.toLocaleString()}
          hint={`总文章 ${metrics.totals.posts} 篇，已发布 ${metrics.totals.publishedPosts} 篇，草稿 ${metrics.totals.draftPosts} 篇。`}
          delta={metrics.deltas.weekPosts}
        />
        <MetricCard
          title="本周评论"
          value={metrics.deltas.weekComments.current.toLocaleString()}
          hint={`总评论 ${metrics.totals.comments} 条，待审核 ${metrics.totals.pendingComments} 条。`}
          delta={metrics.deltas.weekComments}
        />
        <MetricCard
          title="本周建议"
          value={metrics.deltas.weekSuggestions.current.toLocaleString()}
          hint={`总建议 ${metrics.totals.suggestions} 条，待处理 ${metrics.totals.openSuggestions} 条。`}
          delta={metrics.deltas.weekSuggestions}
        />
        <MetricCard
          title="本月文章"
          value={metrics.deltas.monthPosts.current.toLocaleString()}
          hint="与上一个 30 天周期对比。"
          delta={metrics.deltas.monthPosts}
        />
        <MetricCard
          title="本月评论"
          value={metrics.deltas.monthComments.current.toLocaleString()}
          hint="快速查看互动增长与审核压力。"
          delta={metrics.deltas.monthComments}
        />
        <MetricCard
          title="本月建议"
          value={metrics.deltas.monthSuggestions.current.toLocaleString()}
          hint="用于观察集中反馈或问题高发时段。"
          delta={metrics.deltas.monthSuggestions}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
        <AdminPanel>
          <AdminPanelHeader
            title="7 天趋势"
            description="文章、评论和建议统一放在一张图里，方便一起判断当前工作量。"
          />
          <AdminPanelBody className="pt-4">
            <TimelineChart metrics={metrics} />
          </AdminPanelBody>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title="快捷操作"
            description="把高频入口收拢到这里，避免每个页面都重复堆操作按钮。"
          />
          <AdminPanelBody className="space-y-3 pt-4">
            <Link
              href="/admin/posts/edit?new=1"
              className="flex items-center justify-between rounded-[24px] border border-border/70 bg-muted/10 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">新建文章</div>
                <div className="text-xs leading-6 text-muted-foreground">
                  直接进入文章编辑器开始撰写。
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>

            <Link
              href="/admin/comments"
              className="flex items-center justify-between rounded-[24px] border border-border/70 bg-muted/10 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">查看评论</div>
                <div className="text-xs leading-6 text-muted-foreground">
                  当前待审核：{metrics.totals.pendingComments}
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>

            <Link
              href="/admin/settings?section=security"
              className="flex items-center justify-between rounded-[24px] border border-border/70 bg-muted/10 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">安全设置</div>
                <div className="text-xs leading-6 text-muted-foreground">
                  查看后台入口、密码规则与最近会话情况。
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
            title="6 个月活跃热力图"
            description="用紧凑视图观察内容生产与访客处理的忙碌时段。"
          />
          <AdminPanelBody className="pt-4">
            <Heatmap metrics={metrics} />
          </AdminPanelBody>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title="系统状态"
            description="仅使用站内轻量检查，不额外引入外部监控服务。"
          />
          <AdminPanelBody className="space-y-3 pt-4">
            <div className="rounded-[24px] border border-border/70 bg-muted/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Server className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">运行时长</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    {metrics.system.uptimeMinutes} 分钟
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
                  <div className="text-sm font-semibold text-foreground">内存</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    堆内存 {metrics.system.memoryUsedMb} MB / RSS {metrics.system.memoryRssMb} MB
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
                  <div className="text-sm font-semibold text-foreground">数据库</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    {metrics.system.databaseOk ? "SQLite 连接正常。" : "SQLite 检查失败。"}
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
                  <div className="text-sm font-semibold text-foreground">最近刷新</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    {metrics.system.lastDashboardRefreshAt
                      ? new Date(metrics.system.lastDashboardRefreshAt).toLocaleString("zh-CN")
                      : "尚未手动刷新"}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-dashed border-border/70 bg-muted/5 p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full">
                  <FileText className="mr-1 size-3.5" />
                  文章 {metrics.totals.posts}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  <MessageCircle className="mr-1 size-3.5" />
                  评论 {metrics.totals.comments}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  <MessageSquare className="mr-1 size-3.5" />
                  建议 {metrics.totals.suggestions}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  <Settings className="mr-1 size-3.5" />
                  轻任务
                </Badge>
              </div>
            </div>
          </AdminPanelBody>
        </AdminPanel>
      </section>
    </div>
  )
}
