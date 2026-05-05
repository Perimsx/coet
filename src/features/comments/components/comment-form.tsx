'use client'
import { formatLocationToChinese } from '@/features/comments/lib/location-formatter'

import Image from '@/features/content/components/Image'
import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { Smile } from 'lucide-react' // 仅保留表情图标
import { toast } from '@/shared/hooks/use-toast'
import { submitCommentAction, type SubmitCommentState } from '@/app/actions/comments'
import CommentMarkdown from '@/features/comments/components/comment-markdown'
import { getNavLanguage } from '@/features/site/lib/nav-language'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { toProxiedImageSrc } from '@/shared/utils/image-proxy'

const initialState: SubmitCommentState = {}
const COMMENT_EMOJI_OPTIONS = [
  { label: 'grinning', codePoint: 0x1f600 },
  { label: 'smile', codePoint: 0x1f604 },
  { label: 'laugh', codePoint: 0x1f606 },
  { label: 'rolling-laugh', codePoint: 0x1f923 },
  { label: 'blush', codePoint: 0x1f60a },
  { label: 'wink', codePoint: 0x1f609 },
  { label: 'relieved', codePoint: 0x1f60c },
  { label: 'sunglasses', codePoint: 0x1f60e },
  { label: 'thinking', codePoint: 0x1f914 },
  { label: 'zany', codePoint: 0x1f92a },
  { label: 'star-struck', codePoint: 0x1f929 },
  { label: 'heart-eyes', codePoint: 0x1f60d },
  { label: 'kissing', codePoint: 0x1f618 },
  { label: 'hug', codePoint: 0x1f917 },
  { label: 'yum', codePoint: 0x1f60b },
  { label: 'sleepy', codePoint: 0x1f62a },
  { label: 'mask', codePoint: 0x1f637 },
  { label: 'neutral', codePoint: 0x1f610 },
  { label: 'sad', codePoint: 0x1f622 },
  { label: 'sob', codePoint: 0x1f62d },
  { label: 'angry', codePoint: 0x1f620 },
  { label: 'mind-blown', codePoint: 0x1f92f },
  { label: 'scream', codePoint: 0x1f631 },
  { label: 'poop', codePoint: 0x1f4a9 },
  { label: 'ghost', codePoint: 0x1f47b },
  { label: 'robot', codePoint: 0x1f916 },
  { label: 'skull', codePoint: 0x1f480 },
  { label: 'fire', codePoint: 0x1f525 },
  { label: 'party', codePoint: 0x1f389 },
  { label: 'balloon', codePoint: 0x1f388 },
  { label: 'gift', codePoint: 0x1f381 },
  { label: 'trophy', codePoint: 0x1f3c6 },
  { label: 'thumbs-up', codePoint: 0x1f44d },
  { label: 'thumbs-down', codePoint: 0x1f44e },
  { label: 'ok-hand', codePoint: 0x1f44c },
  { label: 'victory', codePoint: 0x270c },
  { label: 'raised-hands', codePoint: 0x1f64c },
  { label: 'clap', codePoint: 0x1f44f },
  { label: 'muscle', codePoint: 0x1f4aa },
  { label: 'wave', codePoint: 0x1f44b },
  { label: 'pray', codePoint: 0x1f64f },
  { label: 'heart', codePoint: 2764 },
  { label: 'broken-heart', codePoint: 0x1f494 },
  { label: '100', codePoint: 0x1f4af },
  { label: 'check', codePoint: 0x2705 },
  { label: 'cross', codePoint: 0x274c },
  { label: 'question', codePoint: 0x2753 },
  { label: 'lightbulb', codePoint: 0x1f4a1 },
  { label: 'book', codePoint: 0x1f4d6 },
  { label: 'keyboard', codePoint: 2328 },
  { label: 'rocket', codePoint: 0x1f680 },
  { label: 'sparkles', codePoint: 0x2728 },
  { label: 'star', codePoint: 0x2b50 },
  { label: 'moon', codePoint: 0x1f319 },
  { label: 'sun', codePoint: 0x2600 },
  { label: 'coffee', codePoint: 0x2615 },
  { label: 'pizza', codePoint: 0x1f355 },
  { label: 'beer', codePoint: 0x1f37a },
] as const

type ClientMetaDraft = {
  ipAddress: string
  location: string
  userAgent: string
  browser: string
  os: string
}

function normalizeClientText(value: unknown, maxLength = 128) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function detectBrowserFromUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()

  if (ua.includes('micromessenger')) return 'WeChat'
  if (ua.includes('weibo')) return 'Weibo'
  if (ua.includes('qqbrowser') || ua.includes('mqqbrowser')) return 'QQ Browser'
  if (ua.includes('qq/') && !ua.includes('qqbrowser')) return 'QQ'
  if (ua.includes('baidubrowser') || ua.includes('bidubrowser')) return 'Baidu Browser'
  if (ua.includes('qhbrowser') || ua.includes('360se') || ua.includes('360ee')) return '360 Browser'
  if (ua.includes('vivaldi')) return 'Vivaldi'
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera'
  if (ua.includes('edg/') || ua.includes('edge/')) return 'Edge'
  if (ua.includes('firefox/') || ua.includes('fxios/')) return 'Firefox'
  if (ua.includes('msie') || ua.includes('trident/')) return 'Internet Explorer'
  if (ua.includes('chrome/') || ua.includes('crios/')) return 'Chrome'
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari'

  return ''
}

function detectOsFromUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()

  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('android') || ua.includes('harmony')) return 'Android'
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod') || ua.includes('ios')) {
    return 'iOS'
  }
  if (ua.includes('mac os') || ua.includes('macintosh')) return 'macOS'
  if (ua.includes('linux')) return 'Linux'
  if (ua.includes('cros')) return 'ChromeOS'

  return ''
}

async function fetchPublicClientMeta() {
  const primary = await fetch('https://ipapi.co/json/', {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  })

  if (primary.ok) {
    const payload = (await primary.json()) as {
      ip?: string
      city?: string
      region?: string
      country_name?: string
      country?: string
    }
    const location = formatLocationToChinese(payload.country || payload.country_name || null, payload.region || null)

    return {
      ipAddress: normalizeClientText(payload.ip, 96),
      location,
    }
  }

  const secondary = await fetch('https://ipwho.is/', {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  })

  if (!secondary.ok) {
    return {
      ipAddress: '',
      location: '',
    }
  }

  const payload = (await secondary.json()) as {
    success?: boolean
    ip?: string
    city?: string
    region?: string
    country?: string
    country_code?: string
  }

  if (payload.success === false) {
    return {
      ipAddress: '',
      location: '',
    }
  }

  const location = formatLocationToChinese(payload.country_code || null, payload.region || null)

  return {
    ipAddress: normalizeClientText(payload.ip, 96),
    location,
  }
}

export default function CommentForm({
  postId,
  parentId,
  onCancel,
}: {
  postId: string
  parentId?: number
  onCancel?: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiToggleRef = useRef<HTMLButtonElement>(null)
  const emojiPanelRef = useRef<HTMLDivElement>(null)
  const [state, formAction, pending] = useActionState(submitCommentAction, initialState)
  const [qq, setQq] = useState('')
  const [content, setContent] = useState('')
  const [contentLength, setContentLength] = useState(0)
  const [preview, setPreview] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [clientMeta, setClientMeta] = useState<ClientMetaDraft>({
    ipAddress: '',
    location: '',
    userAgent: '',
    browser: '',
    os: '',
  })
  const { dictionary } = getNavLanguage()

  const avatarUrl = useMemo(() => {
    if (!/^\d{5,12}$/.test(qq)) return ''
    return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100`
  }, [qq])
  const proxiedAvatarUrl = useMemo(() => toProxiedImageSrc(avatarUrl), [avatarUrl])

  useEffect(() => {
    if (state?.error) {
      toast(state.error, 'error')
      return
    }

    if (state?.success) {
      toast(state.message ?? dictionary.comments.submitSuccess, 'success')
      formRef.current?.reset()
      setQq('')
      setContent('')
      setContentLength(0)
      setPreview(false)
      setEmojiOpen(false)
      if (onCancel) onCancel()
    }
  }, [dictionary.comments.submitSuccess, state, onCancel])

  useEffect(() => {
    let cancelled = false
    const userAgent = normalizeClientText(globalThis.navigator?.userAgent || '', 512)
    const browser = detectBrowserFromUserAgent(userAgent)
    const os = detectOsFromUserAgent(userAgent)

    setClientMeta((current) => ({
      ...current,
      userAgent,
      browser: browser || current.browser,
      os: os || current.os,
    }))

    async function loadPublicMeta() {
      try {
        const remoteMeta = await fetchPublicClientMeta()
        if (cancelled) return
        setClientMeta((current) => ({
          ...current,
          ipAddress: remoteMeta.ipAddress || current.ipAddress,
          location: remoteMeta.location || current.location,
        }))
      } catch {
      }
    }

    loadPublicMeta()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!emojiOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (emojiPanelRef.current?.contains(target)) return
      if (emojiToggleRef.current?.contains(target)) return
      setEmojiOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [emojiOpen])

  const insertMarkdown = (prefix: string, suffix = '', placeholder = '') => {
    const textarea = textareaRef.current

    if (!textarea) {
      const nextContent = `${content}${prefix}${placeholder}${suffix}`
      setContent(nextContent)
      setContentLength(nextContent.length)
      return
    }

    const start = textarea.selectionStart ?? content.length
    const end = textarea.selectionEnd ?? content.length
    const selected = content.slice(start, end)
    const body = selected || placeholder
    const nextContent = `${content.slice(0, start)}${prefix}${body}${suffix}${content.slice(end)}`

    setContent(nextContent)
    setContentLength(nextContent.length)

    requestAnimationFrame(() => {
      textarea.focus()

      if (!selected && placeholder) {
        const selectStart = start + prefix.length
        const selectEnd = selectStart + placeholder.length
        textarea.setSelectionRange(selectStart, selectEnd)
        return
      }

      const cursor = start + prefix.length + body.length + suffix.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-1.5">
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <input type="hidden" name="clientIpAddress" value={clientMeta.ipAddress} />
      <input type="hidden" name="clientLocation" value={clientMeta.location} />
      <input type="hidden" name="clientUserAgent" value={clientMeta.userAgent} />
      <input type="hidden" name="clientBrowser" value={clientMeta.browser} />
      <input type="hidden" name="clientOs" value={clientMeta.os} />

      <div className="flex items-start gap-3">
        {/* 左侧头像预览 */}
        <div className="hidden sm:block">
          {proxiedAvatarUrl ? (
            <div className="relative group/avatar">
              <Image
                src={proxiedAvatarUrl}
                alt={dictionary.comments.avatarPreviewAlt}
                width={44}
                height={44}
                className="h-11 w-11 rounded-2xl border border-zinc-200/50 bg-white object-cover shadow-sm transition-transform group-hover/avatar:scale-105 dark:border-white/10 dark:bg-zinc-800"
              />
              <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-950">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-zinc-900/50">
              <Smile className="h-5.5 w-5.5 opacity-40" />
            </div>
          )}
        </div>

        {/* 右侧输入区 */}
        <div className="flex-1 space-y-2.5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-xl border border-zinc-200/50 bg-white/40 backdrop-blur-md transition-all focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary/5 dark:border-white/10 dark:bg-zinc-900/40 dark:focus-within:border-primary/40 dark:focus-within:bg-zinc-900">
              <Input
                id={`author-${postId}`}
                name="nickname"
                maxLength={40}
                required
                placeholder={dictionary.comments.nicknamePlaceholder}
                className="h-10 border-none bg-transparent pl-9 text-sm shadow-none focus-visible:ring-0"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-zinc-200/50 bg-white/40 backdrop-blur-md transition-all focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary/5 dark:border-white/10 dark:bg-zinc-900/40 dark:focus-within:border-primary/40 dark:focus-within:bg-zinc-900">
              <Input
                id={`qq-${postId}`}
                name="qq"
                inputMode="numeric"
                pattern="[0-9]{5,12}"
                minLength={5}
                maxLength={12}
                required
                placeholder={dictionary.comments.qqPlaceholder}
                value={qq}
                onChange={(event) => setQq(event.target.value.replace(/[^\d]/g, ''))}
                className="h-10 border-none bg-transparent pl-9 text-sm shadow-none focus-visible:ring-0"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">QQ</div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/40 shadow-sm backdrop-blur-md transition-all focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary/5 dark:border-white/10 dark:bg-zinc-900/40 dark:focus-within:border-primary/40 dark:focus-within:bg-zinc-900">
            <Label htmlFor={`content-${postId}`} className="sr-only">
              {dictionary.comments.contentLabel}
            </Label>
            {preview ? (
              <div className="min-h-[100px] px-3.5 py-2.5">
                <CommentMarkdown
                  content={content || dictionary.comments.contentPlaceholder}
                  className={content ? 'text-[15px]' : 'text-zinc-400 opacity-70'}
                />
              </div>
            ) : (
              <Textarea
                ref={textareaRef}
                id={`content-${postId}`}
                name="content"
                maxLength={1000}
                required
                value={content}
                placeholder={dictionary.comments.contentPlaceholder}
                onChange={(event) => {
                  const value = event.target.value
                  setContent(value)
                  setContentLength(value.length)
                }}
                className="min-h-[100px] w-full resize-none rounded-none border-0 bg-transparent px-3.5 py-2.5 text-[15px] leading-relaxed shadow-none focus-visible:ring-0"
              />
            )}

            <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-3 py-1.5 dark:border-white/5 dark:bg-white/5">
              <div className="flex items-center gap-1">
                <div className="relative">
                  <button
                    ref={emojiToggleRef}
                    type="button"
                    onClick={() => setEmojiOpen((current) => !current)}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-primary dark:hover:bg-white/10"
                  >
                    <Smile className="h-4.5 w-4.5" />
                  </button>
                  {emojiOpen && (
                    <div
                      ref={emojiPanelRef}
                      className="absolute bottom-full left-0 z-50 mb-2 grid w-[280px] grid-cols-7 gap-1 rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-zinc-900 sm:w-[320px] sm:grid-cols-8"
                    >
                      {COMMENT_EMOJI_OPTIONS.map((item) => {
                        const emoji = String.fromCodePoint(item.codePoint)
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                              insertMarkdown(`${emoji} `)
                              setEmojiOpen(false)
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-all hover:bg-zinc-100 hover:scale-110 dark:hover:bg-white/5"
                          >
                            {emoji}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPreview((current) => !current)}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-primary dark:hover:bg-white/10"
                >
                  {preview ? dictionary.common.edit : dictionary.common.preview}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden text-[10px] font-bold tabular-nums text-zinc-400 sm:block">
                  {contentLength} / 1000
                </span>
                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="h-7.5 rounded-lg px-3 text-[11px] font-bold"
                  >
                    {dictionary.common.cancel}
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={pending}
                  className="h-7.5 rounded-lg border border-primary/20 bg-primary px-4 text-[11px] font-bold text-white transition-all hover:bg-primary/90 active:scale-[0.98] dark:border-white/10"
                >
                  {pending ? dictionary.comments.submitting : dictionary.comments.submit}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
