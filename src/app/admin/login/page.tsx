'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardBody, Input } from '@/components/ui/heroui-helpers'
import { ShieldCheck } from 'lucide-react'
import { cmsApi, CMSApiError, setCSRFToken } from '@/features/admin/lib/api'
import { toast } from '@/shared/hooks/use-toast'

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
    <div className="grid min-h-dvh place-items-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col gap-6 p-6 md:p-8">
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
            <Input label="管理员账号" isDisabled value="admin (超级管理员)" />
            <Input
              label="管理员密码"
              required
              type="password"
              placeholder="输入管理员密码"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" isLoading={loading} className="w-full font-semibold mt-2">
              登录控制台
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
