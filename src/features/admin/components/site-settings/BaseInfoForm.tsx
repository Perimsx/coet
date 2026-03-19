import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { SiteSettings } from "@/server/site-settings"

interface BaseInfoFormProps {
  draft: SiteSettings
  onChange: (key: keyof SiteSettings, value: string) => void
}

export function BaseInfoForm({ draft, onChange }: BaseInfoFormProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">站点标题</label>
        <Input
          value={draft.title || ""}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="例如：Coet - 极简博客"
          className="h-10 rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">导航标题</label>
        <Input
          value={draft.headerTitle || ""}
          onChange={(event) => onChange("headerTitle", event.target.value)}
          placeholder="例如：Coet"
          className="h-10 rounded-xl"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium text-foreground">站点描述</label>
        <Textarea
          rows={4}
          value={draft.description || ""}
          onChange={(event) => onChange("description", event.target.value)}
          placeholder="用于 SEO 与站点简介"
          className="rounded-2xl"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium text-foreground">首页标语</label>
        <Textarea
          rows={3}
          value={draft.welcomeMessage || ""}
          onChange={(event) => onChange("welcomeMessage", event.target.value)}
          placeholder="例如：知行合一 缄默前行"
          className="rounded-2xl"
        />
      </div>
    </div>
  )
}
