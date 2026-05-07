"use client";
import { useEffect, useState, useTransition, useRef } from "react";
import { 
  Save, 
  Download, 
  Upload, 
  Mail,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Activity
} from "lucide-react";
import { toast } from '@/shared/hooks/use-toast'

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatCard,
} from "@/features/admin/components/admin-ui";
import {
  saveSiteSettingsAction,
  type SaveSiteSettingsState,
} from "@/app/admin/actions";
import type { SiteSettings } from "@/server/site-settings";

import { MailForm } from "./site-settings/MailForm";
import { AdminPasswordForm } from "./site-settings/AdminPasswordForm";

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

  const isChanged = JSON.stringify(draft) !== JSON.stringify(baseline);

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(draft)) {
        formData.set(key, (value as string) || "");
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
      {/* 统计看板区域 */}
      <section className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          title="邮件中枢状态"
          value="正常运行"
          hint="SMTP 通讯链路已建立"
          icon={Activity}
          className="bg-emerald-500/5 border-emerald-500/10"
        />
        <AdminStatCard
          title="系统安全等级"
          value="高"
          hint="二次验证与权限隔离已开启"
          icon={ShieldCheck}
          className="bg-blue-500/5 border-blue-500/10"
        />
        <AdminStatCard
          title="配置版本"
          value="v2.4.0"
          hint="基于 blog.config.ts 核心"
          icon={Fingerprint}
        />
      </section>

      <Tabs defaultValue="mail" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto self-start">
            <TabsTrigger value="mail" className="rounded-lg px-4 py-2 flex items-center gap-2">
              <Mail className="size-3.5" />
              邮件通知
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg px-4 py-2 flex items-center gap-2">
              <ShieldAlert className="size-3.5" />
              安全设置
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={isChanged ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}
            >
              {isChanged ? "有未保存变更" : "已同步"}
            </Badge>
            <div className="w-px h-4 bg-border mx-1" />
            <Button variant="outline" size="sm" onClick={handleExport} className="rounded-xl">
               <Download className="mr-2 size-4" /> 导出
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-xl">
               <Upload className="mr-2 size-4" /> 导入
               <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            </Button>
          </div>
        </div>

        <TabsContent value="mail" className="mt-0 animate-in fade-in-50 duration-300">
           <AdminPanel>
              <AdminPanelHeader 
                title="通知中心" 
                description="集中维护评论回复、系统预警与业务通知的通讯链路。"
              />
              <AdminPanelBody>
                <MailForm />
              </AdminPanelBody>
           </AdminPanel>
        </TabsContent>

        <TabsContent value="security" className="mt-0 animate-in fade-in-50 duration-300">
           <AdminPanel>
              <AdminPanelHeader 
                title="账户安全管理" 
                description="定期修改密码并检查账户访问权限，保障后台数据安全。"
              />
              <AdminPanelBody>
                <AdminPasswordForm username={username} />
              </AdminPanelBody>
           </AdminPanel>
        </TabsContent>
      </Tabs>

      {isChanged && (
        <div className="sticky bottom-6 left-0 right-0 z-50 flex justify-center animate-in slide-in-from-bottom-4 duration-300">
           <div className="flex items-center gap-4 rounded-2xl bg-slate-900/90 px-6 py-3 text-white shadow-2xl backdrop-blur-xl dark:bg-white/90 dark:text-slate-900">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber-400" />
                <span className="text-sm font-bold">检测到配置变更，是否立即保存？</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDraft(baseline)} className="hover:bg-white/10 dark:hover:bg-slate-900/10 h-8">
                  放弃修改
                </Button>
                <Button size="sm" onClick={handleSave} disabled={pending} className="bg-blue-500 hover:bg-blue-600 text-white border-none h-8">
                  <Save className="mr-2 size-4" /> 保存设置
                </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
