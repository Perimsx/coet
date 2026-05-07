import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  // 将当前 pathname 注入到 header 中，以便在 Server Component (如 layout.tsx) 中读取
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  // 匹配所有路径，排除 api、静态资源等
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
