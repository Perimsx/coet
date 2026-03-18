'use client'

import { useEffect, useState } from 'react'
import { toast } from '@/shared/hooks/use-toast'
import { Globe, ThumbsUp, MessageSquareReply, BadgeCheck } from 'lucide-react' // 评论项所需图标
import CommentMarkdown from '@/features/comments/components/comment-markdown'
import CommentForm from '@/features/comments/components/comment-form'
import {
  formatClientLocation,
  getBrowserIconHtml,
  getOsIconHtml,
  hasKnownClientValue,
} from '@/features/comments/lib/comment-client-display'
import { toProxiedImageSrc } from '@/shared/utils/image-proxy'
import { likeCommentAction } from '@/app/actions/comments'

// 简化后的客户端可用类型
export type CommentData = {
  id: number
  postId: string
  parentId: number | null
  qq: string | null
  avatar: string | null
  authorName: string
  content: string
  isAdmin: boolean
  likes: number
  ipAddress?: string | null
  location: string | null
  userAgent?: string | null
  browser: string | null
  os: string | null
  createdAt: Date
  replies: CommentData[]
}

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
  dictionary: any
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
  dictionary,
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

  return (
    <li className={isReply ? 'mt-3' : 'py-5 border-b border-border/40 last:border-0'}>
      <article className={`group relative flex items-start ${isReply ? 'gap-1.5 sm:gap-2.5' : 'gap-2.5 sm:gap-3'}`}>
        {/* 头像区域 */}
        <div className="flex shrink-0 flex-col items-center">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={`${displayName} avatar`}
              width={isReply ? 32 : 40}
              height={isReply ? 32 : 40}
              referrerPolicy="strict-origin-when-cross-origin"
              className={`border-border/50 shrink-0 rounded-full border object-cover ${isReply ? 'h-7 w-7 sm:h-8 sm:w-8 mt-1' : 'h-9 w-9 sm:h-10 sm:w-10 mt-0.5'}`}
            />
          ) : (
            <div className={`bg-muted text-foreground shrink-0 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-semibold ${isReply ? 'h-7 w-7 sm:h-8 sm:w-8 mt-1' : 'h-9 w-9 sm:h-10 sm:w-10 mt-0.5'}`}>
              {getInitials(displayName)}
            </div>
          )}
          {comment.replies.length > 0 && !isReply && (
            <div className="bg-border/30 mt-2 w-px flex-1"></div>
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
                className={`text-[15px] font-semibold text-gray-900 dark:text-gray-100 ${comment.qq ? 'cursor-copy hover:text-blue-500 transition-colors' : 'cursor-default'}`}
                title={comment.qq ? '点击复制 QQ' : undefined}
              >
                {displayName}
              </button>
              {isOwner && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600 border border-blue-100 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/20 shadow-sm shadow-blue-500/5 select-none cursor-default transition-all hover:bg-blue-100/50 dark:hover:bg-blue-500/20">
                  <BadgeCheck
                    className="w-3.5 h-3.5 fill-blue-600 text-white dark:fill-blue-400 dark:text-blue-950"
                    strokeWidth={2.5}
                  />
                  <span className="leading-none">站长</span>
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
            <div className="flex items-center gap-4 hidden sm:flex opacity-60 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                className={`inline-flex items-center gap-1 transition-colors ${
                  isLiked ? 'text-blue-500 opacity-100' : 'text-muted-foreground hover:text-blue-500'
                }`}
                onClick={handleLike}
                disabled={isLiked}
                title="点赞"
              >
                <ThumbsUp className="h-[18px] w-[18px]" strokeWidth={2} />
                {likesCount > 0 && <span className="text-[13px]">{likesCount}</span>}
              </button>
              
              <button
                type="button"
                className="text-muted-foreground hover:text-blue-500 inline-flex items-center transition-colors"
                onClick={() => setIsReplying(!isReplying)}
                title="回复"
              >
                <MessageSquareReply className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
            </div>
            
            <div className="flex sm:hidden items-center gap-4 text-muted-foreground">
              <button
                type="button"
                className={`inline-flex items-center gap-1 transition-colors ${
                  isLiked ? 'text-blue-500' : 'hover:text-blue-500'
                }`}
                onClick={handleLike}
                disabled={isLiked}
              >
                <ThumbsUp className="h-[16px] w-[16px]" />
                {likesCount > 0 && <span className="text-xs">{likesCount}</span>}
              </button>
              <button
                type="button"
                onClick={() => setIsReplying(!isReplying)}
                className="hover:text-blue-500"
              >
                <MessageSquareReply className="h-[16px] w-[16px]" />
              </button>
            </div>
          </div>

          {/* 评论正文 */}
          <CommentMarkdown content={comment.content} className="mt-1.5 text-sm sm:text-[15px] text-foreground/90 leading-relaxed overflow-hidden break-words" />

          {/* 元信息页脚 */}
          {metaItems.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 sm:gap-3">
              {metaItems.map((meta) => (
                <span
                  key={`${comment.id}-meta-${meta.key}`}
                  className="text-muted-foreground inline-flex items-center gap-1 text-[12px] opacity-70"
                >
                  {meta.type === 'location' ? (
                    <Globe className="h-[14px] w-[14px] shrink-0" />
                  ) : (
                    <span
                      className="inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center overflow-visible leading-none"
                      dangerouslySetInnerHTML={{ __html: meta.iconHtml ?? '' }}
                    />
                  )}
                  {meta.type === 'location' ? (
                    <span>{meta.value}</span>
                  ) : (
                    <>
                      <span className="sm:hidden max-w-[80px] truncate">{stripClientVersionLabel(meta.value)}</span>
                      <span className="hidden sm:inline">{meta.value}</span>
                    </>
                  )}
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
                  dictionary={dictionary}
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

