import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { SiteSettings } from "@/server/site-settings"

interface PresentationFormProps {
  draft: SiteSettings
  onChange: (key: keyof SiteSettings, value: string) => void
}

function ToggleField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="text-xs leading-6 text-muted-foreground">{description}</div>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  )
}

export function PresentationForm({ draft, onChange }: PresentationFormProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="text-sm font-semibold text-foreground">首页主视觉</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">问候前缀</label>
            <Input
              value={draft.heroGreetingPrefix || ""}
              onChange={(event) => onChange("heroGreetingPrefix", event.target.value)}
              placeholder="例如：Hi there, I'm"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">首页展示名</label>
            <Input
              value={draft.heroDisplayName || ""}
              onChange={(event) => onChange("heroDisplayName", event.target.value)}
              placeholder="例如：kerntau"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">角色标题</label>
            <Input
              value={draft.heroRole || ""}
              onChange={(event) => onChange("heroRole", event.target.value)}
              placeholder="例如：A Full Stack Developer"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">首页底部文案</label>
            <Input
              value={draft.heroBottomText || ""}
              onChange={(event) => onChange("heroBottomText", event.target.value)}
              placeholder="页面首屏底部的滚动提示文案"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground">首页头像</label>
            <Input
              value={draft.heroAvatar || ""}
              onChange={(event) => onChange("heroAvatar", event.target.value)}
              placeholder="首页 Hero 区域头像地址"
              className="h-10 rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-foreground">前台模块开关</div>
        <div className="grid gap-4 md:grid-cols-3">
          <ToggleField
            label="搜索入口"
            description="控制顶部搜索按钮是否展示。"
            checked={draft.enableSearch !== "false"}
            onCheckedChange={(checked) => onChange("enableSearch", String(checked))}
          />
          <ToggleField
            label="建议入口"
            description="控制顶部联系站长入口是否展示。"
            checked={draft.enableSuggestion !== "false"}
            onCheckedChange={(checked) => onChange("enableSuggestion", String(checked))}
          />
          <ToggleField
            label="主题切换"
            description="控制顶部深浅色切换按钮是否展示。"
            checked={draft.enableThemeSwitch !== "false"}
            onCheckedChange={(checked) => onChange("enableThemeSwitch", String(checked))}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-foreground">页脚文案</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">驱动前缀</label>
            <Input
              value={draft.footerPoweredByLabel || ""}
              onChange={(event) => onChange("footerPoweredByLabel", event.target.value)}
              placeholder="例如：由"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">驱动名称</label>
            <Input
              value={draft.footerPoweredByName || ""}
              onChange={(event) => onChange("footerPoweredByName", event.target.value)}
              placeholder="例如：腾讯云"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">版权补充文案</label>
            <Input
              value={draft.footerRightsText || ""}
              onChange={(event) => onChange("footerRightsText", event.target.value)}
              placeholder="例如：All rights reserved"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">公安备案图标</label>
            <Input
              value={draft.footerPoliceBadgeIcon || ""}
              onChange={(event) => onChange("footerPoliceBadgeIcon", event.target.value)}
              placeholder="默认使用公安备案官方图标地址"
              className="h-10 rounded-xl"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
