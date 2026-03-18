import { Col, Input, Row, Space, Typography } from "antd"
import type { SiteSettings } from "@/server/site-settings"

const { Text, Title } = Typography

interface ComplianceFormProps {
  draft: SiteSettings
  onChange: (key: keyof SiteSettings, value: string) => void
}

export function ComplianceForm({ draft, onChange }: ComplianceFormProps) {
  return (
    <Space orientation="vertical" size={20} style={{ display: "flex" }}>
      <div>
        <Title level={5} style={{ marginBottom: 4 }}>
          备案与合规
        </Title>
        <Text type="secondary">显示在前台页脚的备案信息，可按需留空。</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Text strong>ICP 备案号</Text>
          <Input
            value={draft.icp || ""}
            onChange={(event) => onChange("icp", event.target.value)}
            placeholder="例如：浙 ICP 备 XXXXX 号"
            style={{ marginTop: 8 }}
          />
        </Col>
        <Col xs={24} md={12}>
          <Text strong>公安备案号</Text>
          <Input
            value={draft.policeBeian || ""}
            onChange={(event) => onChange("policeBeian", event.target.value)}
            placeholder="例如：浙公网安备 XXXXX 号"
            style={{ marginTop: 8 }}
          />
        </Col>
      </Row>
    </Space>
  )
}
