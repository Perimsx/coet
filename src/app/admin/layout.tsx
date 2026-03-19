import { Metadata } from "next"
import { notFound } from "next/navigation"

import { AdminClientProvider } from "@/features/admin/components/AdminClientProvider"

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
      <div className="min-h-screen text-foreground">{children}</div>
    </AdminClientProvider>
  )
}
