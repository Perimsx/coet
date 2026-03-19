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
  const prefix = delta.delta > 0 ? "+" : ""
  const tone =
    delta.delta > 0
      ? "text-emerald-600"
      : delta.delta < 0
        ? "text-red-600"
        : "text-muted-foreground"

  return {
    label: `${prefix}${delta.delta} / ${delta.changeRate}%`,
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
            {delta.label}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className={deltaView.className}>{deltaView.label}</div>
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
      maxValue,
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
          <div className="mt-1 text-xs leading-6 text-muted-foreground">近 7 天内容产出</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-slate-900" />
            评论
          </div>
          <div className="mt-1 text-xs leading-6 text-muted-foreground">近 7 天访客互动</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            建议
          </div>
          <div className="mt-1 text-xs leading-6 text-muted-foreground">近 7 天反馈流入</div>
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
            title={`${item.date} · ${item.count}`}
            className={`size-3 rounded-[4px] ${getTone(item.count)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>过去 6 个月活跃度</span>
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
          toast.error("刷新仪表盘失败")
          return
        }

        setMetrics(result.metrics)
        toast.success("仪表盘数据已刷新")
      } catch {
        toast.error("刷新仪表盘失败")
      }
    })
  }

  return (
    <div className="space-y-5">
      <AdminPanel className="overflow-hidden rounded-[32px] border-border/70 bg-gradient-to-br from-card via-card to-sky-50/60 dark:to-sky-950/10">
        <AdminPanelBody className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-sky-700">
              后台工作台
            </Badge>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                今天先看清状态，再走最短操作路径
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                新的仪表盘把指标矩阵、趋势、快捷入口和系统状态合成一个工作入口，减少来���切页和重复确认。
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
          value={metrics.deltas.weekPosts.current.toLocaleString("zh-CN")}
          hint={`当前总文章 ${metrics.totals.posts}，已发布 ${metrics.totals.publishedPosts}，草稿 ${metrics.totals.draftPosts}`}
          delta={metrics.deltas.weekPosts}
        />
        <MetricCard
          title="本周评论"
          value={metrics.deltas.weekComments.current.toLocaleString("zh-CN")}
          hint={`当前评论 ${metrics.totals.comments}，待审核 ${metrics.totals.pendingComments}`}
          delta={metrics.deltas.weekComments}
        />
        <MetricCard
          title="本周建议"
          value={metrics.deltas.weekSuggestions.current.toLocaleString("zh-CN")}
          hint={`当前建议 ${metrics.totals.suggestions}，未关闭 ${metrics.totals.openSuggestions}`}
          delta={metrics.deltas.weekSuggestions}
        />
        <MetricCard
          title="本月文章"
          value={metrics.deltas.monthPosts.current.toLocaleString("zh-CN")}
          hint="按最近 30 天和上一个 30 天窗口做对比"
          delta={metrics.deltas.monthPosts}
        />
        <MetricCard
          title="本月评论"
          value={metrics.deltas.monthComments.current.toLocaleString("zh-CN")}
          hint="评论增长和审核压力会同步反映在这里"
          delta={metrics.deltas.monthComments}
        />
        <MetricCard
          title="本月建议"
          value={metrics.deltas.monthSuggestions.current.toLocaleString("zh-CN")}
          hint="能快速看出反馈量是否集中上涨"
          delta={metrics.deltas.monthSuggestions}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
        <AdminPanel>
          <AdminPanelHeader
            title="近 7 天趋势"
            description="文章、评论、建议合在一张图里看，便于判断创作、审核和反馈是否同步堆积。"
          />
          <AdminPanelBody className="pt-4">
            <TimelineChart metrics={metrics} />
          </AdminPanelBody>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title="快捷工作流"
            description="把最常用的跳转和动作收口到首页，避免来回找入口。"
          />
          <AdminPanelBody className="space-y-3 pt-4">
            <Link
              href="/admin/posts/edit?new=1"
              className="flex items-center justify-between rounded-[24px] border border-border/70 bg-muted/10 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">新建文章</div>
                <div className="text-xs leading-6 text-muted-foreground">
                  直接进入沉浸式编辑器开始写作
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>

            <Link
              href="/admin/comments"
              className="flex items-center justify-between rounded-[24px] border border-border/70 bg-muted/10 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">处理评论审核</div>
                <div className="text-xs leading-6 text-muted-foreground">
                  当前待审核 {metrics.totals.pendingComments} 条
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>

            <Link
              href="/admin/settings?section=security"
              className="flex items-center justify-between rounded-[24px] border border-border/70 bg-muted/10 px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">检查安全设置</div>
                <div className="text-xs leading-6 text-muted-foreground">
                  查看后台入口、密码和最近会话状态
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
            title="近 6 个月活跃热力"
            description="把后台操作相关的内容生产和互动处理浓缩成热力块，快速看出忙闲波峰。"
          />
          <AdminPanelBody className="pt-4">
            <Heatmap metrics={metrics} />
          </AdminPanelBody>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title="系统状态"
            description="仅使用站内轻量数据，不引入额外监控服务。"
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
                    已运行 {metrics.system.uptimeMinutes} 分钟
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
                  <div className="text-sm font-semibold text-foreground">内存占用</div>
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
                  <div className="text-sm font-semibold text-foreground">数据库连接</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    {metrics.system.databaseOk ? "SQLite 正常响应" : "SQLite 连接异常"}
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
                  轻任务模式
                </Badge>
              </div>
            </div>
          </AdminPanelBody>
        </AdminPanel>
      </section>
    </div>
  )
}
