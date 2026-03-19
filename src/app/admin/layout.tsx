import { Metadata } from "next"
import { Manrope, Plus_Jakarta_Sans } from "next/font/google"
import { notFound } from "next/navigation"

import { AdminClientProvider } from "@/features/admin/components/AdminClientProvider"

const adminBodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-admin-body",
  display: "swap",
})

const adminDisplayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-admin-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
})

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
      <div
        className={`${adminBodyFont.variable} ${adminDisplayFont.variable} min-h-screen font-[family-name:var(--font-admin-body)] text-foreground`}
      >
        {children}
      </div>
    </AdminClientProvider>
  )
}
