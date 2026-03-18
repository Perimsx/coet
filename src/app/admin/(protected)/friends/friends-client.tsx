"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { TableProps } from "antd";

import {
  createFriendAction,
  deleteFriendAction,
  updateFriendAction,
} from "@/features/friends/lib/actions";
import type { Friend, NewFriend } from "@/server/db/schema";

const { Paragraph, Text, Title } = Typography;
const { useBreakpoint } = Grid;

type FriendRecord = Omit<Friend, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

function normalizeFriendRecord(value: any): FriendRecord {
  return {
    ...value,
    createdAt: new Date(value.createdAt).toISOString(),
    updatedAt: new Date(value.updatedAt).toISOString(),
  };
}

export default function FriendsClient({
  initialData,
}: {
  initialData: FriendRecord[];
}) {
  const router = useRouter();
  const screens = useBreakpoint();
  const { message } = App.useApp();
  const [form] = Form.useForm<Partial<NewFriend>>();
  const [friends, setFriends] = useState(initialData);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setFriends(initialData);
  }, [initialData]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return friends;

    return friends.filter((item) =>
      [item.name, item.url, item.description, item.qq]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [friends, query]);

  const publishedCount = friends.filter(
    (item) => item.status === "published",
  ).length;

  const openDialog = (friend?: FriendRecord) => {
    if (friend) {
      form.setFieldsValue({
        name: friend.name,
        url: friend.url,
        avatar: friend.avatar || "",
        description: friend.description || "",
        qq: friend.qq || "",
        status: friend.status,
        sortOrder: friend.sortOrder,
      });
      setEditingId(friend.id);
    } else {
      form.setFieldsValue({
        name: "",
        url: "",
        avatar: "",
        description: "",
        qq: "",
        status: "published",
        sortOrder: 0,
      });
      setEditingId(null);
    }
    setIsOpen(true);
  };

  const columns: TableProps<FriendRecord>["columns"] = [
    {
      title: "站点",
      dataIndex: "name",
      key: "name",
      width: 320,
      render: (_value, record) => (
        <Space align="start" size={12}>
          <Avatar src={record.avatar || undefined}>
            {record.name.slice(0, 1).toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Space wrap size={[8, 8]}>
              <Text strong>{record.name}</Text>
              <Tag color={record.status === "published" ? "green" : "default"}>
                {record.status === "published" ? "已发布" : "已隐藏"}
              </Tag>
            </Space>
            <Paragraph
              type="secondary"
              style={{ margin: "4px 0 0" }}
              ellipsis={{ rows: 2 }}
            >
              {record.description || "暂无描述"}
            </Paragraph>
          </div>
        </Space>
      ),
    },
    {
      title: "链接",
      dataIndex: "url",
      key: "url",
      width: 320,
      render: (url: string) => (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={url}
        >
          {url}
        </a>
      ),
    },
    {
      title: "QQ",
      dataIndex: "qq",
      key: "qq",
      width: 120,
      className: "admin-table-cell-nowrap",
      render: (qq: string | null) =>
        qq ? <Text>{qq}</Text> : <Text type="secondary">未填写</Text>,
    },
    {
      title: "排序",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 90,
      className: "admin-table-cell-nowrap",
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      className: "admin-table-cell-nowrap",
      render: (value: string) => (
        <Text type="secondary">{new Date(value).toLocaleString("zh-CN")}</Text>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 136,
      align: "center",
      className: "admin-table-actions-cell",
      render: (_value, record) => (
        <Space size={4} className="admin-table-actions">
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => openDialog(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => setDeletingId(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size={16} style={{ display: "flex" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="admin-panel-card">
            <Statistic title="友链总数" value={friends.length} prefix={<LinkOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="admin-panel-card">
            <Statistic title="已发布" value={publishedCount} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="admin-panel-card">
            <Statistic title="已隐藏" value={friends.length - publishedCount} />
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
                placeholder="搜索友链名称、链接、描述或 QQ"
              />
            </Col>
            <Col>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={() => router.refresh()} loading={pending}>
                  刷新
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openDialog()}>
                  新增友链
                </Button>
              </Space>
            </Col>
          </Row>

          {screens.md ? (
            <Table<FriendRecord>
              className="admin-data-table"
              rowKey="id"
              dataSource={filtered}
              columns={columns}
              tableLayout="fixed"
              scroll={{ x: "max-content" }}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              locale={{ emptyText: "暂无友链记录" }}
            />
          ) : (
            <div className="admin-thread-mobile-list">
              {filtered.map((item) => (
                <Card key={item.id} className="admin-panel-card admin-thread-mobile-card">
                  <Space orientation="vertical" size={12} style={{ display: "flex" }}>
                    <Space align="start" size={12}>
                      <Avatar src={item.avatar || undefined}>
                        {item.name.slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Space orientation="vertical" size={2}>
                        <Text strong>{item.name}</Text>
                        <Text type="secondary">{item.url}</Text>
                      </Space>
                    </Space>

                    <Paragraph style={{ margin: 0 }} type="secondary">
                      {item.description || "暂无描述"}
                    </Paragraph>

                    <Space wrap>
                      <Tag color={item.status === "published" ? "green" : "default"}>
                        {item.status === "published" ? "已发布" : "已隐藏"}
                      </Tag>
                      <Text type="secondary">排序 {item.sortOrder}</Text>
                      <Text type="secondary">
                        {new Date(item.updatedAt).toLocaleString("zh-CN")}
                      </Text>
                    </Space>

                    <Space wrap>
                      <Button size="small" icon={<EditOutlined />} onClick={() => openDialog(item)}>
                        编辑
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => setDeletingId(item.id)}
                      >
                        删除
                      </Button>
                    </Space>
                  </Space>
                </Card>
              ))}
            </div>
          )}
        </Space>
      </Card>

      <Modal
        title={editingId ? "编辑友链" : "新增友链"}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            startTransition(async () => {
              const result = editingId
                ? await updateFriendAction(editingId, values)
                : await createFriendAction(values as NewFriend);

              if (!result.ok) {
                message.error(result.error);
                return;
              }

              if (result.item) {
                const nextRecord = normalizeFriendRecord(result.item);
                setFriends((current) => {
                  const exists = current.some((item) => item.id === nextRecord.id);
                  const next = exists
                    ? current.map((item) =>
                        item.id === nextRecord.id ? nextRecord : item,
                      )
                    : [nextRecord, ...current];

                  return next.sort((left, right) => {
                    if (right.sortOrder !== left.sortOrder) {
                      return right.sortOrder - left.sortOrder;
                    }
                    return (
                      new Date(right.updatedAt).getTime() -
                      new Date(left.updatedAt).getTime()
                    );
                  });
                });
              }

              message.success(editingId ? "友链已更新" : "友链已新增");
              setIsOpen(false);
              form.resetFields();
            });
          } catch {
            // antd form handles field errors
          }
        }}
        okText="保存"
        cancelText="取消"
        confirmLoading={pending}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: "published", sortOrder: 0 }}
        >
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: "请输入友链名称" }]}
          >
            <Input placeholder="例如：某位朋友的博客" />
          </Form.Item>

          <Form.Item
            label="链接"
            name="url"
            rules={[
              { required: true, message: "请输入友链地址" },
              { type: "url", message: "请输入有效的 URL" },
            ]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item label="头像" name="avatar">
            <Input placeholder="站点头像地址，可选" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="一段简洁的站点介绍" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="QQ" name="qq">
                <Input placeholder="用于通过通知" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="状态" name="status">
                <Select
                  options={[
                    { label: "已发布", value: "published" },
                    { label: "已隐藏", value: "hidden" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="排序" name="sortOrder">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="确认删除友链"
        open={Boolean(deletingId)}
        onCancel={() => setDeletingId(null)}
        onOk={() => {
          if (!deletingId) return;
          startTransition(async () => {
            const result = await deleteFriendAction(deletingId);
            if (!result.ok) {
              message.error(result.error);
              return;
            }

            setFriends((current) =>
              current.filter((item) => !result.deletedIds?.includes(item.id)),
            );
            message.success("友链已删除");
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
