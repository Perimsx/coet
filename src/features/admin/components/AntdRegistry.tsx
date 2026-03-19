"use client"

import React, { useEffect, useMemo, useState } from "react"
import { AntdRegistry } from "@ant-design/nextjs-registry"
import { App, ConfigProvider, theme } from "antd"
import type { ThemeConfig } from "antd"
import { useTheme } from "next-themes"
import { SWRConfig } from "swr"

import { Toaster } from "@/shared/ui/sonner"

/**
 * 浅色主题配置令牌
 */
const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: "#111827",
    colorInfo: "#111827",
    colorSuccess: "#16a34a",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorBgBase: "#f7f7f8",
    colorTextBase: "#111827",
    borderRadius: 12,
    fontFamily: "var(--font-sans), 'PingFang SC', 'Microsoft YaHei', sans-serif",
    wireframe: false,
  },
  components: {
    Layout: {
      bodyBg: "transparent",
      headerBg: "rgba(255,255,255,0.86)",
      siderBg: "rgba(255,255,255,0.9)",
      triggerBg: "#111827",
    },
    Card: {
      colorBgContainer: "rgba(255,255,255,0.9)",
      boxShadowTertiary: "0 18px 40px rgba(15, 23, 42, 0.06)",
    },
    Menu: {
      itemBg: "transparent",
      itemSelectedBg: "rgba(17, 24, 39, 0.08)",
      itemSelectedColor: "#111827",
      itemHoverColor: "#111827",
      itemActiveBg: "rgba(17, 24, 39, 0.06)",
      subMenuItemBg: "transparent",
    },
    Table: {
      headerBg: "rgba(226, 232, 240, 0.5)",
      rowHoverBg: "rgba(17, 24, 39, 0.04)",
    },
  },
}

/**
 * 深色主题配置令牌
 */
const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#e5e7eb",
    colorInfo: "#e5e7eb",
    colorSuccess: "#22c55e",
    colorWarning: "#f59e0b",
    colorError: "#f43f5e",
    colorBgBase: "#0b0d12",
    colorTextBase: "#f8fafc",
    borderRadius: 12,
    fontFamily: "var(--font-sans), 'PingFang SC', 'Microsoft YaHei', sans-serif",
    wireframe: false,
  },
  components: {
    Layout: {
      bodyBg: "transparent",
      headerBg: "rgba(11, 13, 18, 0.86)",
      siderBg: "rgba(11, 13, 18, 0.9)",
      triggerBg: "#e5e7eb",
    },
    Card: {
      colorBgContainer: "rgba(17, 19, 24, 0.9)",
      boxShadowTertiary: "0 18px 40px rgba(2, 6, 23, 0.45)",
    },
    Menu: {
      itemBg: "transparent",
      itemSelectedBg: "rgba(248, 250, 252, 0.12)",
      itemSelectedColor: "#f8fafc",
      itemHoverColor: "#f8fafc",
      itemActiveBg: "rgba(248, 250, 252, 0.08)",
      darkItemBg: "transparent",
      darkItemSelectedBg: "rgba(248, 250, 252, 0.14)",
      darkItemSelectedColor: "#f8fafc",
      darkItemHoverColor: "#f8fafc",
      darkSubMenuItemBg: "transparent",
    },
    Table: {
      headerBg: "rgba(30, 32, 38, 0.9)",
      rowHoverBg: "rgba(248, 250, 252, 0.06)",
    },
  },
}

/**
 * 管理后台全局客户端提供者
 * 负责注入 Ant Design 注册表、配置提供者及全局应用容器。建议修复错误。
 */
export function AdminClientProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = useMemo(
    () => (mounted && resolvedTheme === "dark" ? darkTheme : lightTheme),
    [mounted, resolvedTheme]
  )

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        keepPreviousData: true,
        dedupingInterval: 2000,
      }}
    >
      <AntdRegistry>
        <ConfigProvider theme={currentTheme} componentSize="middle">
          <App>
            {children}
            <Toaster richColors closeButton />
          </App>
        </ConfigProvider>
      </AntdRegistry>
    </SWRConfig>
  )
}
