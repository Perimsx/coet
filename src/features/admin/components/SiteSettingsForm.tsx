"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { RotateCcw, Save } from "lucide-react";
import { toast } from '@/shared/hooks/use-toast'

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
import { FriendCardForm } from "./site-settings/FriendCardForm";

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
      {
        key: "friend",
        label: "博客名片",
        description: "博主个人友链信息配置，此信息将专门用于本站友链名片展示。",
        content: <FriendCardForm draft={draft} onChange={setField} />,
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">站点设置</h1>
          <p className="text-muted-foreground text-sm mt-1">站点身份、展示配置、通知能力与安全配置工作台。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={isChanged ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}>
             {isChanged ? "有未保存变更" : "已同步"}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || !isChanged}
            onClick={() => setDraft(baseline)}
          >
            <RotateCcw className="mr-2 size-4" />
            重置
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || !isChanged}
            onClick={handleSave}
          >
            <Save className="mr-2 size-4" />
            保存设置
          </Button>
        </div>
      </div>

      <AdminPanel>
        <AdminPanelHeader
          title="站点基础设置"
          description="多分区编辑，保留原有字段与持久化逻辑，提升信息密度和可读性。"
          className="border-b pb-4"
        />
        <AdminPanelBody className="space-y-6 pt-4">
          <Tabs defaultValue="base" className="space-y-6">
            <TabsList className="bg-muted">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
              <TabsTrigger value="mail">
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
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                  {tab.content}
                </div>
              </TabsContent>
            ))}

            <TabsContent value="mail" className="mt-0 space-y-4">
              <div className="rounded-xl border bg-card p-1 shadow-sm">
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
