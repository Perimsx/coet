"use client";

import { useEffect, useState, useTransition } from "react";
import { KeyRound, Mail, Save, Send } from "lucide-react";
import { toast } from '@/shared/hooks/use-toast'
import { cn } from "@/components/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  getMailSettingsAction,
  saveMailSettingsAction,
  sendTestMailAction,
} from "@/app/admin/actions";

type MailPasswordSource = "env" | "file" | "missing";

type MailConfig = {
  enabled: boolean;
  provider: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  notifyTo: string;
  siteUrl: string;
  ownerQq: string;
  ownerNickname: string;
  hasPassword: boolean;
  passwordSource: MailPasswordSource;
  passwordEnvKey: string;
  updatedAt?: string;
};

const PROVIDER_PRESETS: Record<
  string,
  { host: string; port: number; secure: boolean }
> = {
  qq: { host: "smtp.qq.com", port: 465, secure: true },
  "163": { host: "smtp.163.com", port: 465, secure: true },
  gmail: { host: "smtp.gmail.com", port: 587, secure: false },
  outlook: { host: "smtp.office365.com", port: 587, secure: false },
  custom: { host: "", port: 465, secure: true },
};

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
  passwordSource: "missing",
  passwordEnvKey: "SMTP_PASS",
};

const providers = [
  { label: "QQ", value: "qq" },
  { label: "163", value: "163" },
  { label: "Gmail", value: "gmail" },
  { label: "Outlook", value: "outlook" },
  { label: "自定义", value: "custom" },
];

function getPasswordBadge(source: MailPasswordSource) {
  switch (source) {
    case "env":
      return {
        label: "来自 .env",
        className:
          "rounded-full border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      };
    case "file":
      return {
        label: "旧文件残留",
        className:
          "rounded-full border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      };
    default:
      return {
        label: "未配置",
        className:
          "rounded-full border-border/70 bg-background text-muted-foreground",
      };
  }
}

function getPasswordHint(config: MailConfig) {
  if (config.passwordSource === "env") {
    return `当前授权码已从 .env 的 ${config.passwordEnvKey} 读取，后台不会再保存明文密码。`;
  }

  if (config.passwordSource === "file") {
    return `检测到旧配置文件里仍可能残留授权码，建议立刻迁移到 .env 的 ${config.passwordEnvKey}，然后重新保存一次配置完成清理。`;
  }

  return `请在项目根目录的 .env 中补充 ${config.passwordEnvKey}，否则测试邮件和通知邮件都无法正常发出。`;
}

export function MailForm() {
  const [config, setConfig] = useState<MailConfig>(EMPTY_CONFIG);
  const [testTo, setTestTo] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();

  useEffect(() => {
    getMailSettingsAction()
      .then((data) => {
        setConfig(data as MailConfig);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const setField = <K extends keyof MailConfig>(
    key: K,
    value: MailConfig[K],
  ) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const handleProviderChange = (provider: string) => {
    const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.custom;

    setConfig((current) => ({
      ...current,
      provider,
      host: preset.host,
      port: preset.port,
      secure: preset.secure,
    }));
  };

  const reloadConfig = async () => {
    const data = await getMailSettingsAction();
    setConfig(data as MailConfig);
  };

  const handleSave = () => {
    startSave(async () => {
      const result = await saveMailSettingsAction({
        enabled: config.enabled,
        provider: config.provider,
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        from: config.from,
        notifyTo: config.notifyTo,
        siteUrl: config.siteUrl,
        ownerQq: config.ownerQq,
        ownerNickname: config.ownerNickname,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      await reloadConfig();
      toast.success("配置已更新");
    });
  };

  const handleTest = () => {
    const target = testTo.trim() || config.notifyTo;
    if (!target) {
      toast.error("请输入测试收件邮箱");
      return;
    }

    startTest(async () => {
      const result = await sendTestMailAction(target);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("测试邮件已成功发出");
    });
  };

  if (!loaded) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground/50 animate-pulse tracking-widest uppercase">
        Syncing Terminal...
      </div>
    );
  }

  const passwordBadge = getPasswordBadge(config.passwordSource);
  const canSendTest = config.enabled && config.hasPassword;

  return (
    <div className="max-w-4xl mx-auto space-y-16 py-8">
      {/* 核心开关 & 凭证：极简对齐 */}
      <section className="flex flex-col md:flex-row gap-12 items-start justify-between border-b border-border/40 pb-12">
        <div className="space-y-2 max-w-sm">
          <div className="flex items-center gap-3">
             <div className="size-1.5 rounded-full bg-primary" />
             <h2 className="text-sm font-black uppercase tracking-[0.2em]">Master Switch</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            全局控制邮件中枢的运行状态。关闭后将挂起所有外发通知任务。
          </p>
          <div className="pt-2">
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setField("enabled", checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Credential Status</h2>
              <Badge variant="outline" className={cn("rounded-md border-none text-[10px] px-2", passwordBadge.className)}>
                {passwordBadge.label}
              </Badge>
           </div>
           <div className="rounded-xl border border-border/40 bg-muted/10 p-4 font-mono text-[10px] leading-relaxed text-muted-foreground/80">
              {getPasswordHint(config)}
           </div>
        </div>
      </section>

      {/* 协议与服务器：线框化布局 */}
      <section className="space-y-12">
        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-center">Infrastructure</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {providers.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handleProviderChange(item.value)}
                className={cn(
                  "px-5 py-2 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2",
                  config.provider === item.value 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground/40 hover:text-muted-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-x-12 gap-y-8 md:grid-cols-4">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-1">Hostname</label>
            <Input
              value={config.host}
              onChange={(event) => setField("host", event.target.value)}
              placeholder="smtp.service.com"
              className="h-10 border-0 border-b border-border/60 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary transition-colors px-1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-1">Port</label>
            <Input
              type="number"
              value={String(config.port)}
              onChange={(event) => setField("port", Number(event.target.value) || 465)}
              className="h-10 border-0 border-b border-border/60 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary transition-colors px-1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-1">Encryption</label>
            <div className="h-10 flex items-center gap-3 px-1">
              <span className="text-[10px] font-medium text-muted-foreground">SSL/TLS</span>
              <Switch
                checked={config.secure}
                onCheckedChange={(checked) => setField("secure", checked)}
                className="scale-90"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 身份信息：极简网格 */}
      <section className="space-y-10">
        <h2 className="text-xs font-black uppercase tracking-[0.2em]">Identity Display</h2>
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          {[
            { label: "Username", value: config.user, key: "user", placeholder: "your@email.com" },
            { label: "Sender Alias", value: config.from, key: "from", placeholder: "Site Name <email@site.com>" },
            { label: "Admin Nickname", value: config.ownerNickname, key: "ownerNickname", placeholder: "Nickname" },
            { label: "Avatar QQ", value: config.ownerQq, key: "ownerQq", placeholder: "10001" },
          ].map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-1">{field.label}</label>
              <Input
                value={field.value}
                onChange={(e) => setField(field.key as any, e.target.value)}
                placeholder={field.placeholder}
                className="h-10 border-0 border-b border-border/60 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary transition-colors px-1"
              />
            </div>
          ))}
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-1">Callback URL</label>
            <Input
              value={config.siteUrl}
              onChange={(event) => setField("siteUrl", event.target.value)}
              placeholder="https://kerntau.com"
              className="h-10 border-0 border-b border-border/60 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary transition-colors px-1"
            />
          </div>
        </div>
      </section>

      {/* 操作区：极简悬浮或底栏 */}
      <section className="pt-12 border-t border-border/40">
        <div className="flex flex-col md:flex-row gap-8 items-end justify-between">
          <div className="space-y-3 w-full md:max-w-xs">
             <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Terminal Test</label>
             <div className="flex gap-2">
                <Input 
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="Target Email"
                  className="h-9 text-xs border-border/40 bg-muted/10 rounded-lg focus:bg-background"
                />
                <Button 
                  variant="outline" 
                  onClick={handleTest} 
                  disabled={testing || !canSendTest} 
                  className="h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest border-border/40"
                >
                  Test
                </Button>
             </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="h-11 px-12 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/10 transition-all hover:scale-105 active:scale-95"
          >
            Apply Changes
          </Button>
        </div>
      </section>
    </div>
  );
}
