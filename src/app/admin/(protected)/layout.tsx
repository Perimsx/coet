import { AdminShell } from '@/features/admin/components/AdminShell'

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
