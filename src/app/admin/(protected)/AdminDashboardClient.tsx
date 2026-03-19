"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AdminCountBadge,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/features/admin/components/admin-ui";
import type {
  AdminDashboardMetrics,
  DashboardMetricDelta,
} from "@/features/admin/lib/dashboard-metrics";

function formatDelta(delta: DashboardMetricDelta) {
  const ratePrefix = delta.changeRate > 0 ? "+" : "";
  const deltaPrefix = delta.delta > 0 ? "+" : "";
  const tone =
    delta.delta > 0
      ? "text-emerald-600 dark:text-emerald-300"
      : delta.delta < 0
        ? "text-red-600 dark:text-red-300"
        : "text-muted-foreground";

  return {
    rateLabel: `${ratePrefix}${delta.changeRate}%`,
    detailLabel: `${deltaPrefix}${delta.delta}，较上一周期`,
    className: tone,
  };
}

function MetricCard({
  title,
  value,
  hint,
  delta,
  icon: Icon,
  accentClass,
}: {
  title: string;
  value: string;
  hint: string;
  delta: DashboardMetricDelta;
  icon: typeof FileText;
  accentClass: string;
}) {
  const deltaView = formatDelta(delta);

  return (
    <AdminPanel className="group relative overflow-hidden">
      <div className="pointer-events-none absolute right-0 top-0 size-24 -translate-y-8 translate-x-6 rounded-full bg-white/70 blur-3xl dark:bg-white/5" />
      <AdminPanelBody className="relative space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {title}
            </div>
            <div className="font-[family-name:var(--font-admin-display)] text-4xl font-extrabold tracking-[-0.05em] text-foreground">
              {value}
            </div>
          </div>
          <div
            className={`flex size-12 items-center justify-center rounded-[18px] ${accentClass}`}
          >
            <Icon className="size-5" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs leading-6 text-muted-foreground">{hint}</div>
          <Badge
            variant="outline"
            className="rounded-full border-transparent bg-white/88 text-foreground shadow-sm dark:bg-slate-950/70"
          >
            {deltaView.rateLabel}
          </Badge>
        </div>
        <div className={`text-xs font-medium ${deltaView.className}`}>
          {deltaView.detailLabel}
        </div>
      </AdminPanelBody>
    </AdminPanel>
  );
}

function TimelineChart({ metrics }: { metrics: AdminDashboardMetrics }) {
  const series = useMemo(() => {
    const maxValue = Math.max(
      1,
      ...metrics.timeline.flatMap((item) => [
        item.posts,
        item.comments,
        item.suggestions,
      ]),
    );

    const createPoints = (key: "posts" | "comments" | "suggestions") =>
      metrics.timeline
        .map((item, index) => {
          const x = (index / Math.max(metrics.timeline.length - 1, 1)) * 100;
          const y = 100 - (item[key] / maxValue) * 100;
          return `${x},${y}`;
        })
        .join(" ");

    return {
      posts: createPoints("posts"),
      comments: createPoints("comments"),
      suggestions: createPoints("suggestions"),
    };
  }, [metrics.timeline]);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] bg-slate-100/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/40 dark:ring-white/10">
        <svg viewBox="0 0 100 100" className="h-72 w-full overflow-visible">
          {[0, 25, 50, 75, 100].map((tick) => (
            <line
              key={tick}
              x1="0"
              y1={tick}
              x2="100"
              y2={tick}
              stroke="currentColor"
              className="text-slate-300/80 dark:text-slate-700/80"
              strokeDasharray="1.5 3"
            />
          ))}
          <polyline
            fill="none"
            stroke="rgb(37 99 235)"
            strokeWidth="2.8"
            points={series.posts}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            fill="none"
            stroke="rgb(15 23 42)"
            strokeWidth="2.8"
            points={series.comments}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="dark:stroke-slate-200"
          />
          <polyline
            fill="none"
            stroke="rgb(8 145 178)"
            strokeWidth="2.8"
            points={series.suggestions}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[24px] bg-white/84 px-4 py-3 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950/70 dark:ring-white/10">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-blue-600" />
            文章
          </div>
          <div className="mt-1 text-xs leading-6 text-muted-foreground">
            近 7 天内容产出趋势
          </div>
        </div>
        <div className="rounded-[24px] bg-white/84 px-4 py-3 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950/70 dark:ring-white/10">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-slate-900 dark:bg-slate-100" />
            评论
          </div>
          <div className="mt-1 text-xs leading-6 text-muted-foreground">
            近 7 天互动处理节奏
          </div>
        </div>
        <div className="rounded-[24px] bg-white/84 px-4 py-3 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950/70 dark:ring-white/10">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-cyan-600" />
            建议
          </div>
          <div className="mt-1 text-xs leading-6 text-muted-foreground">
            近 7 天反馈收集与推进
          </div>
        </div>
      </div>
    </div>
  );
}

function Heatmap({ metrics }: { metrics: AdminDashboardMetrics }) {
  const maxCount = Math.max(1, ...metrics.heatmap.map((item) => item.count));

  const getTone = (count: number) => {
    if (count === 0) return "bg-slate-200/80 dark:bg-slate-800";
    if (count / maxCount < 0.34) return "bg-blue-200 dark:bg-blue-900";
    if (count / maxCount < 0.67) return "bg-blue-400 dark:bg-blue-700";
    return "bg-blue-600";
  };

  return (
    <div className="space-y-4">
      <div className="grid max-w-full grid-flow-col grid-rows-7 gap-1 overflow-x-auto rounded-[24px] bg-slate-100/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/35 dark:ring-white/10">
        {metrics.heatmap.map((item) => (
          <div
            key={item.date}
            title={`${item.date}: ${item.count}`}
            className={`size-3 rounded-[5px] ${getTone(item.count)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>近 6 个月活跃分布</span>
        <div className="flex items-center gap-1">
          <span>低</span>
          <span className="size-3 rounded-[5px] bg-slate-200/80 dark:bg-slate-800" />
          <span className="size-3 rounded-[5px] bg-blue-200 dark:bg-blue-900" />
          <span className="size-3 rounded-[5px] bg-blue-400 dark:bg-blue-700" />
          <span className="size-3 rounded-[5px] bg-blue-600" />
          <span>高</span>
        </div>
      </div>
    </div>
  );
}

function ActionTile({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-[28px] bg-slate-100/72 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 transition hover:-translate-y-0.5 hover:bg-white dark:bg-slate-900/35 dark:ring-white/10 dark:hover:bg-slate-900/60"
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-[family-name:var(--font-admin-display)] text-lg font-bold tracking-[-0.03em] text-foreground">
            {title}
          </div>
          {badge ? (
            <Badge
              variant="outline"
              className="rounded-full bg-white/84 dark:bg-slate-950/70"
            >
              {badge}
            </Badge>
          ) : null}
        </div>
        <div className="max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </div>
      </div>
      <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
    </Link>
  );
}

function SystemRow({
  icon: Icon,
  title,
  detail,
  accentClass,
}: {
  icon: typeof Server;
  title: string;
  detail: string;
  accentClass: string;
}) {
  return (
    <div className="rounded-[24px] bg-slate-100/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/35 dark:ring-white/10">
      <div className="flex items-start gap-3">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-[18px] ${accentClass}`}
        >
          <Icon className="size-4" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <div className="text-xs leading-6 text-muted-foreground">
            {detail}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardClient({
  initialMetrics,
}: {
  initialMetrics: AdminDashboardMetrics;
}) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [pending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/jobs/dashboard-refresh", {
          method: "POST",
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          toast.error("刷新仪表盘数据失败");
          return;
        }

        setMetrics(result.metrics);
        toast.success("仪表盘数据已刷新");
      } catch {
        toast.error("刷新仪表盘数据失败");
      }
    });
  };

  return (
    <div className="space-y-6">
      <AdminPanel className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(240,247,255,0.95))] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.82),rgba(2,6,23,0.88))]">
        <AdminPanelBody className="relative p-6 md:p-8">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_42%)] lg:block" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-blue-700 dark:text-sky-300">
                Workflow Overview
              </div>
              <div className="space-y-3">
                <h2 className="max-w-4xl font-[family-name:var(--font-admin-display)] text-[2rem] font-extrabold leading-tight tracking-[-0.05em] text-foreground md:text-[2.5rem]">
                  把内容产出、互动信号和系统状态
                  <br className="hidden md:block" />
                  放进同一张后台工作台。
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                  这里优先呈现最近一周的变化、可直接进入的高频操作，以及后台运行的核心健康信号，方便你在少切页的情况下快速做判断。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AdminCountBadge value={metrics.totals.posts} label="文章" />
                <AdminCountBadge value={metrics.totals.comments} label="评论" />
                <AdminCountBadge
                  value={metrics.totals.suggestions}
                  label="建议"
                />
                <AdminCountBadge
                  value={metrics.totals.pendingComments}
                  label="待审"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="rounded-full border-white/70 bg-white/88 px-5 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                onClick={handleRefresh}
                disabled={pending}
              >
                <RefreshCw
                  className={pending ? "size-4 animate-spin" : "size-4"}
                />
                刷新数据
              </Button>
              <Button
                asChild
                className="rounded-full bg-gradient-to-br from-blue-600 to-blue-500 px-5 text-white shadow-[0_18px_36px_rgba(37,99,235,0.22)] hover:from-blue-600 hover:to-blue-600"
              >
                <Link href="/admin/posts/edit?new=1">
                  <FileText className="size-4" />
                  新建文章
                </Link>
              </Button>
            </div>
          </div>
        </AdminPanelBody>
      </AdminPanel>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="本周文章"
          value={metrics.deltas.weekPosts.current.toLocaleString()}
          hint={`总计 ${metrics.totals.posts} 篇，已发布 ${metrics.totals.publishedPosts} 篇，草稿 ${metrics.totals.draftPosts} 篇`}
          delta={metrics.deltas.weekPosts}
          icon={FileText}
          accentClass="bg-blue-600/12 text-blue-700 dark:bg-blue-500/20 dark:text-sky-200"
        />
        <MetricCard
          title="本周评论"
          value={metrics.deltas.weekComments.current.toLocaleString()}
          hint={`累计 ${metrics.totals.comments} 条，待审核 ${metrics.totals.pendingComments} 条`}
          delta={metrics.deltas.weekComments}
          icon={MessageCircle}
          accentClass="bg-slate-900/8 text-slate-700 dark:bg-white/10 dark:text-slate-200"
        />
        <MetricCard
          title="本周建议"
          value={metrics.deltas.weekSuggestions.current.toLocaleString()}
          hint={`累计 ${metrics.totals.suggestions} 条，待处理 ${metrics.totals.openSuggestions} 条`}
          delta={metrics.deltas.weekSuggestions}
          icon={MessageSquare}
          accentClass="bg-cyan-600/12 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200"
        />
        <MetricCard
          title="本月文章"
          value={metrics.deltas.monthPosts.current.toLocaleString()}
          hint="对比最近两个 30 天周期的内容产出变化"
          delta={metrics.deltas.monthPosts}
          icon={HardDrive}
          accentClass="bg-violet-600/12 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
        />
        <MetricCard
          title="本月评论"
          value={metrics.deltas.monthComments.current.toLocaleString()}
          hint="观察互动增长与评论审核压力是否抬升"
          delta={metrics.deltas.monthComments}
          icon={Activity}
          accentClass="bg-emerald-600/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
        />
        <MetricCard
          title="本月建议"
          value={metrics.deltas.monthSuggestions.current.toLocaleString()}
          hint="帮助识别近期用户反馈或问题是否集中出现"
          delta={metrics.deltas.monthSuggestions}
          icon={Settings}
          accentClass="bg-amber-500/14 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
        <AdminPanel>
          <AdminPanelHeader
            title="7 天趋势"
            description="文章、评论与建议的近期变化被压缩进同一张图里，方便快速判断后台工作负荷。"
          />
          <AdminPanelBody className="pt-5">
            <TimelineChart metrics={metrics} />
          </AdminPanelBody>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title="快捷入口"
            description="把高频动作收拢到这里，减少在不同后台页面之间来回切换。"
          />
          <AdminPanelBody className="space-y-4 pt-5">
            <ActionTile
              href="/admin/posts/edit?new=1"
              title="新建文章"
              description="直接进入 Markdown 编辑器，开始下一篇内容。"
            />
            <ActionTile
              href="/admin/comments"
              title="查看评论"
              description="优先处理最近的待审核评论与回复线程。"
              badge={`待审 ${metrics.totals.pendingComments}`}
            />
            <ActionTile
              href="/admin/settings?section=security"
              title="安全设置"
              description="查看后台会话状态、入口与安全相关配置。"
            />
          </AdminPanelBody>
        </AdminPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <AdminPanel>
          <AdminPanelHeader
            title="6 个月活跃热度"
            description="用轻量热力图观察后台内容生产和互动处理在哪些时段最集中。"
          />
          <AdminPanelBody className="pt-5">
            <Heatmap metrics={metrics} />
          </AdminPanelBody>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title="系统状态"
            description="只展示当前项目本地可得的轻量信号，不额外接入第三方监控。"
          />
          <AdminPanelBody className="space-y-3 pt-5">
            <SystemRow
              icon={Server}
              title="运行时长"
              detail={`${metrics.system.uptimeMinutes} 分钟`}
              accentClass="bg-blue-600/12 text-blue-700 dark:bg-blue-500/20 dark:text-sky-200"
            />
            <SystemRow
              icon={HardDrive}
              title="内存"
              detail={`堆内存 ${metrics.system.memoryUsedMb} MB / RSS ${metrics.system.memoryRssMb} MB`}
              accentClass="bg-violet-600/12 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
            />
            <SystemRow
              icon={Database}
              title="数据库"
              detail={
                metrics.system.databaseOk
                  ? "SQLite 连接正常"
                  : "SQLite 检查失败"
              }
              accentClass="bg-cyan-600/12 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200"
            />
            <SystemRow
              icon={Activity}
              title="最近刷新"
              detail={
                metrics.system.lastDashboardRefreshAt
                  ? new Date(
                      metrics.system.lastDashboardRefreshAt,
                    ).toLocaleString("zh-CN")
                  : "尚未手动刷新"
              }
              accentClass="bg-emerald-600/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
            />
            <div className="rounded-[24px] bg-slate-100/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/35 dark:ring-white/10">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full bg-white/84 dark:bg-slate-950/70"
                >
                  <FileText className="mr-1 size-3.5" />
                  文章 {metrics.totals.posts}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full bg-white/84 dark:bg-slate-950/70"
                >
                  <MessageCircle className="mr-1 size-3.5" />
                  评论 {metrics.totals.comments}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full bg-white/84 dark:bg-slate-950/70"
                >
                  <MessageSquare className="mr-1 size-3.5" />
                  建议 {metrics.totals.suggestions}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full bg-white/84 dark:bg-slate-950/70"
                >
                  <Settings className="mr-1 size-3.5" />
                  轻量巡检
                </Badge>
              </div>
            </div>
          </AdminPanelBody>
        </AdminPanel>
      </section>
    </div>
  );
}
