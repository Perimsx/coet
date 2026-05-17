import { MessageSquare } from 'lucide-react'

/**
 * 评论区占位组件 (Comments)
 * 暂时显示正在集成中的占位信息。
 */
export default function Comments({ slug }: { slug?: string }) {
  return (
    <section className="py-4 sm:py-6 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-border/20 bg-muted/30 px-4 py-2 text-[13px] text-muted-foreground/60">
        <MessageSquare className="h-3.5 w-3.5" />
        <span>评论功能集成中</span>
      </div>
    </section>
  )
}
