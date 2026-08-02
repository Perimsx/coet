'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Input } from '@heroui/react'
import { Lock, User, ShieldCheck } from 'lucide-react'
import { cmsApi, CMSApiError, setCSRFToken } from '@/features/admin/lib/api'
import { toast } from '@/shared/hooks/use-toast'
import { CardBody } from '@/components/ui/heroui-helpers'

export default function AdminLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      toast.error('请输入管理员密码')
      return
    }

    try {
      setLoading(true)
      const session = await cmsApi.login(password)
      setCSRFToken(session.csrfToken)
      toast.success('验证成功，正在进入控制台')
      router.replace('/admin/dashboard')
    } catch (error) {
      if (error instanceof CMSApiError) toast.error(error.message)
      else toast.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid h-dvh place-items-center bg-gradient-to-br from-zinc-100 via-zinc-50 to-primary-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4">
      <Card className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl">
        <CardBody className="p-6 md:p-8 flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="p-3 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-2 text-zinc-900 dark:text-zinc-100">
              序栈 CMS
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              使用管理员密码进入离线与互动控制台
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input
              disabled
              placeholder="admin (超级管理员)"
              value="admin (超级管理员)"
            />
            <Input
              required
              type="password"
              placeholder="输入管理员密码"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full font-semibold mt-2">
              登录控制台
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
