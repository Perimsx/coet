"use client"

import React, { useEffect, useMemo, useState } from "react"
import { AntdRegistry } from "@ant-design/nextjs-registry"
import { App, ConfigProvider, theme } from "antd"
import type { ThemeConfig } from "antd"
import { useTheme } from "next-themes"

const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: "#155eef",
    colorInfo: "#155eef",
    colorSuccess: "#079455",
    colorWarning: "#dc6803",
    colorError: "#d92d20",
    colorBgBase: "#f4f7fb",
    colorTextBase: "#101828",
    borderRadius: 16,
    fontFamily: "var(--font-sans), 'PingFang SC', 'Microsoft YaHei', sans-serif",
    wireframe: false,
  },
  components: {
    Layout: {
      bodyBg: "transparent",
      headerBg: "rgba(255,255,255,0.78)",
      siderBg: "rgba(255,255,255,0.82)",
      triggerBg: "#155eef",
    },
    Card: {
      colorBgContainer: "rgba(255,255,255,0.78)",
      boxShadowTertiary: "0 18px 40px rgba(15, 23, 42, 0.08)",
    },
    Menu: {
      itemBg: "transparent",
      itemSelectedBg: "rgba(21, 94, 239, 0.12)",
      itemSelectedColor: "#155eef",
      itemHoverColor: "#155eef",
      itemActiveBg: "rgba(21, 94, 239, 0.08)",
      subMenuItemBg: "transparent",
    },
    Table: {
      headerBg: "rgba(226, 232, 240, 0.4)",
      rowHoverBg: "rgba(21, 94, 239, 0.04)",
    },
  },
}

const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#5b8cff",
    colorInfo: "#5b8cff",
    colorSuccess: "#32d583",
    colorWarning: "#fdb022",
    colorError: "#f97066",
    colorBgBase: "#0b1020",
    colorTextBase: "#f8fafc",
    borderRadius: 16,
    fontFamily: "var(--font-sans), 'PingFang SC', 'Microsoft YaHei', sans-serif",
    wireframe: false,
  },
  components: {
    Layout: {
      bodyBg: "transparent",
      headerBg: "rgba(11,16,32,0.78)",
      siderBg: "rgba(11,16,32,0.82)",
      triggerBg: "#5b8cff",
    },
    Card: {
      colorBgContainer: "rgba(15,23,42,0.74)",
      boxShadowTertiary: "0 18px 40px rgba(2, 6, 23, 0.4)",
    },
    Menu: {
      itemBg: "transparent",
      itemSelectedBg: "rgba(91, 140, 255, 0.16)",
      itemSelectedColor: "#dbeafe",
      itemHoverColor: "#dbeafe",
      itemActiveBg: "rgba(91, 140, 255, 0.1)",
      darkItemBg: "transparent",
      darkItemSelectedBg: "rgba(91, 140, 255, 0.18)",
      darkItemSelectedColor: "#dbeafe",
      darkItemHoverColor: "#dbeafe",
      darkSubMenuItemBg: "transparent",
    },
    Table: {
      headerBg: "rgba(30, 41, 59, 0.66)",
      rowHoverBg: "rgba(91, 140, 255, 0.08)",
    },
  },
}

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
    <AntdRegistry>
      <ConfigProvider theme={currentTheme} componentSize="middle">
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  )
}
