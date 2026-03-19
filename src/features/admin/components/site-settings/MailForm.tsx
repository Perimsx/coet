"use client"

import { useEffect, useState, useTransition } from "react"
import { Mail, RefreshCw, Send } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/features/admin/components/admin-ui"
import {
  getMailSettingsAction,
  saveMailSettingsAction,
  sendTestMailAction,
} from "@/app/admin/actions"

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

const providers = [
  { label: "QQ", value: "qq" },
  { label: "163", value: "163" },
  { label: "Gmail", value: "gmail" },
  { label: "Outlook", value: "outlook" },
  { label: "自定义", value: "custom" },
]

export function MailForm() {
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
    toast.success("邮件配置已重新加载")
  }

  const handleSave = () => {
    startSave(async () => {
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
        toast.error(result.error)
        return
      }

      setPassword("")
      await reloadConfig()
      toast.success(result.success || "邮件配置已保存")
    })
  }

  const handleTest = () => {
    const target = testTo.trim() || config.notifyTo
    if (!target) {
      toast.error("请输入测试收件邮箱。")
      return
    }

    startTest(async () => {
      const result = await sendTestMailAction(target)
      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(result.success || "测试邮件已发送")
    })
  }

  if (!loaded) {
    return (
      <AdminPanel>
        <AdminPanelBody className="p-6 text-sm text-muted-foreground">正在加载邮件配置...</AdminPanelBody>
      </AdminPanel>
    )
  }

  return (
    <div className="space-y-4">
      <AdminPanel>
        <AdminPanelHeader
          title="邮件通知"
          description="管理评论回复、建议回复与系统通知使用的 SMTP 配置。"
        />
        <AdminPanelBody className="space-y-5">
          <div className="flex flex-col gap-4 rounded-[24px] border border-border/70 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">通知服务开关</div>
              <div className="text-xs leading-6 text-muted-foreground">
                开启后才会发送评论与建议相关邮件。
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="rounded-full bg-background">
                {config.enabled ? "已启用" : "未启用"}
              </Badge>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setField("enabled", checked)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">服务商预设</div>
            <div className="flex flex-wrap gap-2">
              {providers.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  variant={config.provider === item.value ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => handleProviderChange(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">SMTP 主机</label>
              <Input
                value={config.host}
                onChange={(event) => setField("host", event.target.value)}
                placeholder="smtp.你的邮箱服务商.com"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">端口</label>
              <Input
                type="number"
                value={String(config.port)}
                onChange={(event) => setField("port", Number(event.target.value) || 465)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-foreground">SSL</label>
                <Switch
                  checked={config.secure}
                  onCheckedChange={(checked) => setField("secure", checked)}
                />
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                关闭时将按 STARTTLS / 明文端口配置发送。
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">发件邮箱账号</label>
              <Input
                value={config.user}
                onChange={(event) => setField("user", event.target.value)}
                placeholder="你的邮箱@服务商.com"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">SMTP 授权码</label>
                {config.hasPassword && !password ? (
                  <Badge variant="outline" className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    已配置
                  </Badge>
                ) : null}
              </div>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={config.hasPassword ? "留空则保留现有密码" : "请输入 SMTP 授权码"}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">发件人显示</label>
              <Input
                value={config.from}
                onChange={(event) => setField("from", event.target.value)}
                placeholder="博客名 <your-email@example.com>"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">通知收件邮箱</label>
              <Input
                value={config.notifyTo}
                onChange={(event) => setField("notifyTo", event.target.value)}
                placeholder="接收评论和通知的邮箱"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">站点地址</label>
              <Input
                value={config.siteUrl}
                onChange={(event) => setField("siteUrl", event.target.value)}
                placeholder="https://你的站点.com"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">站长 QQ</label>
              <Input
                value={config.ownerQq}
                onChange={(event) => setField("ownerQq", event.target.value)}
                placeholder="用于默认头像"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">站长昵称</label>
              <Input
                value={config.ownerNickname}
                onChange={(event) => setField("ownerNickname", event.target.value)}
                placeholder="用于邮件显示名称"
                className="h-10 rounded-xl"
              />
            </div>
          </div>
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader
          title="测试发送"
          description="支持使用自定义目标地址或默认通知地址验证当前 SMTP 配置。"
        />
        <AdminPanelBody className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">测试收件邮箱</label>
            <Input
              value={testTo}
              onChange={(event) => setTestTo(event.target.value)}
              placeholder={config.notifyTo || "请输入测试邮箱"}
              className="h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-muted-foreground">
              {config.updatedAt
                ? `上次更新：${new Date(config.updatedAt).toLocaleString("zh-CN")}`
                : "尚未保存过邮件配置"}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="rounded-xl" disabled={saving} onClick={() => void reloadConfig()}>
                <RefreshCw className="size-4" />
                重载配置
              </Button>
              <Button type="button" variant="outline" className="rounded-xl" disabled={testing || !config.enabled} onClick={handleTest}>
                <Send className="size-4" />
                发送测试邮件
              </Button>
              <Button type="button" className="rounded-xl" disabled={saving} onClick={handleSave}>
                <Mail className="size-4" />
                保存邮件配置
              </Button>
            </div>
          </div>
        </AdminPanelBody>
      </AdminPanel>
    </div>
  )
}
