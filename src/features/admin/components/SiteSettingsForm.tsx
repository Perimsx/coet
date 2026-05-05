"use client";
import { useEffect, useMemo, useState, useTransition, useRef } from "react";
import { 
  RotateCcw, 
  Save, 
  Download, 
  Upload, 
  Settings, 
  Share2, 
  Search, 
  ShieldCheck, 
  Palette, 
  UserCircle, 
  Mail, 
  Lock 
} from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        icon: Settings,
        description: "维护站点名称、描述与欢迎文案。",
        content: <BaseInfoForm draft={draft} onChange={setField} />,
      },
      {
        key: "socials",
        label: "社交联系",
        icon: Share2,
        description: "维护前台可见的社交与联系地址。",
        content: <SocialsForm draft={draft} onChange={setField} />,
      },
      {
        key: "seo",
        label: "SEO 优化",
        icon: Search,
        description: "配置主域名、分享图和搜索引擎验证信息。",
        content: <SEOForm draft={draft} onChange={setField} />,
      },
      {
        key: "compliance",
        label: "备案合规",
        icon: ShieldCheck,
        description: "配置页脚展示的备案信息。",
        content: <ComplianceForm draft={draft} onChange={setField} />,
      },
      {
        key: "presentation",
        label: "前台展示",
        icon: Palette,
        description: "集中维护首页主视觉、模块开关与页脚展示文案。",
        content: <PresentationForm draft={draft} onChange={setField} />,
      },
      {
        key: "friend",
        label: "博客名片",
        icon: UserCircle,
        description: "博主个人友链信息配置。",
        content: <FriendCardForm draft={draft} onChange={setField} />,
      },
      {
        key: "mail",
        label: "邮件通知",
        icon: Mail,
        description: "配置 SMTP 邮件发送服务。",
        content: <MailForm />,
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

  const handleExport = () => {
    const dataStr = JSON.stringify(draft, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `site-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("配置已导出到本地");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // 这里可以增加简单的 Schema 校验
        setDraft((prev) => ({ ...prev, ...json }));
        toast.success("配置已加载，预览后请点击保存");
      } catch {
        toast.error("无效的 JSON 配置文件");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <AdminPanel>
        <AdminPanelHeader
          title="站点基础设置"
          description="站点身份、展示配置、通知能力与数据管理。"
          className="border-b pb-4"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge 
                variant="secondary" 
                className={isChanged ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}
              >
                {isChanged ? "有未保存变更" : "已同步"}
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExport}
                title="导出当前配置为 JSON"
              >
                <Download className="mr-2 size-4" />
                导出
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                title="从本地 JSON 导入配置"
              >
                <Upload className="mr-2 size-4" />
                导入
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImport} 
                  accept=".json" 
                  className="hidden" 
                />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
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
          }
        />
        <AdminPanelBody className="p-0">
          <Tabs defaultValue="base" className="flex flex-col md:flex-row min-h-[600px]">
            <TabsList className="flex flex-col h-auto w-full md:w-64 items-stretch justify-start rounded-none border-b md:border-b-0 md:border-r bg-muted/30 p-2 gap-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:ring-1 data-[state=active]:ring-border"
                >
                  <tab.icon className="size-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 p-6 lg:p-12">
              {tabs.map((tab) => (
                <TabsContent
                  key={tab.key}
                  value={tab.key}
                  className="mt-0 space-y-10 animate-in fade-in-50 duration-300"
                >
                  <div className="space-y-1.5 border-b pb-6">
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                      {tab.label}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tab.description}
                    </div>
                  </div>
                  <div className="max-w-4xl">
                    {tab.content}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader 
          title="账户安全" 
          description="管理你的管理后台访问凭证。"
        />
        <AdminPanelBody className="pt-4">
          <AdminPasswordForm username={username} />
        </AdminPanelBody>
      </AdminPanel>
    </div>
  );
}
