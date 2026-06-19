import { MessageSquare } from 'lucide-react'

export default function Comments({ slug }: { slug?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/20 bg-muted/30 px-4 py-2 text-[13px] text-muted-foreground/60">
      <MessageSquare className="h-3.5 w-3.5" />
      <span>Comments coming soon</span>
    </div>
  )
}
