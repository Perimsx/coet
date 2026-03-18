'use client'
import { formatLocationToChinese } from '@/features/comments/lib/location-formatter'

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
  { label: 'heart', codePoint: 0x2764 },
  { label: 'broken-heart', codePoint: 0x1f494 },
  { label: '100', codePoint: 0x1f4af },
  { label: 'check', codePoint: 0x2705 },
  { label: 'cross', codePoint: 0x274c },
  { label: 'question', codePoint: 0x2753 },
  { label: 'lightbulb', codePoint: 0x1f4a1 },
  { label: 'book', codePoint: 0x1f4d6 },
  { label: 'keyboard', codePoint: 0x2328 },
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
        // Ignore network errors. Server headers still provide metadata on deployed environments.
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
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <input type="hidden" name="clientIpAddress" value={clientMeta.ipAddress} />
      <input type="hidden" name="clientLocation" value={clientMeta.location} />
      <input type="hidden" name="clientUserAgent" value={clientMeta.userAgent} />
      <input type="hidden" name="clientBrowser" value={clientMeta.browser} />
      <input type="hidden" name="clientOs" value={clientMeta.os} />

      <div className="flex items-start gap-2 sm:gap-3">
        {proxiedAvatarUrl ? (
          <img
            src={proxiedAvatarUrl}
            alt={dictionary.comments.avatarPreviewAlt}
            width={36}
            height={36}
            referrerPolicy="strict-origin-when-cross-origin"
            className="border-border/70 mt-0.5 h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full border object-cover"
          />
        ) : (
          <div className="bg-muted text-muted-foreground mt-0.5 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full text-[10px] sm:text-xs font-medium uppercase">
            QQ
          </div>
        )}

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="border-border/70 bg-background/85 flex h-9 sm:h-8 items-center overflow-hidden rounded-md border">
            <Label
              htmlFor={`author-${postId}`}
              className="border-border/70 bg-muted/35 flex h-full shrink-0 items-center border-r px-2 sm:px-2.5 text-[12px] sm:text-[13px] font-medium"
            >
              {dictionary.comments.nicknameLabel}
            </Label>
            <Input
              id={`author-${postId}`}
              name="nickname"
              maxLength={40}
              required
              placeholder={dictionary.comments.nicknamePlaceholder}
              className="h-full rounded-none border-0 bg-transparent px-2 sm:px-2.5 text-base sm:text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="border-border/70 bg-background/85 flex h-9 sm:h-8 items-center overflow-hidden rounded-md border">
            <Label
              htmlFor={`qq-${postId}`}
              className="border-border/70 bg-muted/35 flex h-full shrink-0 items-center border-r px-2 sm:px-2.5 text-[12px] sm:text-[13px] font-medium"
            >
              {dictionary.comments.qqLabel}
            </Label>
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
              className="h-full rounded-none border-0 bg-transparent px-2 sm:px-2.5 text-base sm:text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </div>

      <div className="border-border/70 bg-background/85 rounded-md border">
        <Label htmlFor={`content-${postId}`} className="sr-only">
          {dictionary.comments.contentLabel}
        </Label>
        {preview ? (
          <div className="min-h-[72px] px-2.5 py-2">
            <CommentMarkdown
              content={content || dictionary.comments.contentPlaceholder}
              className={content ? 'text-[13.5px] sm:text-sm' : 'text-muted-foreground opacity-75 text-[13.5px] sm:text-sm'}
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
            className="min-h-[72px] rounded-none border-0 bg-transparent px-2.5 py-2 text-base sm:text-sm leading-6 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        )}

        <div className="text-muted-foreground border-border/70 flex items-center justify-between border-t px-2 py-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                ref={emojiToggleRef}
                type="button"
                onClick={() => setEmojiOpen((current) => !current)}
                className="hover:bg-muted inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                title={dictionary.comments.emoji}
                aria-label={dictionary.comments.emoji}
                aria-expanded={emojiOpen}
              >
                <Smile className="h-4.5 w-4.5" />
              </button>
              {emojiOpen ? (
                <div
                  ref={emojiPanelRef}
                  className="border-border/70 bg-background absolute bottom-full left-0 z-20 mb-1 grid w-[260px] grid-cols-7 gap-1 rounded-md border p-1.5 shadow-sm sm:w-[360px] sm:grid-cols-8 sm:p-2"
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
                        className="hover:bg-muted inline-flex h-9 w-9 items-center justify-center rounded text-lg leading-none transition-colors"
                        title={item.label}
                        aria-label={item.label}
                      >
                        {emoji}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
            </div>

          <div className="flex flex-wrap items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="text-muted-foreground h-8 sm:h-7 rounded-md px-2.5 text-[11px] sm:text-[12px] font-medium hover:text-foreground"
              >
                取消
              </Button>
            )}
            <button
              type="button"
              onClick={() => setPreview((current) => !current)}
              className="hover:bg-muted rounded-md px-2 py-0.5 transition-colors text-[11px] sm:text-[12px]"
            >
              {preview ? dictionary.common.edit : dictionary.common.preview}
            </button>
            <span className="scale-90 opacity-80 tabular-nums">{contentLength}/1000</span>
            <Button
              type="submit"
              disabled={pending}
              className="h-8 sm:h-7 rounded-md px-4 sm:px-3 text-[11px] sm:text-[12px] font-semibold"
            >
              {pending ? dictionary.comments.submitting : dictionary.comments.submit}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
