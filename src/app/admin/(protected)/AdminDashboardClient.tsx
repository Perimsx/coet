"use client"

import { Activity, Clock3, FileText, MessageSquare, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  AdminCountBadge,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatCard,
} from "@/features/admin/components/admin-ui"

type DashboardPost = {
  date?: string
  updatedAt?: string
  draft: boolean
}

type DashboardComment = {
  createdAt: string
}

function formatDateTime(date?: string) {
  if (!date) return "暂无记录"

  return new Date(date).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AdminDashboardClient({
  posts,
  postCount,
  allComments,
  pendingComments,
  initialGreeting,
}: {
  posts: DashboardPost[]
  postCount: number
  allComments: DashboardComment[]
  pendingComments: number
  initialGreeting: string
}) {
  const now = new Date()
  const publishedPosts = posts.filter((post) => !post.draft)
  const draftPosts = posts.filter((post) => post.draft)
  const totalComments = allComments.length

  const postsThisWeek = posts.filter((post) => {
    const base = post.updatedAt || post.date
    if (!base) return false
    return now.getTime() - new Date(base).getTime() <= 7 * 24 * 60 * 60 * 1000
  }).length

  const commentsThisWeek = allComments.filter((comment) => {
    return now.getTime() - new Date(comment.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000
  }).length

  const moderationRate = totalComments
    ? Math.round(((totalComments - pendingComments) / totalComments) * 100)
    : 100

  const monthlyPostData = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const count = posts.filter((post) => {
      const base = post.updatedAt || post.date
      if (!base) return false

      const date = new Date(base)
      return (
        date.getFullYear() === monthDate.getFullYear() &&
        date.getMonth() === monthDate.getMonth()
      )
    }).length

    return {
      label: `${monthDate.getMonth() + 1}月`,
      count,
    }
  })

  const maxMonthlyCount = Math.max(1, ...monthlyPostData.map((item) => item.count))
  const latestPostTime = posts[0]?.updatedAt || posts[0]?.date

  const activityRows = [
    {
      label: "最近 7 天文章更新",
      value: `${postsThisWeek} 篇`,
      hint: `其中草稿 ${draftPosts.length} 篇`,
    },
    {
      label: "最近 7 天评论新增",
      value: `${commentsThisWeek} 条`,
      hint: `待审核 ${pendingComments} 条`,
    },
    {
      label: "审核处理率",
      value: `${moderationRate}%`,
      hint: moderationRate >= 90 ? "审核流转正常" : "建议优先清理待审内容",
    },
  ]

  return (
    <div className="space-y-5">
      <AdminPanel className="overflow-hidden rounded-[32px] border-border/70 bg-gradient-to-br from-card via-card to-primary/5">
        <AdminPanelBody className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
              今日概览
            </Badge>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {initialGreeting}，后台状态一切清晰。
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                这里聚合文章、评论与审核节奏，优先帮助你快速发现待处理内容与最近的更新走势。
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <AdminCountBadge value={publishedPosts.length} label="已发布" />
            <AdminCountBadge value={draftPosts.length} label="草稿" />
            <AdminCountBadge value={pendingComments} label="待审" />
          </div>
        </AdminPanelBody>
      </AdminPanel>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="文章总量"
          value={postCount}
          hint={`最近 7 天更新 ${postsThisWeek} 篇`}
          icon={FileText}
        />
        <AdminStatCard
          title="已发布文章"
          value={publishedPosts.length}
          hint={`草稿 ${draftPosts.length} 篇`}
          icon={Activity}
        />
        <AdminStatCard
          title="评论总量"
          value={totalComments}
          hint={`最近 7 天新增 ${commentsThisWeek} 条`}
          icon={MessageSquare}
        />
        <AdminStatCard
          title="审核状态"
          value={`${moderationRate}%`}
          hint={`待审核 ${pendingComments} 条`}
          icon={ShieldCheck}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <AdminPanel>
          <AdminPanelHeader
            title="近 6 个月内容产出"
            description="按最近更新时间或发布时间聚合文章数量，帮助快速判断内容节奏。"
            actions={
              <div className="rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-right">
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  最近更新
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {formatDateTime(latestPostTime)}
                </div>
              </div>
            }
          />
          <AdminPanelBody className="space-y-5">
            <div className="grid grid-cols-6 gap-3">
              {monthlyPostData.map((item) => (
                <div
                  key={item.label}
                  className="flex min-h-[220px] flex-col items-center justify-end gap-3 rounded-[24px] border border-border/60 bg-muted/20 px-2 py-4"
                >
                  <div className="text-sm font-semibold text-foreground">{item.count}</div>
                  <div className="flex h-36 w-full items-end justify-center rounded-full bg-background/70 p-2">
                    <div
                      className="w-full rounded-full bg-gradient-to-t from-primary to-primary/35 transition-all"
                      style={{
                        height: `${Math.max(12, (item.count / maxMonthlyCount) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </AdminPanelBody>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title="运转摘要"
            description="高频关注项直接集中在一列，适合快速巡检。"
          />
          <AdminPanelBody className="space-y-3">
            {activityRows.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <div className="text-xs leading-6 text-muted-foreground">{item.hint}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/70 bg-background px-3 py-1 text-xs font-medium"
                  >
                    {item.value}
                  </Badge>
                </div>
              </div>
            ))}

            <div className="rounded-[24px] border border-border/60 bg-gradient-to-br from-background to-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Clock3 className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">建议操作顺序</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    先处理评论审核，再检查草稿与最近更新，最后回看建议与友链申请。
                  </div>
                </div>
              </div>
            </div>
          </AdminPanelBody>
        </AdminPanel>
      </section>
    </div>
  )
}
