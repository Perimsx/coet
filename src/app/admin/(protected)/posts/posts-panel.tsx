"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  Input,
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
  deletePostEditorAction,
  getPostEditorAction,
  savePostEditorAction,
} from "@/app/admin/actions";

const { Paragraph, Text, Title } = Typography;

type PostItem = {
  title: string;
  slug: string;
  relativePath: string;
  absolutePath: string;
  updatedAt: string;
  date: string;
  summary: string;
  tags: string[];
  categories: string[];
  draft: boolean;
  wordCount: number;
};

type SortBy = "date-desc" | "date-asc" | "words-desc" | "title-asc";
type StatusFilter = "all" | "published" | "draft";

type CategoryOption = {
  slug: string;
  labelZh: string;
};

export default function PostsPanel({
  posts,
  categoryOptions = [],
}: {
  posts: PostItem[];
  categoryOptions?: CategoryOption[];
}) {
  const router = useRouter();
  const { message } = App.useApp();
  const [items, setItems] = useState(posts);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [pending, startTransition] = useTransition();
  const [postToDelete, setPostToDelete] = useState<PostItem | null>(null);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const list = items.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.slug.toLowerCase().includes(keyword) ||
        item.tags.some((tag) => tag.toLowerCase().includes(keyword));

      const matchesCategory =
        categoryFilter === "all" || item.categories.includes(categoryFilter);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "draft" ? item.draft : !item.draft);

      return matchesKeyword && matchesCategory && matchesStatus;
    });

    const sorted = [...list];
    sorted.sort((left, right) => {
      if (sortBy === "date-asc")
        return new Date(left.date).getTime() - new Date(right.date).getTime();
      if (sortBy === "words-desc") return right.wordCount - left.wordCount;
      if (sortBy === "title-asc")
        return left.title.localeCompare(right.title, "zh-CN");
      return new Date(right.date).getTime() - new Date(left.date).getTime();
    });
    return sorted;
  }, [categoryFilter, items, query, sortBy, statusFilter]);

  const publishedCount = items.filter((item) => !item.draft).length;
  const draftCount = items.filter((item) => item.draft).length;
  const totalWords = items.reduce((sum, item) => sum + item.wordCount, 0);

  const toggleStatus = (post: PostItem) => {
    startTransition(async () => {
      try {
        const editor = await getPostEditorAction(post.relativePath);
        const formData = new FormData();
        formData.set("relativePath", editor.relativePath);
        formData.set("title", editor.title);
        formData.set("slug", editor.slug);
        formData.set("date", editor.date);
        formData.set("summary", editor.summary);
        formData.set("tags", editor.tags.join(", "));
        formData.set("categories", editor.categories.join(", "));
        formData.set("draft", String(!editor.draft));
        formData.set("content", editor.content);
        const result = await savePostEditorAction(formData);

        if (result.error) {
          message.error(result.error);
          return;
        }

        if (result.post) {
          setItems((current) =>
            current.map((item) =>
              item.relativePath === post.relativePath ? result.post! : item,
            ),
          );
        }

        message.success(post.draft ? "文章已发布" : "文章已切换为草稿");
      } catch {
        message.error("状态切换失败");
      }
    });
  };

  const handleDelete = () => {
    if (!postToDelete) return;

    startTransition(async () => {
      const result = await deletePostEditorAction(postToDelete.relativePath);
      if (result.error) {
        message.error(result.error);
        setPostToDelete(null);
        return;
      }

      setItems((current) =>
        current.filter(
          (item) => item.relativePath !== postToDelete.relativePath,
        ),
      );
      message.success("文章已删除");
      setPostToDelete(null);
    });
  };

  const columns: TableProps<PostItem>["columns"] = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      width: 520,
      render: (_value, record) => (
        <Space orientation="vertical" size={8} style={{ display: "flex" }}>
          <Space wrap>
            <Link
              href={`/admin/posts/edit?path=${encodeURIComponent(record.relativePath)}`}
            >
              {record.title}
            </Link>
            <Tag color={record.draft ? "gold" : "green"}>
              {record.draft ? "草稿" : "已发布"}
            </Tag>
          </Space>
          <Paragraph
            type="secondary"
            style={{ margin: 0 }}
            ellipsis={{ rows: 2 }}
          >
            {record.summary || "暂无摘要"}
          </Paragraph>
          <Space wrap size={[6, 6]}>
            {record.tags.slice(0, 4).map((tag) => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </Space>
        </Space>
      ),
    },
    {
      title: "分类",
      dataIndex: "categories",
      key: "categories",
      width: 220,
      render: (categories: string[]) =>
        categories.length > 0 ? (
          <Space wrap size={[6, 6]}>
            {categories.map((category) => {
              const label =
                categoryOptions.find(
                  (option) =>
                    option.slug.toLowerCase() === category.toLowerCase(),
                )?.labelZh || category;
              return <Tag key={category}>{label}</Tag>;
            })}
          </Space>
        ) : (
          <Text type="secondary">未分类</Text>
        ),
    },
    {
      title: "发布日期",
      dataIndex: "date",
      key: "date",
      width: 180,
      className: "admin-table-cell-nowrap",
      render: (date) => (
        <Text type="secondary">{new Date(date).toLocaleString("zh-CN")}</Text>
      ),
    },
    {
      title: "字数",
      dataIndex: "wordCount",
      key: "wordCount",
      width: 110,
      className: "admin-table-cell-nowrap",
      render: (value) => <Text>{Number(value).toLocaleString()}</Text>,
    },
    {
      title: "操作",
      key: "actions",
      width: 176,
      align: "center",
      className: "admin-table-actions-cell",
      render: (_value, record) => (
        <Space size={4} className="admin-table-actions">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label={`编辑《${record.title}》`}
              onClick={() =>
                router.push(
                  `/admin/posts/edit?path=${encodeURIComponent(record.relativePath)}`,
                )
              }
            />
          </Tooltip>
          <Tooltip title={record.draft ? "发布文章" : "转为草稿"}>
            <Button
              type="text"
              icon={<UploadOutlined />}
              aria-label={record.draft ? "发布文章" : "转为草稿"}
              loading={pending}
              onClick={() => toggleStatus(record)}
            />
          </Tooltip>
          <Tooltip title="预览">
            <Button
              type="text"
              icon={<EyeOutlined />}
              aria-label={`预览《${record.title}》`}
              onClick={() =>
                window.open(
                  `/blog/${record.slug}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label={`删除《${record.title}》`}
              loading={pending}
              onClick={() => setPostToDelete(record)}
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
            <Statistic
              title="文章总数"
              value={items.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="admin-panel-card">
            <Statistic
              title="已发布 / 草稿"
              value={`${publishedCount} / ${draftCount}`}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="admin-panel-card">
            <Statistic title="累计字数" value={totalWords} />
          </Card>
        </Col>
      </Row>

      <Card className="admin-panel-card">
        <Space orientation="vertical" size={16} style={{ display: "flex" }}>
          <Row gutter={[12, 12]} justify="space-between">
            <Col xs={24} lg={18}>
              <Space wrap>
                <Input
                  allowClear
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  prefix={<SearchOutlined />}
                  placeholder="搜索标题、Slug 或标签"
                  style={{ minWidth: 280 }}
                />
                <Select
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  style={{ width: 180 }}
                  options={[
                    { label: "全部分类", value: "all" },
                    ...categoryOptions.map((item) => ({
                      label: item.labelZh,
                      value: item.slug,
                    })),
                  ]}
                />
                <Select<StatusFilter>
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 160 }}
                  options={[
                    { label: "全部状态", value: "all" },
                    { label: "已发布", value: "published" },
                    { label: "草稿", value: "draft" },
                  ]}
                />
                <Select<SortBy>
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: 180 }}
                  options={[
                    { label: "最新发布", value: "date-desc" },
                    { label: "最早发布", value: "date-asc" },
                    { label: "字数最多", value: "words-desc" },
                    { label: "标题 A-Z", value: "title-asc" },
                  ]}
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => setItems(posts)}
                  loading={pending}
                >
                  重置视图
                </Button>
                <Button type="primary" icon={<PlusOutlined />}>
                  <Link href="/admin/posts/edit?new=1">写新文章</Link>
                </Button>
              </Space>
            </Col>
          </Row>

          <Table<PostItem>
            className="admin-data-table"
            rowKey="relativePath"
            dataSource={filteredItems}
            columns={columns}
            tableLayout="fixed"
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{ emptyText: "没有匹配的文章" }}
          />

          <Text type="secondary">当前显示 {filteredItems.length} 篇文章。</Text>
        </Space>
      </Card>

      <Modal
        title="确认删除文章"
        open={Boolean(postToDelete)}
        onCancel={() => setPostToDelete(null)}
        onOk={handleDelete}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        confirmLoading={pending}
      >
        <Text type="secondary">
          删除后不可恢复，确定要删除《{postToDelete?.title || "未命名文章"}
          》吗？
        </Text>
      </Modal>
    </Space>
  );
}
