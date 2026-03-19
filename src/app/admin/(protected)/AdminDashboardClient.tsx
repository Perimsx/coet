"use client"

import { Activity, FileText, MessageSquare, ShieldCheck } from "lucide-react"

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
      hint: moderationRate >= 90 ? "审核流程正常" : "建议优先清理待审内容",
    },
  ]

  return (
    <div className="space-y-5">
      <AdminPanel>
        <AdminPanelBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {initialGreeting}，后台核心状态一目了然
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              聚合文章与评论关键指标，优先发现待处理事项。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
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

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <AdminPanel>
          <AdminPanelHeader
            title="近 6 个月内容产出"
            description="按最近更新时间聚合文章数量，快速判断内容节奏。"
            actions={
              <div className="rounded-xl border border-border/60 bg-background px-3 py-2 text-right">
                <div className="text-[11px] tracking-[0.14em] text-muted-foreground">最近更新</div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {formatDateTime(latestPostTime)}
                </div>
              </div>
            }
          />
          <AdminPanelBody className="pt-4">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
              {monthlyPostData.map((item) => (
                <div
                  key={item.label}
                  className="flex min-h-[148px] flex-col items-center justify-end gap-2 rounded-xl border border-border/60 bg-muted/20 px-2 py-3 sm:min-h-[170px]"
                >
                  <div className="text-sm font-semibold text-foreground">{item.count}</div>
                  <div className="flex h-24 w-full items-end justify-center rounded-full bg-background/70 p-2 sm:h-28">
                    <div
                      className="w-full rounded-full bg-gradient-to-t from-primary to-primary/40 transition-all"
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
            title="运营摘要"
            description="高频关注项集中展示，便于快速巡检。"
          />
          <AdminPanelBody className="space-y-3 pt-4">
            {activityRows.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <div className="text-xs leading-6 text-muted-foreground">{item.hint}</div>
                  </div>
                  <div className="w-fit rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-foreground">
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </AdminPanelBody>
        </AdminPanel>
      </section>
    </div>
  )
}
