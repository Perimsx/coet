"use client";

import { useEffect, useState, useTransition } from "react";
import { KeyRound, Mail, RefreshCw, Send, TriangleAlert } from "lucide-react";
import { toast } from '@/shared/hooks/use-toast'

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
    toast.success("邮件配置已重新加载。");
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
      toast.success(result.success || "邮件基础配置已保存。");
    });
  };

  const handleTest = () => {
    const target = testTo.trim() || config.notifyTo;
    if (!target) {
      toast.error("请输入测试收件邮箱。");
      return;
    }

    startTest(async () => {
      const result = await sendTestMailAction(target);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success || "测试邮件已发送。");
    });
  };

  if (!loaded) {
    return (
      <AdminPanel>
        <AdminPanelBody className="p-6 text-sm text-muted-foreground">
          正在加载邮件配置...
        </AdminPanelBody>
      </AdminPanel>
    );
  }

  const passwordBadge = getPasswordBadge(config.passwordSource);
  const canSendTest = config.enabled && config.hasPassword;

  return (
    <div className="space-y-4">
      <AdminPanel>
        <AdminPanelHeader
          title="邮件通知"
          description="管理评论回复、友链申请与系统通知使用的 SMTP 基础配置。"
        />
        <AdminPanelBody className="space-y-5">
          <div className="flex flex-col gap-4 rounded-[24px] border border-border/70 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">
                通知服务开关
              </div>
              <div className="text-xs leading-6 text-muted-foreground">
                开启后才会发送评论、回复、友链和建议通知邮件。
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

          <div className="rounded-[24px] border border-border/70 bg-background p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <KeyRound className="size-4" />
                  SMTP 授权码
                </div>
                <p className="text-xs leading-6 text-muted-foreground">
                  {getPasswordHint(config)}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className={passwordBadge.className}>
                    {passwordBadge.label}
                  </Badge>
                  <code className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-foreground">
                    {config.passwordEnvKey}
                  </code>
                </div>
              </div>
              {config.passwordSource !== "env" ? (
                <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-6 text-amber-700 dark:text-amber-300">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <span>
                    推荐把授权码单独放进 .env，避免再次进入仓库或配置备份文件。
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">
              服务商预设
            </div>
            <div className="flex flex-wrap gap-2">
              {providers.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  variant={
                    config.provider === item.value ? "default" : "outline"
                  }
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
              <label className="text-sm font-medium text-foreground">
                SMTP 主机
              </label>
              <Input
                value={config.host}
                onChange={(event) => setField("host", event.target.value)}
                placeholder="smtp.your-provider.com"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                端口
              </label>
              <Input
                type="number"
                value={String(config.port)}
                onChange={(event) =>
                  setField("port", Number(event.target.value) || 465)
                }
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-foreground">
                  SSL
                </label>
                <Switch
                  checked={config.secure}
                  onCheckedChange={(checked) => setField("secure", checked)}
                />
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                关闭后将按 STARTTLS 或明文端口方式连接。
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                发件邮箱账号
              </label>
              <Input
                value={config.user}
                onChange={(event) => setField("user", event.target.value)}
                placeholder="you@example.com"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                发件人显示
              </label>
              <Input
                value={config.from}
                onChange={(event) => setField("from", event.target.value)}
                placeholder="博客名称 <you@example.com>"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                通知收件邮箱
              </label>
              <Input
                value={config.notifyTo}
                onChange={(event) => setField("notifyTo", event.target.value)}
                placeholder="接收评论与系统通知的邮箱"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                站点地址
              </label>
              <Input
                value={config.siteUrl}
                onChange={(event) => setField("siteUrl", event.target.value)}
                placeholder="https://example.com"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                站长 QQ
              </label>
              <Input
                value={config.ownerQq}
                onChange={(event) => setField("ownerQq", event.target.value)}
                placeholder="用于默认头像"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                站长昵称
              </label>
              <Input
                value={config.ownerNickname}
                onChange={(event) =>
                  setField("ownerNickname", event.target.value)
                }
                placeholder="用于邮件中的昵称展示"
                className="h-10 rounded-xl"
              />
            </div>
          </div>
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader
          title="测试发送"
          description="支持使用自定义目标地址或默认通知邮箱验证当前 SMTP 配置。"
        />
        <AdminPanelBody className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              测试收件邮箱
            </label>
            <Input
              value={testTo}
              onChange={(event) => setTestTo(event.target.value)}
              placeholder={config.notifyTo || "请输入测试邮箱"}
              className="h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                {config.updatedAt
                  ? `最后更新：${new Date(config.updatedAt).toLocaleString("zh-CN")}`
                  : "尚未保存过邮件基础配置。"}
              </div>
              {!config.hasPassword ? (
                <div>发送测试邮件前，请先在 .env 中配置 SMTP 授权码。</div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={saving}
                onClick={() => void reloadConfig()}
              >
                <RefreshCw className="size-4" />
                重新加载
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={testing || !canSendTest}
                onClick={handleTest}
              >
                <Send className="size-4" />
                发送测试邮件
              </Button>

              <Button
                type="button"
                className="rounded-xl"
                disabled={saving}
                onClick={handleSave}
              >
                <Mail className="size-4" />
                保存基础配置
              </Button>
            </div>
          </div>
        </AdminPanelBody>
      </AdminPanel>
    </div>
  );
}
