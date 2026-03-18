"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  SaveOutlined,
} from "@ant-design/icons"
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd"

import { deletePostEditorAction, renderMarkdownPreviewAction, savePostEditorAction } from "@/app/admin/actions"
import HtmlMarkdownContent from "@/features/content/components/HtmlMarkdownContent"

const { Paragraph, Text } = Typography
const { TextArea } = Input

type EditorValue = {
  relativePath: string
  title: string
  slug: string
  date: string
  summary: string
  tags: string
  categories: string
  draft: boolean
  content: string
}

type CategoryOption = {
  slug: string
  labelZh: string
}

export default function PostEditorPage({
  initialValue,
  availableCategories = [],
}: {
  initialValue: EditorValue
  availableCategories?: CategoryOption[]
}) {
  const router = useRouter()
  const { message } = App.useApp()
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState(initialValue)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const categoryValues = useMemo(
    () =>
      value.categories
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    [value.categories]
  )

  const tagValues = useMemo(
    () =>
      value.tags
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    [value.tags]
  )

  const setField = <K extends keyof EditorValue>(key: K, nextValue: EditorValue[K]) => {
    setValue((current) => ({ ...current, [key]: nextValue }))
  }

  const handleTabChange = async (tab: "edit" | "preview") => {
    setActiveTab(tab)
    if (tab === "preview") {
      setPreviewLoading(true)
      try {
        const result = await renderMarkdownPreviewAction(value.content || "")
        setPreviewHtml(result.html)
      } catch {
        message.error("预览生成失败")
      } finally {
        setPreviewLoading(false)
      }
    }
  }

  const buildFormData = () => {
    const formData = new FormData()
    formData.set("relativePath", value.relativePath)
    formData.set("title", value.title)
    formData.set("slug", value.slug)
    formData.set("date", value.date)
    formData.set("summary", value.summary)
    formData.set("tags", value.tags)
    formData.set("categories", value.categories)
    formData.set("content", value.content)
    if (value.draft) formData.set("draft", "true")
    return formData
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await savePostEditorAction(buildFormData())
      if (result.error) {
        message.error(result.error)
        return
      }

      if (result.editor) {
        setValue({
          relativePath: result.editor.relativePath,
          title: result.editor.title,
          slug: result.editor.slug,
          date: result.editor.date.slice(0, 10),
          summary: result.editor.summary,
          tags: result.editor.tags.join(", "),
          categories: result.editor.categories.join(", "),
          draft: result.editor.draft,
          content: result.editor.content,
        })

        if (!value.relativePath) {
          router.replace(`/admin/posts/edit?path=${encodeURIComponent(result.editor.relativePath)}`)
        }
      }

      message.success(result.success || "文章已保存")
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!value.relativePath) {
      router.push("/admin/posts")
      return
    }

    startTransition(async () => {
      const result = await deletePostEditorAction(value.relativePath)
      if (result.error) {
        message.error(result.error)
        return
      }

      message.success(result.success || "文章已删除")
      router.push("/admin/posts")
      router.refresh()
    })
  }

  return (
    <Space orientation="vertical" size={16} style={{ display: "flex" }}>
      <Row justify="space-between" align="middle" gutter={[12, 12]} wrap>
        <Col>
          <Space wrap size={8}>
            <Button size="small" icon={<ArrowLeftOutlined />}>
              <Link href="/admin/posts">返回</Link>
            </Button>
            <Tag color={value.draft ? "gold" : "green"}>{value.draft ? "草稿" : "已发布"}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>{value.relativePath || "新文章"}</Text>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setDeleteOpen(true)} disabled={pending}>
              删除
            </Button>
            <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={pending}>
              保存文章
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} xl={16}>
          <Card className="admin-panel-card">
          <Space orientation="vertical" size={16} style={{ display: "flex" }}>
              <Row justify="space-between" align="middle" gutter={[12, 12]}>
                <Col>
                  <Space wrap>
                    <Tag icon={<FileTextOutlined />}>正文</Tag>
                    <Segmented
                      value={activeTab}
                      onChange={(tab) => handleTabChange(tab as "edit" | "preview")}
                      options={[
                        { label: "编辑", value: "edit" },
                        { label: "预览", value: "preview" },
                      ]}
                    />
                  </Space>
                </Col>
                <Col>
                  <Button icon={<EyeOutlined />}>
                    <Link href={`/blog/${value.slug}`} target="_blank">
                      前台预览
                    </Link>
                  </Button>
                </Col>
              </Row>

              <Form layout="vertical">
                <Form.Item label="文章标题" required>
                  <Input
                    value={value.title}
                    onChange={(event) => setField("title", event.target.value)}
                    placeholder="请输入文章标题"
                    size="large"
                  />
                </Form.Item>
              </Form>

              {activeTab === "edit" ? (
                <TextArea
                  rows={24}
                  value={value.content}
                  onChange={(event) => setField("content", event.target.value)}
                  placeholder="开始编写 Markdown 正文"
                  style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                />
              ) : previewLoading ? (
                <Text type="secondary">正在生成预览...</Text>
              ) : (
                <div className="prose prose-zinc max-w-none dark:prose-invert">
                  <HtmlMarkdownContent html={previewHtml} />
                </div>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card className="admin-panel-card" title="文章属性">
            <Form layout="vertical">
              <Form.Item label="Slug">
                <Input
                  value={value.slug}
                  onChange={(event) => setField("slug", event.target.value)}
                  placeholder="article-slug"
                />
              </Form.Item>

              <Form.Item label="发布日期">
                <Input
                  type="date"
                  value={value.date}
                  onChange={(event) => setField("date", event.target.value)}
                />
              </Form.Item>

              <Form.Item label="分类">
                <Select
                  mode="tags"
                  value={categoryValues}
                  onChange={(values) => setField("categories", values.join(", "))}
                  options={availableCategories.map((item) => ({ label: item.labelZh, value: item.slug }))}
                  placeholder="选择或输入分类"
                />
              </Form.Item>

              <Form.Item label="标签">
                <Select
                  mode="tags"
                  value={tagValues}
                  onChange={(values) => setField("tags", values.join(", "))}
                  placeholder="输入标签"
                />
              </Form.Item>

              <Form.Item label="摘要">
                <TextArea
                  rows={4}
                  value={value.summary}
                  onChange={(event) => setField("summary", event.target.value)}
                  placeholder="为文章写一段摘要"
                />
              </Form.Item>

              <Form.Item label="保存为草稿">
                <Switch checked={value.draft} onChange={(checked) => setField("draft", checked)} />
              </Form.Item>

              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                当前共有 {tagValues.length} 个标签、{categoryValues.length} 个分类。
              </Paragraph>
            </Form>
          </Card>
        </Col>
      </Row>

      <Modal
        title="确认删除文章"
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onOk={handleDelete}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        confirmLoading={pending}
      >
        <Text type="secondary">删除后不可恢复，确定要继续吗？</Text>
      </Modal>
    </Space>
  )
}
