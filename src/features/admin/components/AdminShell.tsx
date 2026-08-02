'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Button, Dropdown, Layout, Menu, Message, Space, Spin, Typography } from '@arco-design/web-react'
import { IconBook, IconDashboard, IconFile, IconLink, IconMenuFold, IconMenuUnfold, IconSafe, IconSettings, IconStorage, IconTags } from '@arco-design/web-react/icon'
import { cmsApi, CMSApiError, setCSRFToken } from '@/features/admin/lib/api'

const { Sider, Header, Content } = Layout

const navigation = [
  { key: '/admin/dashboard', label: '仪表盘', icon: <IconDashboard /> },
  { key: 'content', label: '内容管理', icon: <IconBook />, children: [
    { key: '/admin/content/posts', label: '文章' },
    { key: '/admin/content/pages', label: '独立页面' },
    { key: '/admin/content/categories', label: '分类' },
    { key: '/admin/content/tags', label: '标签' },
  ] },
  { key: 'site', label: '站点管理', icon: <IconSettings />, children: [
    { key: '/admin/site/settings', label: '站点设置' },
    { key: '/admin/site/navigation', label: '导航菜单' },
    { key: '/admin/site/friends', label: '友链' },
  ] },
  { key: 'system', label: '系统管理', icon: <IconStorage />, children: [
    { key: '/admin/system/health', label: '系统状态' },
    { key: '/admin/system/git', label: '代码更新' },
    { key: '/admin/system/backups', label: '数据库备份' },
    { key: '/admin/system/jobs', label: '后台任务' },
    { key: '/admin/system/logs', label: '操作日志' },
  ] },
]

function menuNodes(items: typeof navigation) {
  return items.map((item) => item.children ? (
    <Menu.SubMenu key={item.key} title={<>{item.icon}{item.label}</>}>
      {item.children.map(child => <Menu.Item key={child.key}><Link href={child.key}>{child.label}</Link></Menu.Item>)}
    </Menu.SubMenu>
  ) : <Menu.Item key={item.key}><Link href={item.key}>{item.icon}{item.label}</Link></Menu.Item>)
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    cmsApi.session().then((session) => setCSRFToken(session.csrfToken)).catch((error) => {
      if (error instanceof CMSApiError && error.code === 40101) router.replace('/admin/login')
      else Message.error('无法连接 CMS API，请确认 Go 服务已启动。')
    }).finally(() => setChecking(false))
  }, [router])

  const selectedKeys = useMemo(() => [pathname], [pathname])
  const logout = async () => { try { await cmsApi.logout(); router.replace('/admin/login') } catch { Message.error('退出登录失败') } }
  if (checking) return <div className="cot-admin-login"><Spin size={32} tip="正在验证管理员会话" /></div>

  return <Layout className="cot-admin-shell">
    <Sider width={240} collapsed={collapsed} collapsible={false} className="cot-admin-sider">
      <div className="cot-admin-brand" aria-label="COT CMS 管理后台">
        <span className="cot-admin-brand-mark">COT</span>{!collapsed && <span>CMS 控制台</span>}
      </div>
      <Menu selectedKeys={selectedKeys} defaultOpenKeys={['content', 'site', 'system']} style={{ borderRight: 0 }}>
        {menuNodes(navigation)}
      </Menu>
    </Sider>
    <Layout>
      <Header className="cot-admin-header">
        <Space>
          <Button type="text" icon={collapsed ? <IconMenuUnfold /> : <IconMenuFold />} aria-label={collapsed ? '展开导航' : '收起导航'} onClick={() => setCollapsed(value => !value)} />
          <Typography.Text type="secondary">单用户内容工作台</Typography.Text>
        </Space>
        <Dropdown droplist={<Menu><Menu.Item key="logout" onClick={logout}><IconSafe />退出登录</Menu.Item></Menu>} position="br">
          <Button type="text"><Space><IconTags />管理员</Space></Button>
        </Dropdown>
      </Header>
      <Content><main className="cot-admin-main">{children}</main></Content>
    </Layout>
  </Layout>
}
