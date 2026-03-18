'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { toast } from '@/shared/hooks/use-toast'
import { applyFriendAction } from '@/features/friends/lib/actions'
import { toProxiedImageSrc } from '@/shared/utils/image-proxy'
import { Link2 } from 'lucide-react'


export default function ApplyFriendForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    avatar: '',
    description: '',
    qq: '',
  })

  // Derive Avatar URL logic
  const avatarUrl = useMemo(() => {
    if (formData.avatar && !/^\d{5,12}$/.test(formData.avatar)) {
      return formData.avatar
    }
    const qqObj = /^\d{5,12}$/.test(formData.avatar) ? formData.avatar : formData.qq
    if (qqObj && /^\d{5,12}$/.test(qqObj)) {
      return `https://q1.qlogo.cn/g?b=qq&nk=${qqObj}&s=100`
    }
    return formData.avatar || ''
  }, [formData.avatar, formData.qq])

  const proxiedAvatarUrl = useMemo(() => toProxiedImageSrc(avatarUrl), [avatarUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.url) {
      toast('网站名称和链接为必填项', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      await applyFriendAction({
        ...formData,
        avatar: avatarUrl // Save the resolved URL
      })
      toast('申请已提交！审核通过后将展示在此页面。', 'success')
      setFormData({ name: '', url: '', avatar: '', description: '', qq: '' })
    } catch (e: any) {
      toast(e.message || '提交失败，请稍后重试', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-2 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-start gap-2">
          {proxiedAvatarUrl ? (
            <img
              src={proxiedAvatarUrl}
              alt="Avatar preview"
              width={40}
              height={40}
              className="border-border/70 mt-px h-10 w-10 shrink-0 rounded-full border object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.removeAttribute('style')
              }}
            />
          ) : null}
          <div className="bg-muted text-muted-foreground mt-px flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-medium" style={{ display: proxiedAvatarUrl ? 'none' : 'flex' }}>
            <Link2 className="h-4 w-4" />
          </div>

          <div className="grid w-full gap-2 md:grid-cols-2">
            <div className="border-border/70 bg-background/85 flex h-9 items-center overflow-hidden rounded-md border">
              <Label
                htmlFor="friend-name"
                className="border-border/70 bg-muted/35 flex h-full shrink-0 items-center border-r px-3 text-sm font-medium"
              >
                名称 *
              </Label>
              <Input
                id="friend-name"
                name="name"
                maxLength={40}
                required
                placeholder="例如：张三的博客"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                className="h-9 rounded-none border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="border-border/70 bg-background/85 flex h-9 items-center overflow-hidden rounded-md border">
              <Label
                htmlFor="friend-url"
                className="border-border/70 bg-muted/35 flex h-full shrink-0 items-center border-r px-3 text-sm font-medium"
              >
                链接 *
              </Label>
              <Input
                id="friend-url"
                name="url"
                type="url"
                required
                placeholder="https://"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                disabled={isSubmitting}
                className="h-9 rounded-none border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="border-border/70 bg-background/85 flex h-9 items-center overflow-hidden rounded-md border">
              <Label
                htmlFor="friend-qq"
                className="border-border/70 bg-muted/35 flex h-full shrink-0 items-center border-r px-3 text-sm font-medium"
              >
                QQ号 *
              </Label>
              <Input
                id="friend-qq"
                name="qq"
                required
                pattern="[1-9][0-9]{4,11}"
                title="请输入正确的QQ号"
                placeholder="接收通知用的QQ号"
                value={formData.qq}
                onChange={(e) => setFormData({ ...formData, qq: e.target.value })}
                disabled={isSubmitting}
                className="h-9 rounded-none border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="border-border/70 bg-background/85 flex h-9 items-center overflow-hidden rounded-md border">
              <Label
                htmlFor="friend-avatar"
                className="border-border/70 bg-muted/35 flex h-full shrink-0 items-center border-r px-3 text-sm font-medium"
              >
                头 像
              </Label>
              <Input
                id="friend-avatar"
                name="avatar"
                placeholder="不填则使用QQ头像"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                disabled={isSubmitting}
                className="h-9 rounded-none border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>

        <div className="border-border/70 bg-background/85 md:ml-12 rounded-md border">
          <Label htmlFor="friend-description" className="sr-only">
            网站简介
          </Label>
          <Textarea
            id="friend-description"
            name="description"
            maxLength={200}
            value={formData.description}
            placeholder="网站简介 (选填)"
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isSubmitting}
            className="min-h-[80px] rounded-none border-0 bg-transparent px-3 py-2.5 text-sm leading-6 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
          />

          <div className="text-muted-foreground border-border/70 flex items-center justify-between border-t px-2.5 py-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
                <span className="text-xs">提交后需经后台审核</span>
            </div>

            <div className="flex items-center gap-2">
              <span>{Math.max(0, formData.description?.length || 0)}/200</span>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-8 rounded-md px-3 text-xs font-semibold"
              >
                {isSubmitting ? '提交中...' : '提交申请'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
