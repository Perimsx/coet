'use client'

import { useEffect, useState } from 'react'
import Image from '@/features/content/components/Image'
import { toast } from '@/shared/hooks/use-toast'
import { Globe, ThumbsUp, MessageSquareReply, BadgeCheck } from 'lucide-react' // 评论项所需图标
import CommentMarkdown from '@/features/comments/components/comment-markdown'
import CommentForm from '@/features/comments/components/comment-form'
import type { CommentTreeItem } from '@/features/comments/lib/comments'
import {
  formatClientLocation,
  getBrowserIconHtml,
  getOsIconHtml,
  hasKnownClientValue,
} from '@/features/comments/lib/comment-client-display'
import { toProxiedImageSrc } from '@/shared/utils/image-proxy'
import { likeCommentAction } from '@/app/actions/comments'

export type CommentData = CommentTreeItem

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * 根据 QQ 号或头像地址构建头像 URL
 */
function buildAvatarUrl(input: { avatar?: string | null; qq?: string | null }) {
  if (input.avatar) return input.avatar
  if (input.qq && /^\d{5,12}$/.test(input.qq)) {
    return `https://q1.qlogo.cn/g?b=qq&nk=${input.qq}&s=100`
  }
  return ''
}

function buildMetaItems(input: {
  location?: string | null
  browser?: string | null
  os?: string | null
}) {
  const items: {
    key: string
    value: string
    type: 'location' | 'os' | 'browser'
    iconHtml?: string
  }[] = []

  const location = formatClientLocation(input.location)
  if (location) {
    items.push({ key: 'location', value: location, type: 'location' })
  }

  if (hasKnownClientValue(input.os)) {
    const os = String(input.os).trim()
    items.push({ key: 'os', value: os, type: 'os', iconHtml: getOsIconHtml(os) })
  }

  if (hasKnownClientValue(input.browser)) {
    const browser = String(input.browser).trim()
    items.push({ key: 'browser', value: browser, type: 'browser', iconHtml: getBrowserIconHtml(browser) })
  }

  return items
}

function stripClientVersionLabel(value: string) {
  return value
    .replace(/\s+\(.*?\)\s*$/, '')
    .replace(/\s+(?:NT\s+)?\d[\d._]*\s*$/i, '')
    .trim()
}

interface CommentItemProps {
  comment: CommentData
  depth: number
  siteConfigAuthor?: string
  siteConfigLogo?: string
  parentAuthorName?: string
}

/**
 * 单条评论项组件 (CommentItem)
 * 处理点赞、回复展开、IP 归属地显示及递归渲染子评论。
 */
export default function CommentItem({
  comment,
  depth = 0,
  siteConfigAuthor,
  siteConfigLogo,
  parentAuthorName,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(comment.likes ?? 0)
  const dateLocale = 'zh-CN'

  useEffect(() => {
    try {
      const stored = localStorage.getItem('coet_likes')
      if (stored) {
        const parsed = JSON.parse(stored) as number[]
        if (parsed.includes(comment.id)) {
          setIsLiked(true)
        }
      }
    } catch {
      // 忽略 JSON 解析错误
    }
  }, [comment.id])

  /**
   * 处理评论点赞逻辑（本地持久化防止重复点赞）
   */
  const handleLike = async () => {
    if (isLiked) return

    setIsLiked(true)
    setLikesCount((c) => c + 1)
    
    try {
      const stored = localStorage.getItem('coet_likes')
      const parsed = stored ? JSON.parse(stored) : []
      localStorage.setItem('coet_likes', JSON.stringify([...parsed, comment.id]))
    } catch {
      // 忽略 localStorage 错误
    }

    await likeCommentAction(comment.id, comment.postId)
  }

  const metaItems = buildMetaItems(comment)
  const isOwner = !!comment.isAdmin
  const displayName = isOwner && siteConfigAuthor ? siteConfigAuthor : comment.authorName

  let rawAvatar = ''
  if (isOwner && siteConfigLogo) {
    rawAvatar = siteConfigLogo
  } else {
    rawAvatar = buildAvatarUrl(comment)
  }
  const avatarSrc = toProxiedImageSrc(rawAvatar)

  const isReply = depth > 0
  const avatarSize = isReply ? 32 : 40

  return (
    <li className={isReply ? 'mt-3' : 'py-5 border-b border-border/40 last:border-0'}>
      <article className={`group relative flex items-start ${isReply ? 'gap-1.5 sm:gap-2.5' : 'gap-2.5 sm:gap-3'}`}>
        {/* 头像区域 */}
        <div className="flex shrink-0 flex-col items-center">
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt={`${displayName} avatar`}
              width={avatarSize}
              height={avatarSize}
              className={`ring-offset-background shrink-0 rounded-2xl border border-zinc-200/50 object-cover shadow-sm ring-primary/5 transition-all group-hover:ring-4 dark:border-white/10 ${isReply ? 'h-8 w-8 mt-1' : 'h-10 w-10 mt-0.5'}`}
            />
          ) : (
            <div className={`bg-zinc-100 text-zinc-500 shrink-0 flex items-center justify-center rounded-2xl border border-zinc-200/50 text-[10px] sm:text-xs font-bold dark:bg-zinc-800 dark:border-white/10 ${isReply ? 'h-8 w-8 mt-1' : 'h-10 w-10 mt-0.5'}`}>
              {getInitials(displayName)}
            </div>
          )}
          {comment.replies.length > 0 && !isReply && (
            <div className="bg-gradient-to-b from-zinc-200 to-transparent mt-3 w-0.5 flex-1 rounded-full opacity-50 dark:from-zinc-700"></div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="min-w-0 flex-1 text-left">
          {/* 头部行：作者、徽章、时间 + 操作按钮 */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (comment.qq) {
                    navigator.clipboard.writeText(comment.qq)
                    toast(`已复制 QQ: ${comment.qq}`, 'success')
                  }
                }}
                className={`text-[14px] font-bold text-zinc-900 dark:text-zinc-100 ${comment.qq ? 'cursor-copy hover:text-primary transition-colors' : 'cursor-default'}`}
                title={comment.qq ? '点击复制 QQ' : undefined}
              >
                {displayName}
              </button>
              {isOwner && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary ring-1 ring-inset ring-primary/20 dark:bg-primary/20 dark:text-primary-400">
                  <BadgeCheck className="h-3 w-3 fill-current" />
                  STAFF
                </span>
              )}
              {parentAuthorName && (
                <span className="text-muted-foreground text-xs sm:text-[13px] flex items-center truncate max-w-[120px] sm:max-w-none ml-1">
                  回复 <span className="text-blue-500/90 dark:text-blue-400/90 ml-1">@{parentAuthorName}</span>
                </span>
              )}
              <time
                className="text-muted-foreground text-[13px]"
                dateTime={comment.createdAt instanceof Date ? comment.createdAt.toISOString() : new Date(comment.createdAt).toISOString()}
              >
                {comment.createdAt instanceof Date ? comment.createdAt.toLocaleString(dateLocale) : new Date(comment.createdAt).toLocaleString(dateLocale)}
              </time>
            </div>

            {/* 操作按钮（右对齐） */}
            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button
                type="button"
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 transition-all ${
                  isLiked ? 'text-primary bg-primary/5' : 'text-zinc-400 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
                onClick={handleLike}
                disabled={isLiked}
              >
                <ThumbsUp className="h-4 w-4" strokeWidth={2} />
                {likesCount > 0 && <span className="text-xs font-bold tabular-nums">{likesCount}</span>}
              </button>
              
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-primary dark:hover:bg-white/5"
                onClick={() => setIsReplying(!isReplying)}
              >
                <MessageSquareReply className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* 评论正文 */}
          <CommentMarkdown content={comment.content} className="mt-1.5 text-sm sm:text-[15px] text-foreground/90 leading-relaxed overflow-hidden break-words" />

          {/* 元信息页脚 */}
          {metaItems.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              {metaItems.map((meta) => (
                <span
                  key={`${comment.id}-meta-${meta.key}`}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400/80"
                >
                  {meta.type === 'location' ? (
                    <Globe className="h-3 w-3 opacity-60" />
                  ) : (
                    <span
                      className="h-3 w-3 opacity-60 grayscale"
                      dangerouslySetInnerHTML={{ __html: meta.iconHtml ?? '' }}
                    />
                  )}
                  {stripClientVersionLabel(meta.value)}
                </span>
              ))}
            </div>
          )}

          {/* 回复表单（内联） */}
          {isReplying && (
            <div className="mt-4">
              <CommentForm 
                postId={comment.postId} 
                parentId={comment.id} 
                onCancel={() => setIsReplying(false)} 
              />
            </div>
          )}

          {/* 递归回复列表 */}
          {comment.replies.length > 0 && (
            <ul className="mt-3 space-y-1">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  siteConfigAuthor={siteConfigAuthor}
                  siteConfigLogo={siteConfigLogo}
                  parentAuthorName={displayName}
                />
              ))}
            </ul>
          )}
        </div>
      </article>
    </li>
  )
}

