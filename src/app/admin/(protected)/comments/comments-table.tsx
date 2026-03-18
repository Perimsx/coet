"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CommentOutlined,
  DeleteOutlined,
  DesktopOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  approveCommentAction,
  batchDeleteCommentsAction,
  batchUpdateCommentStatusAction,
  deleteCommentAction,
  rejectCommentAction,
  replyCommentAction,
} from "@/app/admin/actions";
import type {
  AdminCommentNode,
  AdminCommentThread,
} from "@/features/admin/lib/comment-threads";
import type { AdminMutationResult } from "@/features/admin/lib/mutations";
import {
  formatClientLocation,
  hasKnownClientValue,
} from "@/features/comments/lib/comment-client-display";
import { toProxiedImageSrc } from "@/shared/utils/image-proxy";

const { TextArea } = Input;
const { Paragraph, Text, Title } = Typography;

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function formatCommentTime(date: string) {
  return new Date(date).toLocaleString("zh-CN");
}

function stripVersion(value: string | null) {
  if (!value) return "";

  return value
    .replace(/\s+\(.*?\)\s*$/, "")
    .replace(/\s+(?:NT\s+)?\d[\d._]*\s*$/i, "")
    .trim();
}

function getVisitorSecondary(comment: AdminCommentNode) {
  if (comment.qq) return `${comment.qq}@qq.com`;
  if (comment.ipAddress) return comment.ipAddress;
  return "匿名访客";
}

function getThreadStatus(thread: AdminCommentThread) {
  if (thread.root.status === "pending") return { color: "gold", label: "待审核" };
  if (thread.root.status === "rejected") return { color: "red", label: "已拦截" };
  if (thread.adminReplyCount > 0) return { color: "green", label: "已回复" };
  return { color: "blue", label: "已通过" };
}

function applyThreadMutation(
  current: AdminCommentThread[],
  result?: AdminMutationResult<AdminCommentThread>,
) {
  if (!result?.ok) return current;

  let next = current;

  if (result.deletedIds?.length) {
    const deleted = new Set(result.deletedIds);
    next = next.filter((thread) => !deleted.has(thread.id));
  }

  const upserts = [...(result.items ?? []), ...(result.item ? [result.item] : [])];
  if (!upserts.length) return next;

  const map = new Map(next.map((thread) => [thread.id, thread]));
  for (const thread of upserts) {
    map.set(thread.id, thread);
  }

  return [...map.values()].sort((left, right) => {
    return (
      new Date(right.lastActivityAt).getTime() -
      new Date(left.lastActivityAt).getTime()
    );
  });
}

// ─── 回复气泡组件 ───
function ThreadReplyBlock({ reply }: { reply: AdminCommentNode }) {
  if (reply.role === "admin") {
    return (
      <div className="admin-thread-reply admin-thread-reply-admin">
        <div className="admin-thread-reply-body">
          <div className="admin-thread-reply-main">
            <Text strong className="admin-thread-reply-title">博主回复：</Text>
            <Text className="admin-thread-reply-text">{reply.content}</Text>
          </div>
          <Text type="secondary" className="admin-thread-reply-meta">
            {formatCommentTime(reply.createdAt)}
          </Text>
        </div>
      </div>
    );
  }

  const prefix = `访客回复 · ${reply.authorName || "访客"}`;

  return (
    <div className={`admin-thread-reply admin-thread-reply-visitor`}>
      <Avatar
        size={28}
        src={toProxiedImageSrc(reply.avatarSrc) || undefined}
        className="admin-thread-reply-avatar"
      >
        {(reply.authorName || "U").slice(0, 1).toUpperCase()}
      </Avatar>
      <div className="admin-thread-reply-body">
        <Text className="admin-thread-reply-title">{prefix}</Text>
        <Text className="admin-thread-reply-text">{reply.content}</Text>
        <Text type="secondary" className="admin-thread-reply-meta">
          {formatCommentTime(reply.createdAt)}
        </Text>
      </div>
    </div>
  );
}

// ─── 单条评论卡片组件 ───
function ThreadCard({
  thread,
  checked,
  pending,
  onToggleSelect,
  onApprove,
  onReject,
  onReply,
  onDelete,
}: {
  thread: AdminCommentThread;
  checked: boolean;
  pending: boolean;
  onToggleSelect: (checked: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  onReply: () => void;
  onDelete: () => void;
}) {
  const root = thread.root;
  const badge = getThreadStatus(thread);

  return (
    <div className="admin-comment-card">
      {/* 头部：选择框 + 用户信息 + 状态标签 */}
      <div className="admin-comment-card-header">
        <div className="admin-comment-card-header-left">
          <Checkbox
            checked={checked}
            onChange={(e) => onToggleSelect(e.target.checked)}
            className="admin-comment-card-check"
          />
          <Avatar
            src={toProxiedImageSrc(root.avatarSrc) || undefined}
            size={44}
            className="admin-comment-card-avatar"
          >
            {(root.authorName || "U").slice(0, 1).toUpperCase()}
          </Avatar>
          <div className="admin-comment-card-user">
            <Text strong className="admin-comment-card-name">{root.authorName}</Text>
            <Text type="secondary" className="admin-comment-card-email">
              {getVisitorSecondary(root)}
            </Text>
          </div>
        </div>
        <div className="admin-comment-card-header-right">
          <Tag color={badge.color}>{badge.label}</Tag>
          <Text type="secondary" className="admin-comment-card-time">
            {formatCommentTime(root.createdAt)}
          </Text>
        </div>
      </div>

      {/* 评论正文 */}
      <div className="admin-comment-card-body">
        <Paragraph className="admin-comment-card-content">{root.content}</Paragraph>
      </div>

      {/* 元信息标签行 */}
      {(root.location || root.ipAddress || root.browser || root.os) && (
        <div className="admin-comment-card-meta">
          <Tag icon={<GlobalOutlined />}>
            <Link href={`/blog/${root.postId}`} target="_blank">
              {root.postId}
            </Link>
          </Tag>
          <Tag icon={<EnvironmentOutlined />}>
            {formatClientLocation(root.location) || "位置未知"} / {root.ipAddress || "未知 IP"}
          </Tag>
          {hasKnownClientValue(root.os) && (
            <Tag icon={<DesktopOutlined />}>{stripVersion(root.os)}</Tag>
          )}
          {hasKnownClientValue(root.browser) && (
            <Tag icon={<GlobalOutlined />}>{stripVersion(root.browser)}</Tag>
          )}
        </div>
      )}

      {/* 回复列表 */}
      {thread.replies.length > 0 && (
        <div className="admin-comment-card-replies">
          {thread.replies.map((reply) => (
            <ThreadReplyBlock key={reply.id} reply={reply} />
          ))}
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="admin-comment-card-footer">
        <div className="admin-comment-card-stats">
          <Text type="secondary">
            访客回复 {thread.visitorReplyCount} · 站长回复 {thread.adminReplyCount}
          </Text>
        </div>
        <div className="admin-comment-card-actions">
          <Tooltip title="通过">
            <Button
              type="text"
              size="small"
              icon={<CheckCircleOutlined />}
              disabled={pending || root.status === "approved"}
              onClick={onApprove}
              className="admin-comment-action-btn admin-comment-action-approve"
            >
              通过
            </Button>
          </Tooltip>
          <Tooltip title="拦截">
            <Button
              type="text"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              disabled={pending || root.status === "rejected"}
              onClick={onReject}
              className="admin-comment-action-btn"
            >
              拦截
            </Button>
          </Tooltip>
          <Tooltip title="站长回复">
            <Button
              type="text"
              size="small"
              icon={<CommentOutlined />}
              disabled={pending}
              onClick={onReply}
              className="admin-comment-action-btn admin-comment-action-reply"
            >
              回复
            </Button>
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={pending}
              onClick={onDelete}
              className="admin-comment-action-btn"
            >
              删除
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

// ─── 主组件 ───
export default function CommentsTable({
  initialThreads,
}: {
  initialThreads: AdminCommentThread[];
}) {
  const router = useRouter();
  const { message } = App.useApp();
  const [threads, setThreads] = useState(initialThreads);
  const [pending, startTransition] = useTransition();
  const [replying, setReplying] = useState<AdminCommentThread | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [deleting, setDeleting] = useState<AdminCommentThread | null>(null);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedThreadIds, setSelectedThreadIds] = useState<number[]>([]);

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  const filteredThreads = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return threads.filter((thread) => {
      if (statusFilter !== "all" && thread.root.status !== statusFilter) {
        return false;
      }

      if (!keyword) return true;

      const haystack = [
        thread.root.authorName,
        thread.root.content,
        thread.root.postId,
        thread.root.ipAddress,
        ...thread.replies.map((reply) => `${reply.authorName} ${reply.content}`),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [query, statusFilter, threads]);

  const stats = useMemo(
    () => ({
      total: threads.length,
      pending: threads.filter((thread) => thread.root.status === "pending").length,
      approved: threads.filter((thread) => thread.root.status === "approved").length,
      rejected: threads.filter((thread) => thread.root.status === "rejected").length,
    }),
    [threads],
  );

  const handleMutation = (
    action: () => Promise<AdminMutationResult<AdminCommentThread>>,
    successMessage: string,
    after?: () => void,
  ) => {
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          message.error(result.error);
          return;
        }

        setThreads((current) => applyThreadMutation(current, result));
        after?.();
        message.success(result.message || successMessage);
      } catch (error) {
        console.error(error);
        message.error("操作失败，请稍后重试");
      }
    });
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleBatchStatus = (status: "approved" | "rejected") => {
    handleMutation(
      () => batchUpdateCommentStatusAction(selectedThreadIds, status),
      status === "approved" ? "已批量通过" : "已批量拦截",
      () => setSelectedThreadIds([]),
    );
  };

  // 全选/取消全选
  const allFilteredIds = filteredThreads.map((t) => t.id);
  const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedThreadIds.includes(id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedThreadIds((prev) => [...new Set([...prev, ...allFilteredIds])]);
    } else {
      setSelectedThreadIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    }
  };

  return (
    <Space orientation="vertical" size={16} style={{ display: "flex" }}>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} xl={6}>
          <Card className="admin-panel-card">
            <Statistic title="评论线程" value={stats.total} prefix={<CommentOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={12} xl={6}>
          <Card className="admin-panel-card">
            <Statistic title="待审核" value={stats.pending} prefix={<SearchOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={12} xl={6}>
          <Card className="admin-panel-card">
            <Statistic title="已通过" value={stats.approved} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={12} xl={6}>
          <Card className="admin-panel-card">
            <Statistic title="已拦截" value={stats.rejected} prefix={<CloseCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* 搜索与筛选工具栏 */}
      <Card className="admin-panel-card">
        <Space orientation="vertical" size={16} style={{ display: "flex" }}>
          <div className="admin-comment-toolbar">
            <div className="admin-comment-toolbar-left">
              <Input
                allowClear
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                prefix={<SearchOutlined />}
                placeholder="搜索评论、访客、文章 ID..."
                className="admin-comment-search"
              />
              <Select<StatusFilter>
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 130 }}
                options={[
                  { label: "全部状态", value: "all" },
                  { label: "待审核", value: "pending" },
                  { label: "已通过", value: "approved" },
                  { label: "已拦截", value: "rejected" },
                ]}
              />
            </div>
            <div className="admin-comment-toolbar-right">
              <Checkbox
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                disabled={filteredThreads.length === 0}
              >
                全选
              </Checkbox>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={pending}>
                刷新
              </Button>
            </div>
          </div>

          {/* 批量操作栏 */}
          {selectedThreadIds.length > 0 && (
            <div className="admin-comment-batch-bar">
              <Text strong>已选中 {selectedThreadIds.length} 条线程</Text>
              <div className="admin-comment-batch-actions">
                <Button
                  size="small"
                  icon={<CheckCircleOutlined />}
                  loading={pending}
                  onClick={() => handleBatchStatus("approved")}
                >
                  批量通过
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={pending}
                  onClick={() => handleBatchStatus("rejected")}
                >
                  批量拦截
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setBatchDeleting(true)}
                >
                  批量删除
                </Button>
              </div>
            </div>
          )}

          {/* 评论卡片列表 */}
          <div className="admin-comment-list">
            {filteredThreads.length === 0 ? (
              <div className="admin-comment-empty">
                <CommentOutlined style={{ fontSize: 32, opacity: 0.2 }} />
                <Text type="secondary">暂无评论线程</Text>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  checked={selectedThreadIds.includes(thread.id)}
                  pending={pending}
                  onToggleSelect={(checked) => {
                    setSelectedThreadIds((current) =>
                      checked
                        ? [...current, thread.id]
                        : current.filter((id) => id !== thread.id),
                    );
                  }}
                  onApprove={() =>
                    handleMutation(
                      () => approveCommentAction(thread.root.id),
                      "评论已通过",
                    )
                  }
                  onReject={() =>
                    handleMutation(
                      () => rejectCommentAction(thread.root.id),
                      "评论已拦截",
                    )
                  }
                  onReply={() => {
                    setReplying(thread);
                    setReplyContent("");
                  }}
                  onDelete={() => setDeleting(thread)}
                />
              ))
            )}
          </div>
        </Space>
      </Card>

      {/* 回复弹窗 */}
      <Modal
        title="站长回复"
        open={Boolean(replying)}
        onCancel={() => {
          setReplying(null);
          setReplyContent("");
        }}
        onOk={() => {
          if (!replying || !replyContent.trim()) return;
          handleMutation(
            () => replyCommentAction(replying.root.id, replyContent.trim()),
            "站长回复已发送",
            () => {
              setReplying(null);
              setReplyContent("");
            },
          );
        }}
        okText="发送回复"
        cancelText="取消"
        confirmLoading={pending}
      >
        <Space orientation="vertical" size={12} style={{ display: "flex" }}>
          <Card size="small" className="admin-surface-muted">
            <Text strong>原评论</Text>
            <Paragraph style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
              {replying?.root.content}
            </Paragraph>
          </Card>
          <TextArea
            rows={5}
            value={replyContent}
            onChange={(event) => setReplyContent(event.target.value)}
            placeholder="请输入站长回复内容"
          />
        </Space>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除评论线程"
        open={Boolean(deleting)}
        onCancel={() => setDeleting(null)}
        onOk={() => {
          if (!deleting) return;
          handleMutation(
            () => deleteCommentAction(deleting.root.id),
            "评论线程已删除",
            () => setDeleting(null),
          );
        }}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        confirmLoading={pending}
      >
        <Text type="secondary">删除后该线程下的所有回复都会一起删除，且不可恢复。</Text>
      </Modal>

      {/* 批量删除弹窗 */}
      <Modal
        title="确认批量删除"
        open={batchDeleting}
        onCancel={() => setBatchDeleting(false)}
        onOk={() => {
          handleMutation(
            () => batchDeleteCommentsAction(selectedThreadIds),
            "评论线程已批量删除",
            () => {
              setSelectedThreadIds([]);
              setBatchDeleting(false);
            },
          );
        }}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        confirmLoading={pending}
      >
        <Text type="secondary">
          将删除当前选中的 {selectedThreadIds.length} 条评论线程以及它们的所有回复。
        </Text>
      </Modal>
    </Space>
  );
}
