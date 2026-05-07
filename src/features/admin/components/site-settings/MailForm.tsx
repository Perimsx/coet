"use client";

import { useEffect, useState, useTransition } from "react";
import { KeyRound, Mail, RefreshCw, Send, TriangleAlert } from "lucide-react";
import { toast } from '@/shared/hooks/use-toast'
import { cn } from "@/components/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/features/admin/components/admin-ui";
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

function MailPreviewCard({ config }: { config: MailConfig }) {
  const avatarUrl = config.ownerQq 
    ? `https://q1.qlogo.cn/g?b=qq&nk=${config.ownerQq}&s=100`
    : "https://ui-avatars.com/api/?name=Admin";

  return (
    <div className="sticky top-6 overflow-hidden rounded-[2.5rem] border border-border/50 bg-white shadow-2xl dark:bg-zinc-900 transition-all">
      <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="size-2.5 rounded-full bg-red-400" />
          <div className="size-2.5 rounded-full bg-amber-400" />
          <div className="size-2.5 rounded-full bg-emerald-400" />
          <div className="ml-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
            Realtime Preview
          </div>
        </div>
      </div>

      <div className="p-8 lg:p-12">
        <div className="flex items-start gap-5 border-b border-border/40 pb-8">
          <div className="relative">
            <img src={avatarUrl} className="size-14 rounded-full border-4 border-background shadow-xl" alt="Avatar" />
            <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-blue-500 border-4 border-background" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-black text-foreground">
                {config.ownerNickname || "站点管理员"}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground/50">JUST NOW</span>
            </div>
            <div className="truncate text-xs font-medium text-muted-foreground">
              {config.from || config.user || "noreply@kerntau.com"}
            </div>
            <div className="mt-3 text-[17px] font-black tracking-tight text-foreground leading-tight">
              有人在你的文章下发表了回复
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-8">
          <div className="rounded-3xl bg-primary/5 p-8 border border-primary/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-none">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-widest text-primary opacity-80">Notification Center</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground font-medium">
              嗨，这是一条来自 <strong className="text-foreground">{config.siteUrl || "你的博客系统"}</strong> 的自动通知。
            </p>
            <div className="mt-6 rounded-2xl bg-white/80 dark:bg-zinc-800/80 p-5 text-[13px] leading-relaxed text-foreground italic border border-border/40 shadow-sm">
              "这是一段示例回复内容，我们将在这里展示访客留下的精彩瞬间..."
            </div>
            <div className="mt-8 flex justify-center">
               <div className="px-6 py-2.5 rounded-full bg-primary text-white text-[11px] font-black shadow-lg shadow-primary/30 uppercase tracking-widest">
                  立即查看回复
               </div>
            </div>
          </div>
          <div className="text-center text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.15em]">
            This is a system generated email.
          </div>
        </div>
      </div>
    </div>
  );
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
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground animate-pulse">
        同步邮件中枢数据...
      </div>
    );
  }

  const passwordBadge = getPasswordBadge(config.passwordSource);
  const canSendTest = config.enabled && config.hasPassword;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* 左侧配置栏 */}
      <div className="lg:col-span-7 space-y-10">
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-[2rem] border border-primary/10 bg-primary/5 p-6">
            <div className="space-y-1">
              <div className="text-base font-black text-foreground">中枢通知开关</div>
              <p className="text-xs text-muted-foreground">全局控制所有业务邮件的收发状态</p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setField("enabled", checked)}
              className="scale-125 data-[state=checked]:bg-primary"
            />
          </div>

          <div className="rounded-[2rem] border border-border/50 bg-background p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-foreground/80">
               <KeyRound className="size-4 text-primary" />
               安全凭证
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                 <span className="text-muted-foreground font-medium">配置源识别</span>
                 <Badge variant="outline" className={cn("rounded-lg border-none", passwordBadge.className)}>
                    {passwordBadge.label}
                 </Badge>
              </div>
              <div className="rounded-xl bg-muted/30 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground border border-border/40">
                {getPasswordHint(config)}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="space-y-4">
            <div className="text-sm font-black uppercase tracking-widest text-foreground/60">服务器通讯协议</div>
            <div className="flex flex-wrap gap-2">
              {providers.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  variant={config.provider === item.value ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl h-9 px-4 font-bold"
                  onClick={() => handleProviderChange(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">SMTP HOST</label>
              <Input
                value={config.host}
                onChange={(event) => setField("host", event.target.value)}
                placeholder="smtp.service.com"
                className="h-11 rounded-2xl border-border/60 bg-muted/10 focus:bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">PORT</label>
              <Input
                type="number"
                value={String(config.port)}
                onChange={(event) => setField("port", Number(event.target.value) || 465)}
                className="h-11 rounded-2xl border-border/60 bg-muted/10 focus:bg-background"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">SSL / TLS</label>
                <Switch
                  checked={config.secure}
                  onCheckedChange={(checked) => setField("secure", checked)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
           <div className="text-sm font-black uppercase tracking-widest text-foreground/60">身份展示信息</div>
           <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">账号 / 用户名</label>
                <Input
                  value={config.user}
                  onChange={(event) => setField("user", event.target.value)}
                  className="h-11 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">发件人别名</label>
                <Input
                  value={config.from}
                  onChange={(event) => setField("from", event.target.value)}
                  placeholder="博客名称 <email@site.com>"
                  className="h-11 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">站长昵称</label>
                <Input
                  value={config.ownerNickname}
                  onChange={(event) => setField("ownerNickname", event.target.value)}
                  className="h-11 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">站长 QQ (头像联动)</label>
                <Input
                  value={config.ownerQq}
                  onChange={(event) => setField("ownerQq", event.target.value)}
                  className="h-11 rounded-2xl"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">点击跳转 URL</label>
                <Input
                  value={config.siteUrl}
                  onChange={(event) => setField("siteUrl", event.target.value)}
                  className="h-11 rounded-2xl"
                />
              </div>
           </div>
        </section>

        <section className="pt-6 border-t border-border/40">
           <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative flex-1 w-full max-w-sm">
                 <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                 <Input 
                   value={testTo}
                   onChange={(e) => setTestTo(e.target.value)}
                   placeholder="测试收件邮箱..."
                   className="h-11 pl-10 rounded-2xl border-primary/20 bg-primary/5 focus:bg-background"
                 />
              </div>
              <div className="flex gap-2">
                 <Button variant="outline" onClick={handleTest} disabled={testing || !canSendTest} className="rounded-2xl h-11 px-6 font-bold">
                    <Send className="mr-2 size-4" /> 发送测试
                 </Button>
                 <Button onClick={handleSave} disabled={saving} className="rounded-2xl h-11 px-8 font-black shadow-xl shadow-primary/20">
                    <Save className="mr-2 size-4" /> 保存所有配置
                 </Button>
              </div>
           </div>
        </section>
      </div>

      {/* 右侧预览栏 */}
      <div className="lg:col-span-5 hidden lg:block">
        <MailPreviewCard config={config} />
      </div>
    </div>
  );
}
