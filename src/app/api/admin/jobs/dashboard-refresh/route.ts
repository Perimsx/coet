import { NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin/lib/admin-session'
import {
  getAdminDashboardMetrics,
  markDashboardRefresh,
} from '@/features/admin/lib/dashboard-metrics'

export async function POST() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const [refreshedAt, metrics] = await Promise.all([
    markDashboardRefresh(),
    getAdminDashboardMetrics(),
  ])

  return NextResponse.json({
    ok: true,
    refreshedAt,
    metrics,
  })
}
