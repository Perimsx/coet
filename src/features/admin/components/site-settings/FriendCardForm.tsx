import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { SiteSettings } from "@/server/site-settings"
import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"

interface FriendCardFormProps {
  draft: SiteSettings
  onChange: (key: keyof SiteSettings, value: string) => void
}

export function FriendCardForm({ draft, onChange }: FriendCardFormProps) {
  const syncFromSite = () => {
    onChange("friendName", draft.title || "")
    onChange("friendUrl", draft.siteUrl || "")
    onChange("friendAvatar", draft.heroAvatar || "")
    onChange("friendDescription", draft.description || "")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          此处的配置将专门用于“友链”页面本站名片的展示，方便其他博主快速复制。
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={syncFromSite}
          className="h-8 rounded-lg text-xs"
        >
          <RefreshCcw className="mr-1.5 size-3" />
          同步站点基础信息
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">博主名称</label>
          <Input
            value={draft.friendName || ""}
            onChange={(event) => onChange("friendName", event.target.value)}
            placeholder="例如：陈某某"
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">博客地址</label>
          <Input
            value={draft.friendUrl || ""}
            onChange={(event) => onChange("friendUrl", event.target.value)}
            placeholder="例如：https://coet.ink"
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-foreground">头像链接</label>
          <Input
            value={draft.friendAvatar || ""}
            onChange={(event) => onChange("friendAvatar", event.target.value)}
            placeholder="例如：https://example.com/avatar.png"
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-foreground">博客描述</label>
          <Textarea
            rows={3}
            value={draft.friendDescription || ""}
            onChange={(event) => onChange("friendDescription", event.target.value)}
            placeholder="一句话介绍你的博客"
            className="rounded-2xl"
          />
        </div>
      </div>

      {(draft.friendName || draft.friendUrl) && (
         <div className="mt-4 p-4 rounded-xl border border-dashed border-border bg-muted/30">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">预览（复制内容）</div>
            <div className="space-y-1 font-mono text-xs">
               <p><span className="text-muted-foreground select-none">名称：</span>{draft.friendName}</p>
               <p><span className="text-muted-foreground select-none">描述：</span>{draft.friendDescription}</p>
               <p><span className="text-muted-foreground select-none">网址：</span>{draft.friendUrl}</p>
               <p><span className="text-muted-foreground select-none">头像：</span>{draft.friendAvatar}</p>
            </div>
         </div>
      )}
    </div>
  )
}
