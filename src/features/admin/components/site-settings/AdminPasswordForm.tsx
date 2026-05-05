"use client"

import { useState, useTransition } from "react"
import { KeyRound, ShieldCheck } from "lucide-react"
import { toast } from '@/shared/hooks/use-toast'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/features/admin/components/admin-ui"
import { changeAdminPasswordAction, type ChangeAdminPasswordState } from "@/app/admin/actions"
import { ADMIN_LOGIN_PATH } from "@/features/admin/lib/routes"

export function AdminPasswordForm({ username }: { username: string }) {
  const [pending, startTransition] = useTransition()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = () => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set("currentPassword", currentPassword)
      formData.set("newPassword", newPassword)
      formData.set("confirmPassword", confirmPassword)

      const result = await changeAdminPasswordAction({} as ChangeAdminPasswordState, formData)
      if (result.error) {
        toast.error(result.error)
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success(result.success || "管理员密码已更新")
    })
  }

  return (
    <AdminPanel>
      <AdminPanelHeader
        title="管理员密码"
        description="仅修改隐藏后台入口的登录密码，不影响站点其它配置。"
      />
      <AdminPanelBody className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full bg-background">
            <ShieldCheck className="mr-1 size-3.5" />
            登录账号 {username}
          </Badge>
          <Badge variant="outline" className="rounded-full bg-background">
            <KeyRound className="mr-1 size-3.5" />
            登录入口 {ADMIN_LOGIN_PATH}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">当前密码</label>
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="请输入当前密码"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">新密码</label>
            <Input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="至少 6 位"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">确认新密码</label>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="再次输入新密码"
              className="h-10 rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" className="rounded-xl" disabled={pending} onClick={handleSubmit}>
            更新密码
          </Button>
        </div>
      </AdminPanelBody>
    </AdminPanel>
  )
}
