"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Globe2, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/features/admin/components/admin-ui"
import { saveSiteSettingsAction, type SaveSiteSettingsState } from "@/app/admin/actions"
import type { SiteSettings } from "@/server/site-settings"

import { BaseInfoForm } from "./site-settings/BaseInfoForm"
import { SocialsForm } from "./site-settings/SocialsForm"
import { SEOForm } from "./site-settings/SEOForm"
import { ComplianceForm } from "./site-settings/ComplianceForm"
import { MailForm } from "./site-settings/MailForm"
import { AdminPasswordForm } from "./site-settings/AdminPasswordForm"

export default function SiteSettingsForm({
  settings,
  username,
}: {
  settings: SiteSettings
  username: string
}) {
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

  const tabs = useMemo(
    () => [
      {
        key: "base",
        label: "基础信息",
        description: "维护站点名称、描述与欢迎文案。",
        content: <BaseInfoForm draft={draft} onChange={setField} />,
      },
      {
        key: "socials",
        label: "社交联系",
        description: "维护前台可见的社交与联系地址。",
        content: <SocialsForm draft={draft} onChange={setField} />,
      },
      {
        key: "seo",
        label: "SEO",
        description: "配置主域名、分享图和搜索引擎验证信息。",
        content: <SEOForm draft={draft} onChange={setField} />,
      },
      {
        key: "compliance",
        label: "备案合规",
        description: "配置页脚展示的备案信息。",
        content: <ComplianceForm draft={draft} onChange={setField} />,
      },
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
        toast.error(result.error)
        return
      }

      setBaseline(draft)
      toast.success(result.success || "站点设置已保存")
    })
  }

  return (
    <div className="space-y-5">
      <AdminPanel className="overflow-hidden rounded-[32px] border-border/70 bg-gradient-to-br from-card via-card to-primary/5">
        <AdminPanelBody className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
              站点配置中心
            </Badge>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">统一维护站点身份与通知能力</h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                这里集中管理前台展示信息、搜索配置、备案信息、邮件能力与管理员密码。
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={
                  isChanged
                    ? "rounded-full border-none bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : "rounded-full border-none bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                }
              >
                {isChanged ? "有未保存变更" : "已同步"}
              </Badge>
              <Badge variant="outline" className="rounded-full bg-background">
                <Globe2 className="mr-1 size-3.5" />
                {draft.siteUrl || "未配置主域名"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={pending || !isChanged}
                onClick={() => setDraft(baseline)}
              >
                <RotateCcw className="size-4" />
                重置
              </Button>
              <Button
                type="button"
                className="rounded-xl"
                disabled={pending || !isChanged}
                onClick={handleSave}
              >
                <Save className="size-4" />
                保存设置
              </Button>
            </div>
          </div>
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader
          title="站点基础设置"
          description="多分区编辑，保留原有字段与持久化逻辑，但提升信息密度和可读性。"
        />
        <AdminPanelBody>
          <Tabs defaultValue="base" className="space-y-5">
            <TabsList className="flex h-auto flex-wrap rounded-2xl bg-muted/35 p-1">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key} className="rounded-xl">
                  {tab.label}
                </TabsTrigger>
              ))}
              <TabsTrigger value="mail" className="rounded-xl">
                邮件通知
              </TabsTrigger>
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.key} value={tab.key} className="mt-0 space-y-4">
                <div className="space-y-1">
                  <div className="text-base font-semibold text-foreground">{tab.label}</div>
                  <div className="text-sm leading-6 text-muted-foreground">{tab.description}</div>
                </div>
                <div className="rounded-[28px] border border-border/70 bg-muted/10 p-5">
                  {tab.content}
                </div>
              </TabsContent>
            ))}

            <TabsContent value="mail" className="mt-0">
              <MailForm />
            </TabsContent>
          </Tabs>
        </AdminPanelBody>
      </AdminPanel>

      <AdminPasswordForm username={username} />
    </div>
  )
}
