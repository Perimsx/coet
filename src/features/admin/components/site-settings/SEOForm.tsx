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
          placeholder="https://你的站点.com"
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
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Google Search Console 验证码</label>
        <Input
          value={draft.googleSearchConsole || ""}
          onChange={(event) => onChange("googleSearchConsole", event.target.value)}
          placeholder="填写 Google 验证标签的 content 内容"
          className="h-10 rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Baidu Search Console 验证码</label>
        <Input
          value={draft.baiduSearchConsole || ""}
          onChange={(event) => onChange("baiduSearchConsole", event.target.value)}
          placeholder="填写百度验证标签的 content 内容"
          className="h-10 rounded-xl"
        />
      </div>
      <div className="space-y-4 md:col-span-2 pt-4 border-t">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">主动推送配置</label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">IndexNow API Key</label>
              <a href="https://www.bing.com/indexnow/getstarted" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">如何获取？</a>
            </div>
            <Input
              value={draft.indexNowKey || ""}
              onChange={(event) => onChange("indexNowKey", event.target.value.trim())}
              placeholder="例如：32位随机字符串"
              className="h-10 rounded-xl font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">百度推送 Token</label>
              <a href="https://ziyuan.baidu.com/linksubmit/index" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">如何获取？</a>
            </div>
            <Input
              value={draft.baiduToken || ""}
              onChange={(event) => onChange("baiduToken", event.target.value.trim())}
              placeholder="百度资源平台提供的 token"
              className="h-10 rounded-xl font-mono text-xs"
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">配置完成后，系统将在文章发布或更新时自动向 Bing/Yandex (IndexNow) 和百度提交 URL。</p>
      </div>

      <div className="space-y-2 md:col-span-2 pt-4 border-t">
        <label className="text-sm font-medium text-foreground">全局关键词</label>
        <Textarea
          rows={3}
          value={draft.seoKeywords || ""}
          onChange={(event) => onChange("seoKeywords", event.target.value)}
          placeholder="多个关键词使用逗号分隔"
          className="rounded-2xl"
        />
      </div>
    </div>
  )
}
