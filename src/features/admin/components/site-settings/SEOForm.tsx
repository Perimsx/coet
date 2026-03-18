import { Col, Input, Row, Space, Typography } from "antd"
import type { SiteSettings } from "@/server/site-settings"

const { Text, Title } = Typography
const { TextArea } = Input

interface SEOFormProps {
  draft: SiteSettings
  onChange: (key: keyof SiteSettings, value: string) => void
}

export function SEOForm({ draft, onChange }: SEOFormProps) {
  return (
    <Space orientation="vertical" size={20} style={{ display: "flex" }}>
      <div>
        <Title level={5} style={{ marginBottom: 4 }}>
          SEO 与搜索设置
        </Title>
        <Text type="secondary">管理主域名、默认分享图、全局关键词和 GSC 验证码。</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Text strong>站点主域名</Text>
          <Input
            value={draft.siteUrl || ""}
            onChange={(event) => onChange("siteUrl", event.target.value)}
            placeholder="https://example.com"
            style={{ marginTop: 8 }}
          />
        </Col>
        <Col xs={24} md={12}>
          <Text strong>默认分享图</Text>
          <Input
            value={draft.socialBanner || ""}
            onChange={(event) => onChange("socialBanner", event.target.value)}
            placeholder="/static/images/twitter-card.png"
            style={{ marginTop: 8 }}
          />
        </Col>
        <Col span={24}>
          <Text strong>Google Search Console 验证码</Text>
          <Input
            value={draft.googleSearchConsole || ""}
            onChange={(event) => onChange("googleSearchConsole", event.target.value)}
            placeholder="填写 meta 标签的 content 部分"
            style={{ marginTop: 8 }}
          />
        </Col>
        <Col span={24}>
          <Text strong>全局关键词</Text>
          <TextArea
            rows={4}
            value={draft.seoKeywords || ""}
            onChange={(event) => onChange("seoKeywords", event.target.value)}
            placeholder="多个关键词用逗号分隔"
            style={{ marginTop: 8 }}
          />
        </Col>
      </Row>
    </Space>
  )
}
