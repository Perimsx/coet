'use client'

import { useState } from 'react'
import { Button, Card, Form, Input, Message, Space, Typography } from '@arco-design/web-react'
import { IconLock, IconUser } from '@arco-design/web-react/icon'
import { useRouter } from 'next/navigation'
import { cmsApi, CMSApiError, setCSRFToken } from '@/features/admin/lib/api'

export default function AdminLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const submit = async () => {
    try {
      const values = await form.validate()
      setLoading(true)
      const session = await cmsApi.login(values.password)
      setCSRFToken(session.csrfToken)
      router.replace('/admin/dashboard')
    } catch (error) {
      if (error instanceof CMSApiError) Message.error(error.message)
    } finally { setLoading(false) }
  }
  return <div className="cot-admin-login">
    <Card className="cot-admin-login-card" bordered>
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <div>
          <Typography.Title heading={3} style={{ margin: 0 }}>COT CMS</Typography.Title>
          <Typography.Text type="secondary">使用管理员密码进入内容工作台</Typography.Text>
        </div>
        <Form form={form} layout="vertical" onSubmit={submit}>
          <Form.Item label="管理员" required><Input prefix={<IconUser />} defaultValue="admin" disabled /></Form.Item>
          <Form.Item field="password" label="管理员密码" rules={[{ required: true, message: '请输入管理员密码' }]} required>
            <Input.Password prefix={<IconLock />} placeholder="输入管理员密码" autoComplete="current-password" allowClear />
          </Form.Item>
          <Button type="primary" htmlType="submit" long loading={loading}>登录控制台</Button>
        </Form>
      </Space>
    </Card>
  </div>
}
