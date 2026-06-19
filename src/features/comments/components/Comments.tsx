import { MessageSquare } from 'lucide-react'
import { useNavLanguage } from '@/features/site/lib/nav-language'

export default function Comments({ slug }: { slug?: string }) {
  const { locale } = useNavLanguage()
  const text = locale === 'en' ? 'Comments coming soon' : '评论功能集成中'

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/20 bg-muted/30 px-4 py-2 text-[13px] text-muted-foreground/60">
      <MessageSquare className="h-3.5 w-3.5" />
      <span>{text}</span>
    </div>
  )
}
