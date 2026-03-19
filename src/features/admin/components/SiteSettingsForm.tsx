"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Globe2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/features/admin/components/admin-ui";
import {
  saveSiteSettingsAction,
  type SaveSiteSettingsState,
} from "@/app/admin/actions";
import type { SiteSettings } from "@/server/site-settings";

import { BaseInfoForm } from "./site-settings/BaseInfoForm";
import { SocialsForm } from "./site-settings/SocialsForm";
import { SEOForm } from "./site-settings/SEOForm";
import { ComplianceForm } from "./site-settings/ComplianceForm";
import { MailForm } from "./site-settings/MailForm";
import { AdminPasswordForm } from "./site-settings/AdminPasswordForm";
import { PresentationForm } from "./site-settings/PresentationForm";

export default function SiteSettingsForm({
  settings,
  username,
}: {
  settings: SiteSettings;
  username: string;
}) {
  const [baseline, setBaseline] = useState<SiteSettings>(settings);
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setBaseline(settings);
    setDraft(settings);
  }, [settings]);

  const setField = (key: keyof SiteSettings, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const isChanged = JSON.stringify(draft) !== JSON.stringify(baseline);

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
      {
        key: "presentation",
        label: "前台展示",
        description: "集中维护首页主视觉、模块开关与页脚展示文案。",
        content: <PresentationForm draft={draft} onChange={setField} />,
      },
    ],
    [draft],
  );

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(draft)) {
        formData.set(key, value || "");
      }

      const result = await saveSiteSettingsAction(
        {} as SaveSiteSettingsState,
        formData,
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setBaseline(draft);
      toast.success(result.success || "站点设置已保存");
    });
  };

  return (
    <div className="space-y-6">
      <AdminPanel className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,247,255,0.95))] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.82),rgba(2,6,23,0.88))]">
        <AdminPanelBody className="relative flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_44%)] lg:block" />
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="rounded-full border-blue-500/20 bg-blue-500/8 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-blue-700 dark:text-sky-300"
            >
              站点配置中心
            </Badge>
            <div className="space-y-2">
              <h2 className="max-w-4xl font-[family-name:var(--font-admin-display)] text-[2rem] font-extrabold tracking-[-0.05em] text-foreground md:text-[2.35rem]">
                把站点身份、展示配置、通知能力
                <br className="hidden md:block" />
                和后台安全设置收进一张配置工作台。
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
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
                className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                disabled={pending || !isChanged}
                onClick={() => setDraft(baseline)}
              >
                <RotateCcw className="size-4" />
                重置
              </Button>
              <Button
                type="button"
                className="rounded-full bg-gradient-to-br from-blue-600 to-blue-500 px-5 text-white shadow-[0_18px_36px_rgba(37,99,235,0.22)] hover:from-blue-600 hover:to-blue-600"
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

      <AdminPanel className="overflow-hidden bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,0.86))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.62))]">
        <AdminPanelHeader
          title="站点基础设置"
          description="多分区编辑，保留原有字段与持久化逻辑，但提升信息密度和可读性。"
        />
        <AdminPanelBody className="space-y-6 pt-5">
          <Tabs defaultValue="base" className="space-y-6">
            <TabsList className="flex h-auto flex-wrap rounded-[22px] bg-slate-100/78 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/40 dark:ring-white/10">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="rounded-full"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
              <TabsTrigger value="mail" className="rounded-full">
                邮件通知
              </TabsTrigger>
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent
                key={tab.key}
                value={tab.key}
                className="mt-0 space-y-4"
              >
                <div className="space-y-1">
                  <div className="text-base font-semibold text-foreground">
                    {tab.label}
                  </div>
                  <div className="text-sm leading-6 text-muted-foreground">
                    {tab.description}
                  </div>
                </div>
                <div className="rounded-[30px] bg-slate-100/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/40 dark:ring-white/10">
                  {tab.content}
                </div>
              </TabsContent>
            ))}

            <TabsContent value="mail" className="mt-0 space-y-4">
              <div className="rounded-[30px] bg-slate-100/72 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/40 dark:ring-white/10">
                <MailForm />
              </div>
            </TabsContent>
          </Tabs>
        </AdminPanelBody>
      </AdminPanel>

      <AdminPasswordForm username={username} />
    </div>
  );
}
