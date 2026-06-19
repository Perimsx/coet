import { MessageSquare } from 'lucide-react'

const LABELS: Record<string, string> = {
  zh: '评论功能即将上线',
  en: 'Comments coming soon',
}

export default function Comments({ slug, locale = 'zh' }: { slug?: string; locale?: 'zh' | 'en' }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/20 bg-muted/30 px-4 py-2 text-[13px] text-muted-foreground/60">
      <MessageSquare className="h-3.5 w-3.5" />
      <span>{LABELS[locale] || LABELS.zh}</span>
    </div>
  )
}
