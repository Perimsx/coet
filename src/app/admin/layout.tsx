import { Metadata } from "next"
import { notFound } from "next/navigation"

import { AdminClientProvider } from "@/features/admin/components/AntdRegistry"

import "@/features/admin/styles/admin.css"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Admin",
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_ADMIN !== "true") {
    notFound()
  }

  return (
    <AdminClientProvider>
      <div className="admin-layout-wrapper">{children}</div>
    </AdminClientProvider>
  )
}
