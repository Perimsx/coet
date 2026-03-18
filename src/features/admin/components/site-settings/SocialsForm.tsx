import { Col, Input, Row, Space, Typography } from "antd"
import type { SiteSettings } from "@/server/site-settings"

const { Text, Title } = Typography

interface SocialsFormProps {
  draft: SiteSettings
  onChange: (key: keyof SiteSettings, value: string) => void
}

/**
 * 社交联系表单 (SocialsForm)
 * 配置展示在前台页脚的社交平台链接。建议修复错误。
 */
export function SocialsForm({ draft, onChange }: SocialsFormProps) {
  return (
    <Space orientation="vertical" size={20} style={{ display: "flex" }}>
      <div>
        <Title level={5} style={{ marginBottom: 4 }}>
          社交与联系
        </Title>
        <Text type="secondary">公开展示在前台页脚和关于页的联系渠道。</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Text strong>邮箱</Text>
          <Input
            value={draft.email || ""}
            onChange={(event) => onChange("email", event.target.value)}
            placeholder="name@example.com"
            style={{ marginTop: 8 }}
          />
        </Col>
        <Col xs={24} md={12}>
          <Text strong>GitHub</Text>
          <Input
            value={draft.github || ""}
            onChange={(event) => onChange("github", event.target.value)}
            placeholder="https://github.com/..."
            style={{ marginTop: 8 }}
          />
        </Col>
        <Col xs={24} md={12}>
          <Text strong>X / Twitter</Text>
          <Input
            value={draft.x || ""}
            onChange={(event) => onChange("x", event.target.value)}
            placeholder="https://x.com/..."
            style={{ marginTop: 8 }}
          />
        </Col>
        <Col xs={24} md={12}>
          <Text strong>语雀</Text>
          <Input
            value={draft.yuque || ""}
            onChange={(event) => onChange("yuque", event.target.value)}
            placeholder="https://www.yuque.com/..."
            style={{ marginTop: 8 }}
          />
        </Col>
      </Row>
    </Space>
  )
}
