import { Input } from "@/components/ui/input"
import type { SiteSettings } from "@/server/site-settings"

interface SocialsFormProps {
  draft: SiteSettings
  onChange: (key: keyof SiteSettings, value: string) => void
}

export function SocialsForm({ draft, onChange }: SocialsFormProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">邮箱</label>
        <Input
          value={draft.email || ""}
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="你的邮箱@服务商.com"
          className="h-10 rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">GitHub</label>
        <Input
          value={draft.github || ""}
          onChange={(event) => onChange("github", event.target.value)}
          placeholder="https://github.com/..."
          className="h-10 rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">X / Twitter</label>
        <Input
          value={draft.x || ""}
          onChange={(event) => onChange("x", event.target.value)}
          placeholder="https://x.com/..."
          className="h-10 rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">语雀</label>
        <Input
          value={draft.yuque || ""}
          onChange={(event) => onChange("yuque", event.target.value)}
          placeholder="https://www.yuque.com/..."
          className="h-10 rounded-xl"
        />
      </div>
    </div>
  )
}
