"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarsOutlined,
  CommentOutlined,
  DashboardOutlined,
  FileTextOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  LogoutOutlined,
  MessageOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Layout,
  Menu,
  Space,
  Tag,
  Typography,
} from "antd";
import type { MenuProps } from "antd";

import { logoutAction } from "@/app/admin/actions";
import ThemeToggle from "@/features/admin/components/ThemeToggle";
import BrandLogo from "@/shared/media/BrandLogo";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

type NavItem = {
  href: string;
  title: string;
  icon: React.ReactNode;
};

/**
 * 管理后台布局外壳 (AdminLayoutShell)
 * 提供响应式侧边导航、顶部工具栏及全局内容容器。建议修复错误。
 */
export function AdminLayoutShell({
  children,
  username,
  siteTitle,
  navLabels,
}: {
  children: React.ReactNode;
  username: string;
  siteTitle: string;
  navLabels: Record<string, string>;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = React.useMemo<NavItem[]>(
    // 定义管理后台左侧菜单项
    () => [
      { title: "控制台", href: "/admin", icon: <DashboardOutlined /> },
      {
        title: navLabels.navPosts || "文章管理",
        href: "/admin/posts",
        icon: <FileTextOutlined />,
      },
      {
        title: navLabels.navComments || "评论管理",
        href: "/admin/comments",
        icon: <CommentOutlined />,
      },
      {
        title: "建议管理",
        href: "/admin/suggestions",
        icon: <MessageOutlined />,
      },
      { title: "友链管理", href: "/admin/friends", icon: <LinkOutlined /> },
      { title: "站点设置", href: "/admin/settings", icon: <SettingOutlined /> },
      {
        title: navLabels.about || "关于页面",
        href: "/admin/about",
        icon: <InfoCircleOutlined />,
      },
    ],
    [navLabels.about, navLabels.navComments, navLabels.navPosts],
  );

  // 根据当前路径匹配活跃菜单项
  const activeItem = React.useMemo(() => {
    return (
      [...navItems]
        .sort((left, right) => right.href.length - left.href.length)
        .find((item) =>
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`),
        ) || navItems[0]
    );
  }, [navItems, pathname]);

  const currentPageTitle = React.useMemo(() => {
    if (pathname.startsWith("/admin/posts/edit")) {
      return "文章编辑";
    }
    return activeItem.title;
  }, [activeItem.title, pathname]);

  const menuItems = React.useMemo<MenuProps["items"]>(
    () =>
      navItems.map((item) => ({
        key: item.href,
        icon: item.icon,
        label: (
          <Link href={item.href} onClick={() => setMobileOpen(false)}>
            {item.title}
          </Link>
        ),
      })),
    [navItems],
  );

  const accountMenuItems = React.useMemo<MenuProps["items"]>(
    () => [
      {
        key: "profile",
        disabled: true,
        label: (
          <Space align="start">
            <Avatar size={40}>{username.slice(0, 1).toUpperCase()}</Avatar>
            <div>
              <Text strong>{username}</Text>
              <div>
                <Text type="secondary">当前后台账号</Text>
              </div>
            </div>
          </Space>
        ),
      },
      { type: "divider" },
      {
        key: "settings",
        icon: <SettingOutlined />,
        label: <Link href="/admin/settings">站点与邮件设置</Link>,
      },
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
    ],
    [username],
  );

  // 抽离侧边栏内容，复用于 Desktop Sider 和 Mobile Drawer
  const sideNavigation = (
    <>
      <div className="admin-shell-brand">
        <Link
          href="/admin"
          className="admin-shell-brand-link"
          onClick={() => setMobileOpen(false)}
        >
          <span className="admin-shell-brand-logo">
            <BrandLogo className="size-6 object-cover" alt="Logo" />
          </span>
          <span className="admin-shell-brand-copy">
            <Text strong className="admin-shell-brand-title">
              {siteTitle}
            </Text>
          </span>
        </Link>
      </div>

      <div className="admin-shell-menu-wrap">
        <Menu
          mode="inline"
          items={menuItems}
          selectedKeys={[activeItem.href]}
          className="admin-shell-menu"
        />
      </div>

      <div className="admin-shell-footer">
        <Text type="secondary">保持后台内容与前台体验同步。</Text>
        <Tag color="processing">当前账号 {username}</Tag>
      </div>
    </>
  );

  return (
    <Layout className="admin-shell-layout">
      <Sider width={280} className="admin-shell-sider admin-shell-sider-desktop">
        {sideNavigation}
      </Sider>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        placement="left"
        size={280}
        styles={{ body: { padding: 0 }, header: { display: "none" } }}
      >
        <div className="admin-shell-drawer">{sideNavigation}</div>
      </Drawer>

      <Layout>
        <Header className="admin-shell-header">
          <div className="admin-shell-header-left">
            <Button
              shape="circle"
              className="admin-icon-button admin-mobile-only"
              icon={<BarsOutlined />}
              onClick={() => setMobileOpen(true)}
            />
            <Text strong className="admin-shell-page-title">
              {currentPageTitle}
            </Text>
          </div>

          <Space size={12}>
            <Button
              href="/"
              target="_blank"
              icon={<GlobalOutlined />}
              className="admin-icon-button admin-tablet-up-only"
            >
              查看前台
            </Button>
            <ThemeToggle />
            <Dropdown
              menu={{ items: accountMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button className="admin-account-button">
                <Space size={10}>
                  <Avatar size={32}>{username.slice(0, 1).toUpperCase()}</Avatar>
                  <Text strong className="admin-desktop-label">
                    {username}
                  </Text>
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content className="admin-shell-content">
          <div className="admin-shell-content-inner">{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
}
