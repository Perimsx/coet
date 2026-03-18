"use client"

import { useEffect, useState, useTransition } from "react"
import { App, Button, Card, Col, Input, InputNumber, Row, Segmented, Skeleton, Space, Switch, Tag, Typography } from "antd"

import { getMailSettingsAction, saveMailSettingsAction, sendTestMailAction } from "@/app/admin/actions"

const { Text, Title } = Typography

type MailConfig = {
  enabled: boolean
  provider: string
  host: string
  port: number
  secure: boolean
  user: string
  from: string
  notifyTo: string
  siteUrl: string
  ownerQq: string
  ownerNickname: string
  hasPassword: boolean
  updatedAt?: string
}

const PROVIDER_PRESETS: Record<string, { host: string; port: number; secure: boolean }> = {
  qq: { host: "smtp.qq.com", port: 465, secure: true },
  "163": { host: "smtp.163.com", port: 465, secure: true },
  gmail: { host: "smtp.gmail.com", port: 587, secure: false },
  outlook: { host: "smtp.office365.com", port: 587, secure: false },
  custom: { host: "", port: 465, secure: true },
}

const EMPTY_CONFIG: MailConfig = {
  enabled: false,
  provider: "qq",
  host: "smtp.qq.com",
  port: 465,
  secure: true,
  user: "",
  from: "",
  notifyTo: "",
  siteUrl: "",
  ownerQq: "",
  ownerNickname: "",
  hasPassword: false,
}

export function MailForm() {
  const { message } = App.useApp()
  const [config, setConfig] = useState<MailConfig>(EMPTY_CONFIG)
  const [password, setPassword] = useState("")
  const [testTo, setTestTo] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [saving, startSave] = useTransition()
  const [testing, startTest] = useTransition()

  useEffect(() => {
    getMailSettingsAction()
      .then((data) => {
        setConfig(data as MailConfig)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const setField = <K extends keyof MailConfig>(key: K, value: MailConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  const handleProviderChange = (provider: string) => {
    const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.custom
    setConfig((current) => ({
      ...current,
      provider,
      host: preset.host,
      port: preset.port,
      secure: preset.secure,
    }))
  }

  const reloadConfig = async () => {
    const data = await getMailSettingsAction()
    setConfig(data as MailConfig)
    setPassword("")
  }

  const handleSave = () => {
    startSave(async () => {
      try {
        const result = await saveMailSettingsAction({
          enabled: config.enabled,
          provider: config.provider,
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.user,
          pass: password || undefined,
          from: config.from,
          notifyTo: config.notifyTo,
          siteUrl: config.siteUrl,
          ownerQq: config.ownerQq,
          ownerNickname: config.ownerNickname,
        })

        if (result.error) {
          message.error(result.error)
          return
        }

        message.success(result.success || "邮件配置已保存")
        setPassword("")
        await reloadConfig()
      } catch {
        message.error("保存邮件配置失败")
      }
    })
  }

  const handleTest = () => {
    const target = testTo.trim() || config.notifyTo
    if (!target) {
      message.error("请输入测试收件邮箱")
      return
    }

    startTest(async () => {
      try {
        const result = await sendTestMailAction(target)
        if (result.error) {
          message.error(result.error)
          return
        }
        message.success(result.success || "测试邮件已发送")
      } catch {
        message.error("发送测试邮件失败")
      }
    })
  }

  if (!loaded) {
    return (
      <Card className="admin-panel-card">
        <Skeleton active />
      </Card>
    )
  }

  return (
    <Space orientation="vertical" size={20} style={{ display: "flex" }}>
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col>
          <div>
            <Title level={5} style={{ marginBottom: 4 }}>
              邮件通知
            </Title>
            <Text type="secondary">配置评论回复、建议回复和系统通知的 SMTP 服务。</Text>
          </div>
        </Col>
        <Col>
          <Space>
            <Text>{config.enabled ? "已启用" : "未启用"}</Text>
            <Switch checked={config.enabled} onChange={(checked) => setField("enabled", checked)} />
          </Space>
        </Col>
      </Row>

      <Card className="admin-panel-card">
        <Space orientation="vertical" size={20} style={{ display: "flex" }}>
          <div>
            <Text strong>邮件服务商</Text>
            <div style={{ marginTop: 8 }}>
              <Segmented
                value={config.provider}
                onChange={(value) => handleProviderChange(String(value))}
                options={[
                  { label: "QQ", value: "qq" },
                  { label: "163", value: "163" },
                  { label: "Gmail", value: "gmail" },
                  { label: "Outlook", value: "outlook" },
                  { label: "自定义", value: "custom" },
                ]}
              />
            </div>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Text strong>SMTP 主机</Text>
              <Input
                value={config.host}
                onChange={(event) => setField("host", event.target.value)}
                placeholder="smtp.example.com"
                style={{ marginTop: 8 }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Text strong>端口</Text>
              <InputNumber
                value={config.port}
                onChange={(value) => setField("port", Number(value) || 465)}
                style={{ marginTop: 8, width: "100%" }}
                min={1}
              />
            </Col>
            <Col xs={24} md={12}>
              <Text strong>发件邮箱账号</Text>
              <Input
                value={config.user}
                onChange={(event) => setField("user", event.target.value)}
                placeholder="your-email@example.com"
                style={{ marginTop: 8 }}
              />
            </Col>
            <Col xs={24} md={12}>
              <Space align="center" size={8}>
                <Text strong>SMTP 授权码</Text>
                {config.hasPassword && !password && <Tag color="green">已配置</Tag>}
              </Space>
              <Input.Password
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={config.hasPassword ? "留空则保持不变" : "请输入 SMTP 授权码"}
                style={{ marginTop: 8 }}
              />
            </Col>
            <Col xs={24} md={12}>
              <Text strong>发件人显示</Text>
              <Input
                value={config.from}
                onChange={(event) => setField("from", event.target.value)}
                placeholder="博客名 <your-email@example.com>"
                style={{ marginTop: 8 }}
              />
            </Col>
            <Col xs={24} md={12}>
              <Text strong>通知收件邮箱</Text>
              <Input
                value={config.notifyTo}
                onChange={(event) => setField("notifyTo", event.target.value)}
                placeholder="接收评论和通知的邮箱"
                style={{ marginTop: 8 }}
              />
            </Col>
            <Col xs={24} md={12}>
              <Text strong>站点地址</Text>
              <Input
                value={config.siteUrl}
                onChange={(event) => setField("siteUrl", event.target.value)}
                placeholder="https://example.com"
                style={{ marginTop: 8 }}
              />
            </Col>
            <Col xs={24} md={12}>
              <Space align="center" size={8}>
                <Text strong>SSL</Text>
                <Switch checked={config.secure} onChange={(checked) => setField("secure", checked)} />
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Text strong>站长 QQ</Text>
              <Input
                value={config.ownerQq}
                onChange={(event) => setField("ownerQq", event.target.value)}
                placeholder="用于默认头像"
                style={{ marginTop: 8 }}
              />
            </Col>
            <Col xs={24} md={12}>
              <Text strong>站长昵称</Text>
              <Input
                value={config.ownerNickname}
                onChange={(event) => setField("ownerNickname", event.target.value)}
                placeholder="用于邮件显示名称"
                style={{ marginTop: 8 }}
              />
            </Col>
          </Row>
        </Space>
      </Card>

      <Card className="admin-panel-card">
              <Space orientation="vertical" size={16} style={{ display: "flex" }}>
          <div>
            <Text strong>发送测试邮件</Text>
            <div style={{ marginTop: 8 }}>
              <Input
                value={testTo}
                onChange={(event) => setTestTo(event.target.value)}
                placeholder={config.notifyTo || "请输入测试邮箱"}
              />
            </div>
          </div>

          <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
            <Space wrap>
              <Button onClick={reloadConfig} disabled={saving}>
                重载配置
              </Button>
              <Button onClick={handleTest} loading={testing} disabled={!config.enabled}>
                发送测试邮件
              </Button>
            </Space>
            <Button type="primary" onClick={handleSave} loading={saving}>
              保存邮件配置
            </Button>
          </Space>

          {config.updatedAt && <Text type="secondary">上次更新：{new Date(config.updatedAt).toLocaleString("zh-CN")}</Text>}
        </Space>
      </Card>
    </Space>
  )
}
