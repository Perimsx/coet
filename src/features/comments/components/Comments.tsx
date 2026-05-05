import { MessageSquareText } from 'lucide-react'
import CommentForm from '@/features/comments/components/comment-form'
import CommentItem from '@/features/comments/components/comment-item'
import { getApprovedComments } from '@/features/comments/lib/comments'
import type { CommentTreeItem } from '@/features/comments/lib/comments'
import { getServerDictionary } from '@/shared/utils/i18n-server'
import { getMailSettings } from '@/server/mail-settings'

/**
 * 评论区主组件 (Comments)
 * 异步加载已审核评论、多语言词典及站点配置（如作者信息、Logo）。建议修复错误。
 */
export default async function Comments({ slug }: { slug: string }) {
  const [comments, dictionary, mailSettings] = await Promise.all([
    getApprovedComments(slug),
    getServerDictionary(),
    getMailSettings(),
  ])

  const countItems = (items: CommentTreeItem[]): number =>
    items.reduce((sum, item) => sum + 1 + countItems(item.replies), 0)
  const totalCount = countItems(comments)

  return (
    <section className="space-y-3.5 text-left">
      <header className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquareText className="h-4.5 w-4.5" />
          </div>
          <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {dictionary.comments.sectionTitle}
          </h3>
          <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black tabular-nums text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
            {totalCount}
          </span>
        </div>
      </header>

      <CommentForm postId={slug} />

      <div>
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200/60 py-12 text-center dark:border-white/5">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-300 dark:bg-white/5">
              <MessageSquareText className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-zinc-400">
              {dictionary.comments.emptyState}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment}
                depth={0} 
                siteConfigAuthor={mailSettings.ownerNickname} 
                siteConfigLogo={mailSettings.ownerQq ? `https://q1.qlogo.cn/g?b=qq&nk=${mailSettings.ownerQq}&s=100` : undefined} 
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
