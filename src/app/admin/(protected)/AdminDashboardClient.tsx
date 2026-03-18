"use client"

import { Card, Space, Typography } from "antd"

const { Text, Title } = Typography

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
    const date = new Date(base)
    return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000
  }).length
  const commentsThisWeek = allComments.filter((comment) => {
    const date = new Date(comment.createdAt)
    return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000
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

  const kpis = [
    {
      key: "posts",
      label: "文章总量",
      value: postCount,
      hint: `近 7 天更新 ${postsThisWeek} 篇`,
    },
    {
      key: "published",
      label: "已发布",
      value: publishedPosts.length,
      hint: `草稿 ${draftPosts.length} 篇`,
    },
    {
      key: "comments",
      label: "评论总量",
      value: totalComments,
      hint: `近 7 天新增 ${commentsThisWeek} 条`,
    },
    {
      key: "pending",
      label: "待审核",
      value: pendingComments,
      hint: `处理率 ${moderationRate}%`,
    },
  ]

  return (
    <Space
      orientation="vertical"
      size={18}
      style={{ display: "flex" }}
      className="admin-analysis-shell"
    >
      <section className="admin-analysis-header">
        <div className="admin-analysis-header-left">
          <Title level={2} className="admin-analysis-title">
            仪表盘
          </Title>
          <Text type="secondary" className="admin-analysis-subtitle">
            {initialGreeting}，这是今日核心指标概览。</Text>
        </div>
      </section>

      <section className="admin-analysis-kpi-grid">
        {kpis.map((item) => (
          <Card key={item.key} className="admin-panel-card admin-analysis-kpi-card">
            <Text type="secondary">{item.label}</Text>
            <div className="admin-analysis-kpi-value">
              {item.value.toLocaleString("zh-CN")}
            </div>
            <Text type="secondary">{item.hint}</Text>
          </Card>
        ))}
      </section>

      <section className="admin-analysis-top-grid">
        <Card className="admin-panel-card admin-analysis-trend-card">
          <div className="admin-analysis-card-head">
            <div>
              <Text type="secondary">内容发布趋势</Text>
              <Title level={4} className="admin-analysis-card-title">
                近 6 个月内容产出
              </Title>
            </div>
            <div className="admin-analysis-meta-stack">
              <Text type="secondary">最新更新</Text>
              <Text>{formatDateTime(latestPostTime)}</Text>
            </div>
          </div>
          <div className="admin-analysis-bars">
            {monthlyPostData.map((item) => (
              <div key={item.label} className="admin-analysis-bar-col">
                <span className="admin-analysis-bar-count">{item.count}</span>
                <div className="admin-analysis-bar-track">
                  <div
                    className="admin-analysis-bar-fill"
                    style={{
                      height: `${Math.max(
                        12,
                        (item.count / maxMonthlyCount) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <span className="admin-analysis-bar-label">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </Space>
  )
}
