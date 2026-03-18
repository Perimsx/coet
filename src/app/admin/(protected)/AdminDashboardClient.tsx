"use client";

import Link from "next/link";
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  EditOutlined,
  FileTextOutlined,
  MessageOutlined,
  ReadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Card, Empty, Progress, Space, Tag, Typography } from "antd";

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

function getCommentStatus(status: DashboardComment["status"]) {
  if (status === "pending") return { color: "gold", label: "待审核" };
  if (status === "rejected") return { color: "red", label: "已拦截" };
  return { color: "green", label: "已通过" };
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
  const latestComment = allComments[0];
  const latestPostTime = latestPost?.updatedAt || latestPost?.date;
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
  const recentActivities = [
    ...posts.slice(0, 3).map((post) => ({
      id: `post-${post.relativePath}`,
      title: post.title,
      meta: `文章 · ${formatDateTime(post.updatedAt || post.date)}`,
      description: post.summary || "这篇文章还没有摘要。",
      time: new Date(post.updatedAt || post.date).getTime(),
    })),
    ...allComments.slice(0, 3).map((comment) => ({
      id: `comment-${comment.id}`,
      title: comment.authorName,
      meta: `评论 · ${formatDateTime(comment.createdAt)}`,
      description: comment.content,
      time: new Date(comment.createdAt).getTime(),
    })),
  ]
    .sort((left, right) => right.time - left.time)
    .slice(0, 6);

  const monthlyPostData = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
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

  const quickLinks = [
    {
      title: "写新文章",
      description: "直接进入编辑器，开始新草稿或成稿。",
      href: "/admin/posts/edit?new=1",
      icon: <EditOutlined />,
    },
    {
      title: "评论管理",
      description:
        pendingComments > 0
          ? `当前还有 ${pendingComments} 条待审核评论。`
          : "审核队列已经清空，可以放心切回内容工作。",
      href: "/admin/comments",
      icon: <CommentOutlined />,
    },
    {
      title: "文章管理",
      description: "集中查看已发布、草稿和最近更新时间。",
      href: "/admin/posts",
      icon: <FileTextOutlined />,
    },
    {
      title: "站点设置",
      description: "维护 SEO、邮件、社交和备案信息。",
      href: "/admin/settings",
      icon: <SettingOutlined />,
    },
  ];

  const focusItems = [
    pendingComments > 0
      ? {
          title: "优先处理评论",
          value: `${pendingComments} 条待审核`,
          description: "先把审核队列清掉，避免访客互动继续堆积。",
          href: "/admin/comments",
          actionLabel: "去处理",
        }
      : null,
    draftPosts.length > 0
      ? {
          title: "整理草稿",
          value: `${draftPosts.length} 篇待打磨`,
          description: "草稿池已经有储备，适合顺手推进下一篇成稿。",
          href: "/admin/posts",
          actionLabel: "看草稿",
        }
      : null,
    latestPost
      ? {
          title: "继续上次编辑",
          value: latestPost.title,
          description: `最后更新于 ${formatDateTime(latestPost.updatedAt)}。`,
          href: `/admin/posts/edit?path=${encodeURIComponent(latestPost.relativePath)}`,
          actionLabel: "继续编辑",
        }
      : null,
  ].filter(Boolean) as Array<{
    title: string;
    value: string;
    description: string;
    href: string;
    actionLabel: string;
  }>;

  const kpiItems = [
    {
      label: "文章总数",
      value: postCount.toLocaleString("zh-CN"),
      hint: "当前内容库存",
      icon: <FileTextOutlined />,
      tone: "blue",
    },
    {
      label: "已发布",
      value: publishedPosts.length.toLocaleString("zh-CN"),
      hint: `发布率 ${publishRate}%`,
      icon: <CheckCircleOutlined />,
      tone: "green",
    },
    {
      label: "草稿池",
      value: draftPosts.length.toLocaleString("zh-CN"),
      hint: draftPosts.length ? "还有内容储备" : "当前没有草稿积压",
      icon: <EditOutlined />,
      tone: "amber",
    },
    {
      label: "评论总量",
      value: allComments.length.toLocaleString("zh-CN"),
      hint: `近 7 天新增 ${commentsThisWeek} 条`,
      icon: <MessageOutlined />,
      tone: "slate",
    },
    {
      label: "待审核",
      value: pendingComments.toLocaleString("zh-CN"),
      hint: pendingComments > 0 ? "建议优先处理" : "审核队列为空",
      icon: <ClockCircleOutlined />,
      tone: pendingComments > 0 ? "amber" : "green",
    },
    {
      label: "站长参与",
      value: `${adminParticipationRate}%`,
      hint: `${adminComments} 条站长回复 / 评论`,
      icon: <CommentOutlined />,
      tone: "cyan",
    },
  ];

  return (
    <Space orientation="vertical" size={18} style={{ display: "flex" }} className="admin-dashboard-shell">
      <section className="admin-dashboard-top-grid">
        <Card className="admin-panel-card admin-dashboard-command-card" variant="borderless">
          <div className="admin-dashboard-command-head">
            <div className="admin-dashboard-command-copy">
              <Tag color="geekblue" className="admin-dashboard-eyebrow">
                后台总览
              </Tag>
              <Title level={2} className="admin-dashboard-title">
                {initialGreeting}，今天的后台节奏一眼看清
              </Title>
              <Paragraph className="admin-dashboard-copy">
                当前共维护 {postCount} 篇文章、{allComments.length} 条评论，最近一次内容更新在{" "}
                {formatDateTime(latestPostTime)}。先处理互动，再回到写作和站点优化，会更顺手。
              </Paragraph>
            </div>

            <div className="admin-dashboard-command-badge">
              <span>近 7 天总动作</span>
              <strong>{(postsThisWeek + commentsThisWeek).toLocaleString("zh-CN")}</strong>
              <Text>更新 {postsThisWeek} 篇，互动 {commentsThisWeek} 条</Text>
            </div>
          </div>

          <div className="admin-dashboard-signal-grid">
            <div className="admin-dashboard-signal-card">
              <span>最近更新</span>
              <strong>{formatDateTime(latestPostTime)}</strong>
              <Text type="secondary">{latestPost?.title || "还没有文章内容"}</Text>
            </div>
            <div className="admin-dashboard-signal-card">
              <span>本月发文</span>
              <strong>{postsThisMonth} 篇</strong>
              <Text type="secondary">草稿储备 {draftPosts.length} 篇</Text>
            </div>
            <div className="admin-dashboard-signal-card">
              <span>总字数</span>
              <strong>{totalWords.toLocaleString("zh-CN")}</strong>
              <Text type="secondary">发布文章累计字数</Text>
            </div>
            <div className="admin-dashboard-signal-card">
              <span>最新评论</span>
              <strong>{latestComment ? formatRelativeTime(latestComment.createdAt) : "暂无"}</strong>
              <Text type="secondary">{latestComment?.authorName || "等待首条互动"}</Text>
            </div>
          </div>

          <div className="admin-dashboard-primary-actions">
            <Button type="primary" icon={<EditOutlined />} href="/admin/posts/edit?new=1">
              写新文章
            </Button>
            <Button icon={<CommentOutlined />} href="/admin/comments">
              处理评论
            </Button>
          </div>

          <div className="admin-dashboard-quick-grid">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="admin-dashboard-quick-link">
                <span className="admin-dashboard-quick-icon">{item.icon}</span>
                <span className="admin-dashboard-quick-body">
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </span>
                <ArrowRightOutlined className="admin-dashboard-quick-arrow" />
              </Link>
            ))}
          </div>
        </Card>

        <div className="admin-dashboard-side-stack">
          <Card className="admin-panel-card admin-dashboard-status-panel" variant="borderless">
            <div className="admin-dashboard-panel-top">
              <Text>当前优先级</Text>
              <Tag color={pendingComments > 0 ? "gold" : "green"}>
                {pendingComments > 0 ? "先处理互动" : "状态稳定"}
              </Tag>
            </div>
            <div className="admin-dashboard-status-value">
              {pendingComments > 0 ? `${pendingComments} 条待审核` : "后台很干净"}
            </div>
            <Paragraph className="admin-dashboard-panel-copy">
              {pendingComments > 0
                ? "建议先清空评论审核，再回到文章和配置调整。"
                : "可以把时间留给新文章、草稿整理或全站设置优化。"}
            </Paragraph>

            <div className="admin-dashboard-progress-list">
              <div className="admin-dashboard-progress-block">
                <div className="admin-dashboard-progress-label">
                  <span>评论处理率</span>
                  <strong>{moderationRate}%</strong>
                </div>
                <Progress
                  percent={moderationRate}
                  showInfo={false}
                  strokeColor={moderationRate < 70 ? "#f59e0b" : "#16a34a"}
                  railColor={moderationRate < 70 ? "rgba(245,158,11,.18)" : "rgba(34,197,94,.14)"}
                />
              </div>
              <div className="admin-dashboard-progress-block">
                <div className="admin-dashboard-progress-label">
                  <span>评论通过率</span>
                  <strong>{approvalRate}%</strong>
                </div>
                <Progress
                  percent={approvalRate}
                  showInfo={false}
                  strokeColor="#ffffff"
                  railColor="rgba(255,255,255,.18)"
                />
              </div>
            </div>

            <div className="admin-dashboard-mini-grid">
              <div className="admin-dashboard-mini-stat">
                <span>已通过</span>
                <strong>{approvedComments}</strong>
              </div>
              <div className="admin-dashboard-mini-stat">
                <span>已拦截</span>
                <strong>{rejectedComments}</strong>
              </div>
            </div>
          </Card>

          <Card className="admin-panel-card admin-dashboard-health-panel">
            <div className="admin-dashboard-section-heading">
              <span>健康度</span>
              <Text type="secondary">把最关键的站点指标压缩成一列，方便快速扫一眼。</Text>
            </div>
            <div className="admin-dashboard-health-list">
              <div className="admin-dashboard-health-row">
                <span>内容发布率</span>
                <strong>{publishRate}%</strong>
              </div>
              <Progress percent={publishRate} showInfo={false} strokeColor="#155eef" railColor="rgba(21,94,239,.12)" />

              <div className="admin-dashboard-health-row">
                <span>站长参与率</span>
                <strong>{adminParticipationRate}%</strong>
              </div>
              <Progress percent={adminParticipationRate} showInfo={false} strokeColor="#0891b2" railColor="rgba(8,145,178,.14)" />
            </div>

            <div className="admin-dashboard-insight-grid">
              <div className="admin-dashboard-insight-card">
                <span>Node 环境</span>
                <strong>{nodeVersion}</strong>
                <Text type="secondary">当前运行时版本</Text>
              </div>
              <div className="admin-dashboard-insight-card">
                <span>本周更新</span>
                <strong>{postsThisWeek}</strong>
                <Text type="secondary">最近 7 天发文数</Text>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="admin-dashboard-kpi-grid">
        {kpiItems.map((item) => (
          <Card key={item.label} className={`admin-panel-card admin-dashboard-kpi-card tone-${item.tone}`}>
            <span className="admin-dashboard-kpi-icon">{item.icon}</span>
            <span className="admin-dashboard-kpi-label">{item.label}</span>
            <strong className="admin-dashboard-kpi-value">{item.value}</strong>
            <Text type="secondary">{item.hint}</Text>
          </Card>
        ))}
      </section>

      <section className="admin-dashboard-main-grid">
        <div className="admin-dashboard-main-stack">
          <Card className="admin-panel-card admin-dashboard-section-card">
            <div className="admin-dashboard-section-heading">
              <span>待处理事项</span>
              <Text type="secondary">把最值得马上处理的事情集中在一块，不占太多空间。</Text>
            </div>
            <div className="admin-dashboard-focus-grid">
              {focusItems.length > 0 ? (
                focusItems.map((item) => (
                  <Link key={item.href} href={item.href} className="admin-dashboard-focus-item">
                    <div className="admin-dashboard-focus-copy">
                      <Text type="secondary">{item.title}</Text>
                      <strong className="admin-dashboard-focus-value">{item.value}</strong>
                      <Text type="secondary">{item.description}</Text>
                    </div>
                    <Button size="small" type="primary">
                      {item.actionLabel}
                    </Button>
                  </Link>
                ))
              ) : (
                <div className="admin-dashboard-empty-block">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前没有特别紧急的待处理项" />
                </div>
              )}
            </div>
          </Card>

          <Card className="admin-panel-card admin-dashboard-section-card">
            <div className="admin-dashboard-section-heading">
              <span>最近文章</span>
              <Text type="secondary">尽量压缩成可扫读的卡片，不再用松散大列表。</Text>
            </div>
            <div className="admin-dashboard-feed-grid">
              {posts.slice(0, 5).length > 0 ? (
                posts.slice(0, 5).map((post) => (
                  <div key={post.relativePath} className="admin-dashboard-list-item">
                    <div className="admin-dashboard-list-top">
                      <Tag color={post.draft ? "default" : "blue"}>
                        {post.draft ? "草稿" : "已发布"}
                      </Tag>
                      <Text type="secondary">{formatDateTime(post.updatedAt || post.date)}</Text>
                    </div>
                    <Title level={5} className="admin-dashboard-list-title">
                      <Link href={`/admin/posts/edit?path=${encodeURIComponent(post.relativePath)}`}>
                        {post.title}
                      </Link>
                    </Title>
                    <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 10 }}>
                      {post.summary || "这篇文章还没有摘要，建议补一段更利于扫读。"}
                    </Paragraph>
                    <div className="admin-dashboard-list-meta">
                      <span>{post.wordCount || 0} 字</span>
                      <span>{formatRelativeTime(post.updatedAt || post.date)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-dashboard-empty-block">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有文章内容" />
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="admin-dashboard-main-stack">
          <Card className="admin-panel-card admin-dashboard-list-card">
            <div className="admin-dashboard-section-heading">
              <span>最近评论</span>
              <Text type="secondary">用更紧凑的块展示互动，不让信息被大留白稀释。</Text>
            </div>
            <div className="admin-dashboard-feed-grid">
              {allComments.slice(0, 6).length > 0 ? (
                allComments.slice(0, 6).map((comment) => {
                  const badge = getCommentStatus(comment.status);

                  return (
                    <div key={comment.id} className="admin-dashboard-comment-item">
                      <div className="admin-dashboard-comment-shell">
                        <Avatar src={comment.avatar || undefined}>
                          {(comment.authorName || "U").slice(0, 1).toUpperCase()}
                        </Avatar>
                        <div className="admin-dashboard-comment-body">
                          <div className="admin-dashboard-comment-head">
                            <Space wrap size={[8, 8]}>
                              <Text strong>{comment.authorName}</Text>
                              <Tag color={badge.color}>{badge.label}</Tag>
                              {comment.isAdmin && <Tag color="blue">站长</Tag>}
                            </Space>
                            <Text type="secondary">{formatRelativeTime(comment.createdAt)}</Text>
                          </div>
                          <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                            {comment.content}
                          </Paragraph>
                          <Text type="secondary" className="admin-dashboard-comment-meta">
                            {comment.location || "位置未知"}
                          </Text>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="admin-dashboard-empty-block">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有评论互动" />
                </div>
              )}
            </div>
          </Card>

          <Card className="admin-panel-card admin-dashboard-list-card">
            <div className="admin-dashboard-section-heading">
              <span>系统与站点</span>
              <Text type="secondary">保留必要的运行信息，不额外塞无效装饰。</Text>
            </div>
            <div className="admin-dashboard-system-grid">
              <div className="admin-dashboard-system-item">
                <span>最新评论</span>
                <strong>{latestComment ? formatDateTime(latestComment.createdAt) : "暂无"}</strong>
                <Text type="secondary">{latestComment?.authorName || "等待首条互动"}</Text>
              </div>
              <div className="admin-dashboard-system-item">
                <span>最近发文</span>
                <strong>{latestPost ? formatDateTime(latestPostTime) : "暂无"}</strong>
                <Text type="secondary">{latestPost?.title || "等待第一篇文章"}</Text>
              </div>
              <div className="admin-dashboard-system-item">
                <span>建议入口</span>
                <strong>后台建议管理</strong>
                <Button size="small" href="/admin/suggestions">
                  前往查看
                </Button>
              </div>
              <div className="admin-dashboard-system-item">
                <span>阅读入口</span>
                <strong>前台首页</strong>
                <Button size="small" href="/" target="_blank" icon={<ReadOutlined />}>
                  打开前台
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="admin-dashboard-bottom-grid">
        <Card className="admin-panel-card admin-dashboard-section-card">
          <div className="admin-dashboard-section-heading">
            <span>近 6 个月内容走势</span>
            <Text type="secondary">用短柱形图和列表一起看趋势，信息更密一点。</Text>
          </div>
          <div className="admin-dashboard-trend-layout">
            <div className="admin-dashboard-bars">
              {monthlyPostData.map((item) => (
                <div key={item.label} className="admin-dashboard-bar-col">
                  <span className="admin-dashboard-bar-count">{item.count}</span>
                  <div className="admin-dashboard-bar-track">
                    <div
                      className="admin-dashboard-bar-fill"
                      style={{ height: `${Math.max(14, (item.count / maxMonthlyCount) * 100)}%` }}
                    />
                  </div>
                  <span className="admin-dashboard-bar-label">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="admin-dashboard-month-list">
              {monthlyPostData.map((item) => (
                <div key={item.label} className="admin-dashboard-month-item">
                  <span>{item.label}</span>
                  <strong>{item.count} 篇</strong>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="admin-panel-card admin-dashboard-section-card">
          <div className="admin-dashboard-section-heading">
            <span>最近活动</span>
            <Text type="secondary">把写作和评论活动揉成一列，避免页面继续拉长。</Text>
          </div>
          <div className="admin-dashboard-feed-grid">
            {recentActivities.map((item) => (
              <div key={item.id} className="admin-dashboard-list-item">
                <Text type="secondary">{item.meta}</Text>
                <Title level={5} className="admin-dashboard-list-title">
                  {item.title}
                </Title>
                <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                  {item.description}
                </Paragraph>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </Space>
  );
}
