import { Col, Input, Row, Space, Typography } from "antd"
import type { SiteSettings } from "@/server/site-settings"

const { Text, Title } = Typography
const { TextArea } = Input

interface BaseInfoFormProps {
  draft: SiteSettings
  onChange: (key: keyof SiteSettings, value: string) => void
}

export function BaseInfoForm({ draft, onChange }: BaseInfoFormProps) {
  return (
    <Space orientation="vertical" size={20} style={{ display: "flex" }}>
      <div>
        <Title level={5} style={{ marginBottom: 4 }}>
          站点基础信息
        </Title>
        <Text type="secondary">定义后台与前台共用的标题、简介和欢迎文案。</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Text strong>站点标题</Text>
          <Input
            value={draft.title || ""}
            onChange={(event) => onChange("title", event.target.value)}
            placeholder="例如：Coet - 极简博客"
            style={{ marginTop: 8 }}
          />
        </Col>
        <Col xs={24} md={12}>
          <Text strong>导航标题</Text>
          <Input
            value={draft.headerTitle || ""}
            onChange={(event) => onChange("headerTitle", event.target.value)}
            placeholder="例如：Coet"
            style={{ marginTop: 8 }}
          />
        </Col>
        <Col span={24}>
          <Text strong>站点描述</Text>
          <TextArea
            rows={4}
            value={draft.description || ""}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder="用于 SEO 和站点简介"
            style={{ marginTop: 8 }}
          />
        </Col>
        <Col span={24}>
          <Text strong>欢迎文案</Text>
          <TextArea
            rows={3}
            value={draft.welcomeMessage || ""}
            onChange={(event) => onChange("welcomeMessage", event.target.value)}
            placeholder="前台首页顶部的欢迎提示"
            style={{ marginTop: 8 }}
          />
        </Col>
      </Row>
    </Space>
  )
}
