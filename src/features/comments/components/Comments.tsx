import { MessageSquareText } from 'lucide-react'
import CommentForm from '@/features/comments/components/comment-form'
import CommentItem from '@/features/comments/components/comment-item'
import { getApprovedComments } from '@/features/comments/lib/comments'
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
  const dateLocale = 'zh-CN'

  const countItems = (items: typeof comments): number =>
    items.reduce((sum, item) => sum + 1 + countItems(item.replies), 0)
  const totalCount = countItems(comments)

  return (
    <section className="space-y-3.5 text-left">
      <header className="flex items-center gap-3">
        <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <MessageSquareText className="text-primary-600 dark:text-primary-300 h-4.5 w-4.5" />
          <span>{dictionary.comments.sectionTitle}</span>
          <span className="bg-primary/12 text-primary-700 dark:bg-primary/20 dark:text-primary-300 rounded-full px-2 py-0.5 text-xs font-semibold">
            {totalCount}
          </span>
        </h3>
      </header>

      <CommentForm postId={slug} />

      <div>
        {comments.length === 0 ? (
          <div className="text-muted-foreground border-border/60 rounded-xl border border-dashed px-4 py-4 text-sm">
            {dictionary.comments.emptyState}
          </div>
        ) : (
          <ul className="flex flex-col">
            {comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment as any} 
                depth={0} 
                dictionary={dictionary} 
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
