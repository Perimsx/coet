import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getAdminLoginPath, INTERNAL_ADMIN_LOGIN_PATH } from '@/features/admin/lib/routes'

function resolveClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return request.headers.get('x-real-ip') || 'unknown'
}

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const pathname = request.nextUrl.pathname
  const externalAdminEntry = getAdminLoginPath()
  const isExternalAdminEntry =
    pathname === externalAdminEntry || pathname.startsWith(`${externalAdminEntry}/`)
  const isInternalAdminLogin = pathname === INTERNAL_ADMIN_LOGIN_PATH
  const isAdminShell =
    pathname.startsWith('/admin') || isExternalAdminEntry || isInternalAdminLogin

  requestHeaders.set('x-app-shell', isAdminShell ? 'admin' : 'site')
  requestHeaders.set('x-pathname', pathname)
  requestHeaders.set('x-admin-client-ip', resolveClientIp(request))

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

  if (isExternalAdminEntry) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = INTERNAL_ADMIN_LOGIN_PATH
    rewriteUrl.searchParams.set('__entry', '1')
    requestHeaders.set('x-admin-entry', 'external')

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    })
  }

  if (
    process.env.NODE_ENV === 'production' &&
    isInternalAdminLogin &&
    request.nextUrl.searchParams.get('__entry') !== '1'
  ) {
    return new NextResponse('Not Found', { status: 404 })
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
