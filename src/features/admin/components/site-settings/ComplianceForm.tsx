import { Input } from "@/components/ui/input"
import type { SiteSettings } from "@/server/site-settings"

interface ComplianceFormProps {
  draft: SiteSettings
  onChange: (key: keyof SiteSettings, value: string) => void
}

export function ComplianceForm({ draft, onChange }: ComplianceFormProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">ICP 备案号</label>
        <Input
          value={draft.icp || ""}
          onChange={(event) => onChange("icp", event.target.value)}
          placeholder="例如：浙 ICP 备 XXXXX 号"
          className="h-10 rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">公安备案号</label>
        <Input
          value={draft.policeBeian || ""}
          onChange={(event) => onChange("policeBeian", event.target.value)}
          placeholder="例如：浙公网安备 XXXXX 号"
          className="h-10 rounded-xl"
        />
      </div>
    </div>
  )
}
