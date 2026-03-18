import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { ADMIN_LOGIN_PATH } from '@/features/admin/lib/routes'

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const pathname = request.nextUrl.pathname

  const isAdminShell =
    pathname.startsWith('/admin') ||
    pathname === ADMIN_LOGIN_PATH ||
    pathname.startsWith(`${ADMIN_LOGIN_PATH}/`)

  requestHeaders.set('x-app-shell', isAdminShell ? 'admin' : 'site')
  requestHeaders.set('x-pathname', pathname)

  const origin = request.headers.get('origin')
  if (origin) {
    try {
      const url = new URL(origin)
      requestHeaders.set('x-forwarded-host', url.host)
    } catch {
      const host = request.headers.get('host')
      if (host) {
        requestHeaders.set('x-forwarded-host', host)
      }
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
