import { MessageSquare } from 'lucide-react'

const LABELS: Record<string, string> = {
  zh: '评论功能即将上线',
  en: 'Comments coming soon',
}

export default function Comments({ locale = 'zh' }: { slug?: string; locale?: 'zh' | 'en' }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-neutral-1 px-3.5 py-1.5 text-label-12 text-neutral-6 shadow-xs">
      <MessageSquare className="h-3.5 w-3.5 text-neutral-5" />
      <span>{LABELS[locale] || LABELS.zh}</span>
    </div>
  )
}
