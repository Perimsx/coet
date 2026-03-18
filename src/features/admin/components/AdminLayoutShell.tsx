"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import type { MenuProps } from "antd"
import {
  AppstoreOutlined,
  CommentOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LayoutOutlined,
  LinkOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  ReadOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons"
import {
  Breadcrumb,
  Button,
  Divider,
  Drawer,
  Dropdown,
  Layout,
  Menu,
  Space,
  Typography,
} from "antd"

import { logoutAction } from "@/app/admin/actions"
import ThemeToggle from "@/features/admin/components/ThemeToggle"

const { Header, Sider, Content } = Layout
const { Text } = Typography

type NavLabels = {
  navPosts?: string
  navComments?: string
  about?: string
}

const rootMenuKeys = ["content", "site"] as const

function resolveSelectedKey(pathname: string) {
  if (pathname.startsWith("/admin/posts")) return "posts"
  if (pathname.startsWith("/admin/comments")) return "comments"
  if (pathname.startsWith("/admin/suggestions")) return "suggestions"
  if (pathname.startsWith("/admin/friends")) return "friends"
  if (pathname.startsWith("/admin/about")) return "about"
  if (pathname.startsWith("/admin/settings")) return "settings"
  return "dashboard"
}

function resolveOpenKeys(selectedKey: string) {
  if (["posts", "comments", "suggestions"].includes(selectedKey)) return ["content"]
  if (["friends", "about", "settings"].includes(selectedKey)) return ["site"]
  return []
}

function resolvePageTitle(selectedKey: string, labels: NavLabels) {
  switch (selectedKey) {
    case "posts":
      return labels.navPosts || "文章管理"
    case "comments":
      return labels.navComments || "评论管理"
    case "suggestions":
      return "建议管理"
    case "friends":
      return "友链管理"
    case "about":
      return labels.about || "关于页面"
    case "settings":
      return "站点设置"
    default:
      return "仪表盘"
  }
}

function resolveBreadcrumbs(pathname: string, selectedKey: string, labels: NavLabels) {
  const base = [{ title: <Link href="/admin">仪表盘</Link> }]

  if (selectedKey === "dashboard") return base

  if (["posts", "comments", "suggestions"].includes(selectedKey)) {
    const label =
      selectedKey === "posts"
        ? labels.navPosts || "文章管理"
        : selectedKey === "comments"
          ? labels.navComments || "评论管理"
          : "建议管理"
    const items = [...base, { title: "内容管理" }, { title: label }]
    if (pathname.includes("/edit")) items.push({ title: "编辑" })
    return items
  }

  if (["friends", "about", "settings"].includes(selectedKey)) {
    const label =
      selectedKey === "friends"
        ? "友链管理"
        : selectedKey === "about"
          ? labels.about || "关于页面"
          : "站点设置"
    return [...base, { title: "站点管理" }, { title: label }]
  }

  return base
}

export function AdminLayoutShell({
  children,
  username,
  siteTitle,
  navLabels = {},
}: {
  children: React.ReactNode
  username: string
  siteTitle: string
  navLabels?: NavLabels
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const selectedKey = useMemo(() => resolveSelectedKey(pathname), [pathname])
  const defaultOpenKeys = useMemo(() => resolveOpenKeys(selectedKey), [selectedKey])
  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKeys)

  useEffect(() => {
    if (!collapsed) {
      setOpenKeys(defaultOpenKeys)
    }
  }, [collapsed, defaultOpenKeys])

  const menuItems = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "dashboard",
        icon: <LayoutOutlined />,
        label: <Link href="/admin">仪表盘</Link>,
      },
      {
        key: "content",
        icon: <AppstoreOutlined />,
        label: "内容管理",
        children: [
          {
            key: "posts",
            icon: <FileTextOutlined />,
            label: <Link href="/admin/posts">{navLabels.navPosts || "文章管理"}</Link>,
          },
          {
            key: "comments",
            icon: <CommentOutlined />,
            label: (
              <Link href="/admin/comments">
                {navLabels.navComments || "评论管理"}
              </Link>
            ),
          },
          {
            key: "suggestions",
            icon: <MessageOutlined />,
            label: <Link href="/admin/suggestions">建议管理</Link>,
          },
        ],
      },
      {
        key: "site",
        icon: <SettingOutlined />,
        label: "站点管理",
        children: [
          {
            key: "about",
            icon: <InfoCircleOutlined />,
            label: <Link href="/admin/about">{navLabels.about || "关于页面"}</Link>,
          },
          {
            key: "friends",
            icon: <LinkOutlined />,
            label: <Link href="/admin/friends">友链管理</Link>,
          },
          {
            key: "settings",
            icon: <SettingOutlined />,
            label: <Link href="/admin/settings">站点设置</Link>,
          },
        ],
      },
    ],
    [navLabels],
  )

  const pageTitle = useMemo(
    () => resolvePageTitle(selectedKey, navLabels),
    [navLabels, selectedKey],
  )
  const breadcrumbItems = useMemo(
    () => resolveBreadcrumbs(pathname, selectedKey, navLabels),
    [navLabels, pathname, selectedKey],
  )

  const handleOpenChange: MenuProps["onOpenChange"] = (keys) => {
    const latest = keys.find((key) => !openKeys.includes(key))
    if (!latest || !rootMenuKeys.includes(latest as (typeof rootMenuKeys)[number])) {
      setOpenKeys(keys as string[])
      return
    }
    setOpenKeys(latest ? [latest] : [])
  }

  const accountMenu: MenuProps["items"] = [
    {
      key: "user",
      label: <span>{username}</span>,
      icon: <UserOutlined />,
      disabled: true,
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: (
        <form action={logoutAction}>
          <button type="submit" className="admin-logout-button">
            退出登录
          </button>
        </form>
      ),
    },
  ]

  const quickActions = [
    {
      key: "new-post",
      label: "新建文章",
      href: "/admin/posts/edit?new=1",
      type: "primary" as const,
    },
    {
      key: "review-comments",
      label: "评论审核",
      href: "/admin/comments",
    },
  ]

  const menuNode = (
    <Menu
      mode="inline"
      items={menuItems}
      className="admin-shell-menu"
      selectedKeys={[selectedKey]}
      openKeys={collapsed ? [] : openKeys}
      onOpenChange={handleOpenChange}
    />
  )

  const brandNode = (
    <div className="admin-shell-brand">
      <Link href="/admin" className="admin-shell-brand-link">
        <span className="admin-shell-brand-logo" />
        <span className="admin-shell-brand-copy">
          <Text strong className="admin-shell-brand-title">
            {siteTitle}
          </Text>
          <Text type="secondary" className="admin-desktop-label">
            管理后台
          </Text>
        </span>
      </Link>
    </div>
  )

  return (
    <Layout className="admin-shell-layout">
      <Sider
        width={240}
        collapsedWidth={88}
        collapsed={collapsed}
        trigger={null}
        className="admin-shell-sider admin-shell-sider-desktop"
      >
        {brandNode}
        <div className="admin-shell-menu-wrap">{menuNode}</div>
        <div className="admin-shell-footer">
          <Button href="/" target="_blank" icon={<ReadOutlined />}>
            打开前台
          </Button>
        </div>
      </Sider>

      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        className="admin-shell-drawer"
        styles={{ body: { padding: 0 } }}
      >
        {brandNode}
        <div className="admin-shell-menu-wrap">{menuNode}</div>
        <div className="admin-shell-footer">
          <Button href="/" target="_blank" icon={<ReadOutlined />}>
            打开前台
          </Button>
        </div>
      </Drawer>

      <Layout>
        <Header className="admin-shell-header">
          <div className="admin-shell-header-left">
            <Button
              type="text"
              className="admin-icon-button admin-mobile-only"
              icon={<MenuUnfoldOutlined />}
              onClick={() => setDrawerOpen(true)}
            />
            <Button
              type="text"
              className="admin-icon-button admin-tablet-up-only"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((prev) => !prev)}
            />
            <div className="admin-shell-header-meta">
              <Text className="admin-shell-page-title">{pageTitle}</Text>
              <Breadcrumb items={breadcrumbItems} className="admin-shell-breadcrumb" />
            </div>
          </div>
          <Space size={10} wrap>
            <div className="admin-shell-quick-actions">
              {quickActions.map((action) => (
                <Button key={action.key} type={action.type} href={action.href}>
                  {action.label}
                </Button>
              ))}
            </div>
            <ThemeToggle />
            <Dropdown menu={{ items: accountMenu }} trigger={["click"]}>
              <Button className="admin-account-button" icon={<UserOutlined />}>
                <span className="admin-desktop-label">{username}</span>
              </Button>
            </Dropdown>
          </Space>
        </Header>
        <Content className="admin-shell-content">
          <div className="admin-shell-content-inner">{children}</div>
        </Content>
      </Layout>
    </Layout>
  )
}
