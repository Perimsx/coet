"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
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
  Plus,
} from "lucide-react";
import { toast } from '@/shared/hooks/use-toast'

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatCard,
} from "@/features/admin/components/admin-ui";
import type {
  AdminDashboardMetrics,
} from "@/features/admin/lib/dashboard-metrics";

function TimelineChart({ metrics }: { metrics: AdminDashboardMetrics }) {
  const maxValue = Math.max(
    1,
    ...metrics.timeline.flatMap((item) => [
      item.posts,
      item.comments,
      item.suggestions,
    ]),
  );

  const getHeight = (val: number) => {
    if (maxValue === 0) return 0;
    return (val / maxValue) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex h-56 w-full items-end justify-between gap-2 px-2">
        {metrics.timeline.map((item, idx) => (
          <div key={idx} className="flex h-full w-full flex-col justify-end gap-3">
            <div className="group relative flex h-full flex-1 items-end justify-center gap-1.5 rounded-md hover:bg-muted/30 transition-colors p-1">
              <div
                className="w-full max-w-[12px] rounded-t-sm bg-blue-600 transition-all duration-300"
                style={{ height: `${Math.max(getHeight(item.posts), 2)}%` }}
                title={`文章: ${item.posts}`}
              />
              <div
                className="w-full max-w-[12px] rounded-t-sm bg-slate-800 dark:bg-slate-200 transition-all duration-300"
                style={{ height: `${Math.max(getHeight(item.comments), 2)}%` }}
                title={`评论: ${item.comments}`}
              />
              <div
                className="w-full max-w-[12px] rounded-t-sm bg-cyan-600 transition-all duration-300"
                style={{ height: `${Math.max(getHeight(item.suggestions), 2)}%` }}
                title={`建议: ${item.suggestions}`}
              />
            </div>
            <div className="text-center text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
              {item.date.slice(-5)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 grid-cols-3">
        <div className="rounded-xl border bg-card p-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-blue-600" />
            新建文章
          </div>
          <div className="mt-2 text-xs text-muted-foreground">7 天内容产出</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-slate-800 dark:bg-slate-200" />
            评论留言
          </div>
          <div className="mt-2 text-xs text-muted-foreground">7 天系统互动</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-cyan-600" />
            建议反馈
          </div>
          <div className="mt-2 text-xs text-muted-foreground">7 天来信反馈</div>
        </div>
      </div>
    </div>
  );
}



function Heatmap({ metrics }: { metrics: AdminDashboardMetrics }) {
  const maxCount = Math.max(1, ...metrics.heatmap.map((item) => item.count));

  const getTone = (count: number) => {
    if (count === 0) return "bg-muted";
    if (count / maxCount < 0.34) return "bg-blue-300 dark:bg-blue-800";
    if (count / maxCount < 0.67) return "bg-blue-400 dark:bg-blue-600";
    return "bg-blue-600 dark:bg-blue-500";
  };

  return (
    <div className="space-y-4">
      <div className="grid max-w-full grid-flow-col grid-rows-7 gap-1 overflow-x-auto rounded-xl border bg-muted/20 p-4">
        {metrics.heatmap.map((item) => (
          <div
            key={item.date}
            title={`${item.date}: ${item.count}`}
            className={`size-3 rounded-sm ${getTone(item.count)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>近 6 个月活跃分布</span>
        <div className="flex items-center gap-1">
          <span>低</span>
          <span className="size-3 rounded-sm bg-muted" />
          <span className="size-3 rounded-sm bg-blue-300 dark:bg-blue-800" />
          <span className="size-3 rounded-sm bg-blue-400 dark:bg-blue-600" />
          <span className="size-3 rounded-sm bg-blue-600 dark:bg-blue-500" />
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
      className="group flex items-center justify-between rounded-xl border bg-card px-4 py-4 shadow-sm hover:bg-muted/50 transition-colors"
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </div>
          {badge ? (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {badge}
            </Badge>
          ) : null}
        </div>
        <div className="max-w-[280px] text-xs text-muted-foreground">
          {description}
        </div>
      </div>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
    </Link>
  );
}

function SystemRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Server;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
      <div className="rounded-lg bg-muted p-2 text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="space-y-0.5">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
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
      <div className="flex flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">概览</h1>
          <p className="text-muted-foreground text-sm mt-1">系统状态、数据与产出趋势。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={pending}
          >
            <RefreshCw className={pending ? "mr-2 size-4 animate-spin" : "mr-2 size-4"} />
            刷新
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/posts/edit?new=1">
              <Plus className="mr-2 size-4" />
              新建
            </Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title="总文章"
          value={metrics.totals.posts}
          hint={`本周 ${metrics.deltas.weekPosts.delta > 0 ? "+" : ""}${metrics.deltas.weekPosts.delta} 篇`}
          icon={FileText}
        />
        <AdminStatCard
          title="总评论"
          value={metrics.totals.comments}
          hint={`待审 ${metrics.totals.pendingComments} 条`}
          icon={MessageCircle}
        />
        <AdminStatCard
          title="建议反馈"
          value={metrics.totals.suggestions}
          hint={`待处理 ${metrics.totals.openSuggestions} 条`}
          icon={MessageSquare}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-7">
        <div className="col-span-1 lg:col-span-4 space-y-6">
          <AdminPanel>
            <AdminPanelHeader title="活跃热度" description="近 6 个月系统活跃度" />
            <AdminPanelBody>
              <Heatmap metrics={metrics} />
            </AdminPanelBody>
          </AdminPanel>

          <AdminPanel>
            <AdminPanelHeader title="7天趋势" description="各项数据产出及互动" />
            <AdminPanelBody>
              <TimelineChart metrics={metrics} />
            </AdminPanelBody>
          </AdminPanel>
        </div>

        <div className="col-span-1 lg:col-span-3 space-y-6">
          <AdminPanel>
            <AdminPanelHeader title="快捷操作" description="工作台高频入口" />
            <AdminPanelBody className="space-y-3">
              <ActionTile
                href="/admin/posts/edit?new=1"
                title="新建文章"
                description="进入编辑器撰写新内容"
              />
              <ActionTile
                href="/admin/comments"
                title="评论审核"
                description="处理最新的访客留言"
                badge={metrics.totals.pendingComments > 0 ? `${metrics.totals.pendingComments} 条待审` : undefined}
              />
              <ActionTile
                href="/admin/settings"
                title="系统设置"
                description="调整站点全局变量或安全设置"
              />
            </AdminPanelBody>
          </AdminPanel>

          <AdminPanel>
            <AdminPanelHeader title="系统状态" description="服务器及环境监控" />
            <AdminPanelBody className="space-y-3">
              <SystemRow
                icon={Server}
                title="运行时长"
                detail={`${metrics.system.uptimeMinutes} 分钟`}
              />
              <SystemRow
                icon={HardDrive}
                title="内存使用"
                detail={`堆 ${metrics.system.memoryUsedMb}MB / RSS ${metrics.system.memoryRssMb}MB`}
              />
              <SystemRow
                icon={Database}
                title="数据库状态"
                detail={metrics.system.databaseOk ? "连接正常" : "异常"}
              />
              <SystemRow
                icon={Activity}
                title="最后刷新"
                detail={
                  metrics.system.lastDashboardRefreshAt
                    ? new Date(metrics.system.lastDashboardRefreshAt).toLocaleString("zh-CN")
                    : "从未刷新"
                }
              />
            </AdminPanelBody>
          </AdminPanel>
        </div>
      </section>
    </div>
  );
}

