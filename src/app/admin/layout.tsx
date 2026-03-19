import type { CSSProperties } from "react";

import { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminClientProvider } from "@/features/admin/components/AdminClientProvider";

const adminFontVariables = {
  "--font-admin-body":
    '"Aptos", "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
  "--font-admin-display":
    '"Aptos Display", "Segoe UI Variable Display", "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
} as CSSProperties;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Admin",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_ADMIN !== "true"
  ) {
    notFound();
  }

  return (
    <AdminClientProvider>
      <div
        style={adminFontVariables}
        className="min-h-screen font-[family-name:var(--font-admin-body)] text-foreground"
      >
        {children}
      </div>
    </AdminClientProvider>
  );
}
