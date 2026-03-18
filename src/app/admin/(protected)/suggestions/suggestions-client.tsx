"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DeleteOutlined,
  MessageOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";

import { deleteSuggestionAction, replySuggestionAction } from "./actions";
import type { Suggestion } from "@/server/db/schema";

const { Paragraph, Text } = Typography;

function getAvatar(qq: string) {
  return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100`;
}

export default function SuggestionsClient({
  initialData,
}: {
  initialData: Suggestion[];
}) {
  const router = useRouter();
  const { message } = App.useApp();
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return data;

    return data.filter((item) =>
      [item.qq, item.content, item.adminReply]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [data, query]);

  const repliedCount = data.filter((item) => item.status === "replied").length;

  return (
    <Space orientation="vertical" size={16} style={{ display: "flex" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="admin-panel-card">
            <Statistic title="建议总数" value={data.length} prefix={<MessageOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="admin-panel-card">
            <Statistic title="已回复" value={repliedCount} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="admin-panel-card">
            <Statistic title="待处理" value={data.length - repliedCount} />
          </Card>
        </Col>
      </Row>

      <Card className="admin-panel-card">
        <Space orientation="vertical" size={16} style={{ display: "flex" }}>
          <Row gutter={[12, 12]} justify="space-between" align="middle">
            <Col flex="auto">
              <Input
                allowClear
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                prefix={<SearchOutlined />}
                placeholder="搜索 QQ、建议内容或站长回复"
              />
            </Col>
            <Col>
              <Button icon={<ReloadOutlined />} onClick={() => router.refresh()} loading={pending}>
                刷新
              </Button>
            </Col>
          </Row>

          {/* 卡片列表 */}
          <div className="admin-comment-list">
            {filtered.length === 0 ? (
              <div className="admin-comment-empty">
                <MessageOutlined style={{ fontSize: 32, opacity: 0.2 }} />
                <Text type="secondary">暂无访客建议</Text>
              </div>
            ) : (
              filtered.map((item) => (
                <div key={item.id} className="admin-comment-card">
                  {/* 头部：用户信息 + 状态 */}
                  <div className="admin-comment-card-header">
                    <div className="admin-comment-card-header-left">
                      <Avatar src={getAvatar(item.qq)}>{item.qq.slice(0, 1)}</Avatar>
                      <div className="admin-comment-card-user">
                        <Text strong className="admin-comment-card-name">{item.qq}</Text>
                        <Text type="secondary" className="admin-comment-card-email">{item.qq}@qq.com</Text>
                      </div>
                    </div>
                    <div className="admin-comment-card-header-right">
                      <Tag color={item.status === "replied" ? "green" : "gold"}>
                        {item.status === "replied" ? "已回复" : "待处理"}
                      </Tag>
                      <Text type="secondary" className="admin-comment-card-time">
                        {new Date(item.updatedAt || item.createdAt).toLocaleString("zh-CN")}
                      </Text>
                    </div>
                  </div>

                  {/* 正文 */}
                  <div className="admin-comment-card-body">
                    <Paragraph className="admin-comment-card-content">{item.content}</Paragraph>
                  </div>

                  {/* 博主回复 */}
                  {item.adminReply && (
                    <div className="admin-comment-card-replies" style={{ paddingLeft: 44 }}>
                      <div className="admin-thread-reply admin-thread-reply-admin">
                        <div className="admin-thread-reply-body">
                          <div className="admin-thread-reply-main">
                            <Text strong className="admin-thread-reply-title">博主回复：</Text>
                            <Text className="admin-thread-reply-text">{item.adminReply}</Text>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 悬浮操作按钮 */}
                  <div className="admin-comment-card-footer">
                    <div className="admin-comment-card-actions">
                      <Button
                        type="text"
                        size="small"
                        icon={<MessageOutlined />}
                        className="admin-comment-action-btn admin-comment-action-reply"
                        onClick={() => {
                          setSelectedSuggestion(item);
                          setReplyContent(item.adminReply || "");
                          setReplyDialogOpen(true);
                        }}
                      >
                        回复
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        className="admin-comment-action-btn"
                        onClick={() => setDeletingId(item.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Space>
      </Card>

      <Modal
        title="回复访客建议"
        open={replyDialogOpen}
        onCancel={() => setReplyDialogOpen(false)}
        onOk={() => {
          if (!selectedSuggestion || !replyContent.trim()) return;

          startTransition(async () => {
            const result = await replySuggestionAction(
              selectedSuggestion.id,
              replyContent.trim(),
            );
            if (!result.ok) {
              message.error(result.error);
              return;
            }

            setData((current) =>
              current.map((item) =>
                item.id === selectedSuggestion.id ? result.item || item : item,
              ),
            );
            message.success("建议回复已发送");
            setReplyDialogOpen(false);
          });
        }}
        okText="发送回复"
        cancelText="取消"
        confirmLoading={pending}
      >
        <Space orientation="vertical" size={12} style={{ display: "flex" }}>
          <Card size="small" className="admin-surface-muted">
            <Text strong>访客原始内容</Text>
            <Paragraph style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
              {selectedSuggestion?.content}
            </Paragraph>
          </Card>
          <Input.TextArea
            rows={5}
            value={replyContent}
            onChange={(event) => setReplyContent(event.target.value)}
            placeholder="请输入回复内容"
          />
        </Space>
      </Modal>

      <Modal
        title="确认删除建议"
        open={Boolean(deletingId)}
        onCancel={() => setDeletingId(null)}
        onOk={() => {
          if (!deletingId) return;

          startTransition(async () => {
            const result = await deleteSuggestionAction(deletingId);
            if (!result.ok) {
              message.error(result.error);
              return;
            }

            setData((current) =>
              current.filter((item) => !result.deletedIds?.includes(item.id)),
            );
            message.success("建议已删除");
            setDeletingId(null);
          });
        }}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        confirmLoading={pending}
      >
        <Text type="secondary">删除后不可恢复，确认继续吗？</Text>
      </Modal>
    </Space>
  );
}
