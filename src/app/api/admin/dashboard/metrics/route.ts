import { NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin/lib/admin-session'
import { getAdminDashboardMetrics } from '@/features/admin/lib/dashboard-metrics'

export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const metrics = await getAdminDashboardMetrics()
  return NextResponse.json({
    ok: true,
    metrics,
  })
}
