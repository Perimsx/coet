"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { App, Button, Card, Space, Tabs, Tag, Typography } from "antd"

import { saveSiteSettingsAction, type SaveSiteSettingsState } from "@/app/admin/actions"
import type { SiteSettings } from "@/server/site-settings"
import { BaseInfoForm } from "./site-settings/BaseInfoForm"
import { SocialsForm } from "./site-settings/SocialsForm"
import { SEOForm } from "./site-settings/SEOForm"
import { ComplianceForm } from "./site-settings/ComplianceForm"
import { MailForm } from "./site-settings/MailForm"
import { AdminPasswordForm } from "./site-settings/AdminPasswordForm"

const { Text, Title } = Typography

export default function SiteSettingsForm({
  settings,
  username,
}: {
  settings: SiteSettings
  username: string
}) {
  const { message } = App.useApp()
  const [baseline, setBaseline] = useState<SiteSettings>(settings)
  const [draft, setDraft] = useState<SiteSettings>(settings)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setBaseline(settings)
    setDraft(settings)
  }, [settings])

  const setField = (key: keyof SiteSettings, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const isChanged = JSON.stringify(draft) !== JSON.stringify(baseline)

  const tabItems = useMemo(
    () => [
      { key: "base", label: "基础信息", children: <BaseInfoForm draft={draft} onChange={setField} /> },
      { key: "socials", label: "社交联系", children: <SocialsForm draft={draft} onChange={setField} /> },
      { key: "seo", label: "SEO", children: <SEOForm draft={draft} onChange={setField} /> },
      { key: "compliance", label: "备案合规", children: <ComplianceForm draft={draft} onChange={setField} /> },
      { key: "mail", label: "邮件通知", children: <MailForm /> },
    ],
    [draft]
  )

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData()
      for (const [key, value] of Object.entries(draft)) {
        formData.set(key, value || "")
      }

      const result = await saveSiteSettingsAction({} as SaveSiteSettingsState, formData)
      if (result.error) {
        message.error(result.error)
        return
      }

      setBaseline(draft)
      message.success(result.success || "站点设置已保存")
    })
  }

  return (
    <Space orientation="vertical" size={20} style={{ display: "flex" }}>
      <Card className="admin-panel-card">
        <Space orientation="vertical" size={16} style={{ display: "flex" }}>
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              站点设置
            </Title>
            <Text type="secondary">统一维护站点身份、社交信息、搜索引擎配置、备案信息和邮件通知能力。</Text>
          </div>

          <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
            <Space wrap>
              <Text>当前状态</Text>
              {isChanged ? <Tag color="gold">有未保存变更</Tag> : <Tag color="green">已同步</Tag>}
            </Space>
            <Space wrap>
              <Button onClick={() => setDraft(baseline)} disabled={pending || !isChanged}>
                重置
              </Button>
              <Button type="primary" onClick={handleSave} loading={pending} disabled={!isChanged}>
                保存设置
              </Button>
            </Space>
          </Space>
        </Space>
      </Card>

      <Card className="admin-panel-card">
        <Tabs items={tabItems} />
      </Card>

      <AdminPasswordForm username={username} />
    </Space>
  )
}
