"use client";

import Link from "next/link";
import {
  CommentOutlined,
  EditOutlined,
  FileTextOutlined,
  MessageOutlined,
  ReadOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Card, Empty, Progress, Space, Tag, Typography } from "antd";

const { Paragraph, Text, Title } = Typography;

type DashboardPost = {
  title: string;
  slug: string;
  relativePath: string;
  updatedAt: string;
  date: string;
  summary: string;
  draft: boolean;
  wordCount: number;
};

type DashboardComment = {
  id: number;
  avatar: string | null;
  authorName: string;
  content: string;
  isAdmin: boolean;
  location: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

function formatRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();

  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${Math.floor(diff / 86_400_000)} 天前`;
}

function formatDateTime(date?: string) {
  if (!date) return "暂无记录";
  return new Date(date).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboardClient({
  posts,
  postCount,
  allComments,
  pendingComments,
  nodeVersion,
  initialGreeting,
}: {
  posts: DashboardPost[];
  postCount: number;
  allComments: DashboardComment[];
  pendingComments: number;
  nodeVersion: string;
  initialGreeting: string;
}) {
  const now = new Date();
  const publishedPosts = posts.filter((post) => !post.draft);
  const draftPosts = posts.filter((post) => post.draft);
  const approvedComments = allComments.filter(
    (comment) => comment.status === "approved",
  ).length;
  const rejectedComments = allComments.filter(
    (comment) => comment.status === "rejected",
  ).length;
  const adminComments = allComments.filter((comment) => comment.isAdmin).length;
  const totalWords = publishedPosts.reduce(
    (sum, post) => sum + (post.wordCount || 0),
    0,
  );
  const postsThisWeek = posts.filter((post) => {
    const date = new Date(post.updatedAt || post.date);
    return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const commentsThisWeek = allComments.filter((comment) => {
    const date = new Date(comment.createdAt);
    return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const postsThisMonth = posts.filter((post) => {
    const date = new Date(post.date || post.updatedAt);
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }).length;

  const latestPost = posts[0];
  const latestPostTime = latestPost?.updatedAt || latestPost?.date;
  const latestComment = allComments[0];
  const moderationRate = allComments.length
    ? Math.round(
        ((allComments.length - pendingComments) / allComments.length) * 100,
      )
    : 100;
  const publishRate = postCount
    ? Math.round((publishedPosts.length / postCount) * 100)
    : 100;
  const adminParticipationRate = allComments.length
    ? Math.round((adminComments / allComments.length) * 100)
    : 0;
  const approvalRate = allComments.length
    ? Math.round((approvedComments / allComments.length) * 100)
    : 100;

  const monthlyPostData = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(
      now.getFullYear(),
      now.getMonth() - (5 - index),
      1,
    );
    const count = posts.filter((post) => {
      const date = new Date(post.date || post.updatedAt);
      return (
        date.getFullYear() === monthDate.getFullYear() &&
        date.getMonth() === monthDate.getMonth()
      );
    }).length;

    return {
      label: `${monthDate.getMonth() + 1}月`,
      count,
    };
  });
  const maxMonthlyCount = Math.max(
    1,
    ...monthlyPostData.map((item) => item.count),
  );

  const rankingPosts = [...publishedPosts]
    .sort((left, right) => (right.wordCount || 0) - (left.wordCount || 0))
    .slice(0, 7);

  const commentCountByDay = allComments.reduce<Record<string, number>>(
    (acc, comment) => {
      const key = new Date(comment.createdAt).toDateString();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {},
  );
  const dailyCommentData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    const key = date.toDateString();
    return {
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      count: commentCountByDay[key] || 0,
    };
  });
  const maxDailyCount = Math.max(
    1,
    ...dailyCommentData.map((item) => item.count),
  );

  const totalComments = allComments.length;
  const approvedRatio = totalComments ? approvedComments / totalComments : 0;
  const pendingRatio = totalComments ? pendingComments / totalComments : 0;
  const rejectedRatio = totalComments ? rejectedComments / totalComments : 0;
  const approvedPercent = Math.round(approvedRatio * 100);
  const pendingPercent = Math.round(pendingRatio * 100);
  const rejectedPercent = Math.round(rejectedRatio * 100);
  const approvedStop = approvedRatio * 100;
  const pendingStop = (approvedRatio + pendingRatio) * 100;
  const donutBackground = totalComments
    ? `conic-gradient(#3b82f6 0 ${approvedStop}%, #f59e0b ${approvedStop}% ${pendingStop}%, #ef4444 ${pendingStop}% 100%)`
    : "conic-gradient(#e2e8f0 0 100%)";

  const recentActivities = [
    ...posts.slice(0, 4).map((post) => ({
      id: `post-${post.relativePath}`,
      type: "post" as const,
      title: post.title,
      meta: `文章 · ${formatDateTime(post.updatedAt || post.date)}`,
      description: post.summary || "这篇文章还没有摘要。",
      href: `/admin/posts/edit?path=${encodeURIComponent(post.relativePath)}`,
      time: new Date(post.updatedAt || post.date).getTime(),
    })),
    ...allComments.slice(0, 4).map((comment) => ({
      id: `comment-${comment.id}`,
      type: "comment" as const,
      title: comment.authorName,
      meta: `评论 · ${formatDateTime(comment.createdAt)}`,
      description: comment.content,
      href: "/admin/comments",
      time: new Date(comment.createdAt).getTime(),
    })),
  ]
    .sort((left, right) => right.time - left.time)
    .slice(0, 6);

  const quickActions = [
    {
      label: "新建文章",
      description: "进入编辑器开始写作",
      href: "/admin/posts/edit?new=1",
      icon: <EditOutlined />,
    },
    {
      label: "评论审核",
      description: `待处理 ${pendingComments} 条`,
      href: "/admin/comments",
      icon: <CommentOutlined />,
    },
    {
      label: "文章管理",
      description: "查看发布与草稿",
      href: "/admin/posts",
      icon: <FileTextOutlined />,
    },
    {
      label: "站点设置",
      description: "配置 SEO 与外观",
      href: "/admin/settings",
      icon: <SettingOutlined />,
    },
  ];

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
            分析页
          </Title>
          <Text type="secondary" className="admin-analysis-subtitle">
            {initialGreeting}，今天的内容与互动节奏都在这里。
          </Text>
        </div>
        <div className="admin-analysis-header-right">
          <div className="admin-analysis-range-group">
            <Button type="text" className="admin-analysis-range-btn is-active">
              今日
            </Button>
            <Button type="text" className="admin-analysis-range-btn">
              本周
            </Button>
            <Button type="text" className="admin-analysis-range-btn">
              本月
            </Button>
            <Button type="text" className="admin-analysis-range-btn">
              全年
            </Button>
          </div>
          <Button type="primary" icon={<ThunderboltOutlined />}>
            导出报表
          </Button>
        </div>
      </section>

      <section className="admin-analysis-kpi-grid">
        <Card className="admin-panel-card admin-analysis-kpi-card">
          <div className="admin-analysis-kpi-top">
            <Text type="secondary">文章总量</Text>
            <Tag color="blue">总库存</Tag>
          </div>
          <div className="admin-analysis-kpi-value">
            {postCount.toLocaleString("zh-CN")}
          </div>
          <Text type="secondary">近 7 天更新 {postsThisWeek} 篇</Text>
        </Card>
        <Card className="admin-panel-card admin-analysis-kpi-card">
          <div className="admin-analysis-kpi-top">
            <Text type="secondary">本月发布</Text>
            <Tag color="green">发布率 {publishRate}%</Tag>
          </div>
          <div className="admin-analysis-kpi-value">
            {postsThisMonth.toLocaleString("zh-CN")}
          </div>
          <Text type="secondary">草稿池 {draftPosts.length} 篇</Text>
        </Card>
        <Card className="admin-panel-card admin-analysis-kpi-card">
          <div className="admin-analysis-kpi-top">
            <Text type="secondary">评论总量</Text>
            <Tag color="cyan">互动</Tag>
          </div>
          <div className="admin-analysis-kpi-value">
            {totalComments.toLocaleString("zh-CN")}
          </div>
          <Text type="secondary">近 7 天新增 {commentsThisWeek} 条</Text>
        </Card>
        <Card className="admin-panel-card admin-analysis-kpi-card">
          <div className="admin-analysis-kpi-top">
            <Text type="secondary">待审核</Text>
            <Tag color={pendingComments > 0 ? "gold" : "green"}>
              处理率 {moderationRate}%
            </Tag>
          </div>
          <div className="admin-analysis-kpi-value">
            {pendingComments.toLocaleString("zh-CN")}
          </div>
          <Text type="secondary">站长参与 {adminParticipationRate}%</Text>
        </Card>
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
          <div className="admin-analysis-metric-row">
            <div className="admin-analysis-metric-item">
              <Text type="secondary">累计字数</Text>
              <strong>{totalWords.toLocaleString("zh-CN")}</strong>
            </div>
            <div className="admin-analysis-metric-item">
              <Text type="secondary">已发布</Text>
              <strong>
                {publishedPosts.length.toLocaleString("zh-CN")} 篇
              </strong>
            </div>
            <div className="admin-analysis-metric-item">
              <Text type="secondary">草稿池</Text>
              <strong>{draftPosts.length.toLocaleString("zh-CN")} 篇</strong>
            </div>
          </div>
        </Card>

        <Card className="admin-panel-card admin-analysis-rank-card">
          <div className="admin-analysis-card-head">
            <div>
              <Text type="secondary">热门文章</Text>
              <Title level={4} className="admin-analysis-card-title">
                阅读优先级排名
              </Title>
            </div>
            <Tag color="blue">按字数排序</Tag>
          </div>
          <div className="admin-analysis-rank-list">
            {rankingPosts.length > 0 ? (
              rankingPosts.map((post, index) => (
                <div key={post.relativePath} className="admin-analysis-rank-item">
                  <span className={`admin-analysis-rank-index rank-${index + 1}`}>
                    {index + 1}
                  </span>
                  <div className="admin-analysis-rank-body">
                    <Link
                      href={`/admin/posts/edit?path=${encodeURIComponent(
                        post.relativePath,
                      )}`}
                    >
                      {post.title}
                    </Link>
                    <Text type="secondary">{post.wordCount || 0} 字</Text>
                  </div>
                  <Text type="secondary">
                    {formatRelativeTime(post.updatedAt || post.date)}
                  </Text>
                </div>
              ))
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="还没有文章内容"
              />
            )}
          </div>
        </Card>
      </section>

      <section className="admin-analysis-mid-grid">
        <Card className="admin-panel-card admin-analysis-comment-trend">
          <div className="admin-analysis-card-head">
            <div>
              <Text type="secondary">评论增长</Text>
              <Title level={4} className="admin-analysis-card-title">
                最近 7 天互动变化
              </Title>
            </div>
            <Tag color="cyan">{commentsThisWeek} 条新增</Tag>
          </div>
          <div className="admin-analysis-mini-bars">
            {dailyCommentData.map((item) => (
              <div key={item.label} className="admin-analysis-mini-col">
                <div className="admin-analysis-mini-track">
                  <div
                    className="admin-analysis-mini-fill"
                    style={{
                      height: `${Math.max(
                        6,
                        (item.count / maxDailyCount) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="admin-analysis-comment-summary">
            <div>
              <Text type="secondary">待审核</Text>
              <strong>{pendingComments} 条</strong>
            </div>
            <div>
              <Text type="secondary">通过率</Text>
              <strong>{approvalRate}%</strong>
            </div>
            <div>
              <Text type="secondary">站长回复</Text>
              <strong>{adminComments} 条</strong>
            </div>
          </div>
        </Card>

        <Card className="admin-panel-card admin-analysis-comment-status">
          <div className="admin-analysis-card-head">
            <div>
              <Text type="secondary">评论状态占比</Text>
              <Title level={4} className="admin-analysis-card-title">
                审核结构一眼看清
              </Title>
            </div>
            <Tag color={pendingComments > 0 ? "gold" : "green"}>
              处理率 {moderationRate}%
            </Tag>
          </div>
          <div className="admin-analysis-donut-layout">
            <div
              className="admin-analysis-donut"
              style={{ background: donutBackground }}
            >
              <div className="admin-analysis-donut-core">
                <strong>{totalComments}</strong>
                <span>总评论</span>
              </div>
            </div>
            <div className="admin-analysis-donut-list">
              <div className="admin-analysis-donut-item">
                <span className="dot dot-blue" />
                <div>
                  <Text type="secondary">已通过</Text>
                  <strong>{approvedComments} 条</strong>
                </div>
                <Text type="secondary">{approvedPercent}%</Text>
              </div>
              <div className="admin-analysis-donut-item">
                <span className="dot dot-amber" />
                <div>
                  <Text type="secondary">待审核</Text>
                  <strong>{pendingComments} 条</strong>
                </div>
                <Text type="secondary">{pendingPercent}%</Text>
              </div>
              <div className="admin-analysis-donut-item">
                <span className="dot dot-red" />
                <div>
                  <Text type="secondary">已拦截</Text>
                  <strong>{rejectedComments} 条</strong>
                </div>
                <Text type="secondary">{rejectedPercent}%</Text>
              </div>
            </div>
          </div>
          <div className="admin-analysis-progress-list">
            <div className="admin-analysis-progress-item">
              <span>评论处理率</span>
              <Progress
                percent={moderationRate}
                showInfo={false}
                strokeColor={moderationRate < 70 ? "#f59e0b" : "#16a34a"}
                railColor="rgba(148,163,184,.18)"
              />
            </div>
            <div className="admin-analysis-progress-item">
              <span>评论通过率</span>
              <Progress
                percent={approvalRate}
                showInfo={false}
                strokeColor="#3b82f6"
                railColor="rgba(59,130,246,.14)"
              />
            </div>
          </div>
        </Card>
      </section>

      <section className="admin-analysis-bottom-grid">
        <Card className="admin-panel-card admin-analysis-activity-card">
          <div className="admin-analysis-card-head">
            <div>
              <Text type="secondary">最近动态</Text>
              <Title level={4} className="admin-analysis-card-title">
                内容与互动融合流
              </Title>
            </div>
            <Text type="secondary">{formatDateTime(latestPostTime)}</Text>
          </div>
          <div className="admin-analysis-activity-list">
            {recentActivities.length > 0 ? (
              recentActivities.map((item) => (
                <div key={item.id} className="admin-analysis-activity-item">
                  <span className={`admin-analysis-activity-icon type-${item.type}`}>
                    {item.type === "post" ? <FileTextOutlined /> : <MessageOutlined />}
                  </span>
                  <div className="admin-analysis-activity-body">
                    <Link href={item.href}>{item.title}</Link>
                    <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                      {item.description}
                    </Paragraph>
                    <Text type="secondary">{item.meta}</Text>
                  </div>
                </div>
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无动态" />
            )}
          </div>
        </Card>

        <Card className="admin-panel-card admin-analysis-ops-card">
          <div className="admin-analysis-card-head">
            <div>
              <Text type="secondary">快捷入口</Text>
              <Title level={4} className="admin-analysis-card-title">
                管理操作集中区
              </Title>
            </div>
            <Tag color="geekblue">后台常用</Tag>
          </div>
          <div className="admin-analysis-action-grid">
            {quickActions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="admin-analysis-action-item"
              >
                <span className="admin-analysis-action-icon">{item.icon}</span>
                <div>
                  <strong>{item.label}</strong>
                  <Text type="secondary">{item.description}</Text>
                </div>
              </Link>
            ))}
          </div>
          <div className="admin-analysis-system-list">
            <div>
              <Text type="secondary">Node 环境</Text>
              <strong>{nodeVersion}</strong>
            </div>
            <div>
              <Text type="secondary">最新文章</Text>
              <strong>{latestPost?.title || "暂无"}</strong>
            </div>
            <div>
              <Text type="secondary">最新评论</Text>
              <strong>{latestComment?.authorName || "暂无"}</strong>
            </div>
          </div>
          <div className="admin-analysis-ops-footer">
            <Button href="/admin/suggestions">管理建议</Button>
            <Button href="/" target="_blank" icon={<ReadOutlined />}>
              打开前台
            </Button>
          </div>
        </Card>
      </section>
    </Space>
  );
}
