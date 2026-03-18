"use client"

import { useTransition } from "react"
import { App, Alert, Button, Card, Col, Form, Input, Row, Space, Tag, Typography } from "antd"

import { changeAdminPasswordAction, type ChangeAdminPasswordState } from "@/app/admin/actions"
import { ADMIN_LOGIN_PATH } from "@/features/admin/lib/routes"

const { Text, Title } = Typography

/**
 * 管理员密码修改表单 (AdminPasswordForm)
 * 仅用于修改隐藏后台入口的登录密码。建议修复错误。
 */
export function AdminPasswordForm({ username }: { username: string }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [pending, startTransition] = useTransition()

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const formData = new FormData()
      formData.set("currentPassword", values.currentPassword)
      formData.set("newPassword", values.newPassword)
      formData.set("confirmPassword", values.confirmPassword)

      startTransition(async () => {
        const result = await changeAdminPasswordAction({} as ChangeAdminPasswordState, formData)
        if (result.error) {
          message.error(result.error)
          return
        }
        message.success(result.success || "密码已更新")
        form.resetFields()
      })
    } catch {
      // handled by antd form
    }
  }

  return (
    <Card className="admin-panel-card">
    <Space orientation="vertical" size={20} style={{ display: "flex" }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>
            管理员密码
          </Title>
          <Text type="secondary">只修改隐藏后台入口的登录密码，不会影响站点其他设置。</Text>
        </div>

        <Alert
          type="info"
          showIcon
          message={
            <Space wrap>
              <span>登录账号</span>
              <Tag color="blue">{username}</Tag>
              <span>登录入口</span>
              <Tag>{ADMIN_LOGIN_PATH}</Tag>
            </Space>
          }
        />

        <Form form={form} layout="vertical">
          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item
                label="当前密码"
                name="currentPassword"
                rules={[{ required: true, message: "请输入当前密码" }]}
              >
                <Input.Password autoComplete="current-password" placeholder="请输入当前密码" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="新密码"
                name="newPassword"
                rules={[
                  { required: true, message: "请输入新密码" },
                  { min: 6, message: "新密码至少 6 位" },
                ]}
              >
                <Input.Password autoComplete="new-password" placeholder="至少 6 位" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="确认新密码"
                name="confirmPassword"
                dependencies={["newPassword"]}
                rules={[
                  { required: true, message: "请再次输入新密码" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error("两次输入的密码不一致"))
                    },
                  }),
                ]}
              >
                <Input.Password autoComplete="new-password" placeholder="再次输入新密码" />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Space style={{ justifyContent: "flex-end", width: "100%" }}>
          <Button type="primary" onClick={handleSubmit} loading={pending}>
            更新密码
          </Button>
        </Space>
      </Space>
    </Card>
  )
}
