import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { SiteSettings } from "@/server/site-settings"

interface SEOFormProps {
  draft: SiteSettings
  onChange: (key: keyof SiteSettings, value: string) => void
}

export function SEOForm({ draft, onChange }: SEOFormProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">站点主域名</label>
        <Input
          value={draft.siteUrl || ""}
          onChange={(event) => onChange("siteUrl", event.target.value)}
          placeholder="https://example.com"
          className="h-10 rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">默认分享图</label>
        <Input
          value={draft.socialBanner || ""}
          onChange={(event) => onChange("socialBanner", event.target.value)}
          placeholder="/static/images/twitter-card.png"
          className="h-10 rounded-xl"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium text-foreground">Google Search Console 验证码</label>
        <Input
          value={draft.googleSearchConsole || ""}
          onChange={(event) => onChange("googleSearchConsole", event.target.value)}
          placeholder="填写 meta 标签中的 content 内容"
          className="h-10 rounded-xl"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium text-foreground">全局关键词</label>
        <Textarea
          rows={4}
          value={draft.seoKeywords || ""}
          onChange={(event) => onChange("seoKeywords", event.target.value)}
          placeholder="多个关键词使用逗号分隔"
          className="rounded-2xl"
        />
      </div>
    </div>
  )
}
