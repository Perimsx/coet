/**
 * EdgeOne Pages Edge Function — Global Middleware
 * Route: catch-all via [[default]].js
 *
 * 1. Theme cookie injection — eliminates flash of wrong theme
 * 2. Security headers — dynamic CSP, HSTS, and hardening headers
 * 3. Cache-Control — smart caching per content type
 */

// ──────────── Theme Cookie ────────────

const THEME_SCRIPT = `!function(){try{var t=document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/);if(t){var v=decodeURIComponent(t[1]);document.documentElement.classList.add(v==='dark'?'dark':'light')}}catch(e){}}()`

// ──────────── Security Headers ────────────

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-DNS-Prefetch-Control': 'on',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-XSS-Protection': '1; mode=block',
}

// CSP for the site — adjust when adding new external resources
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.clarity.ms https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://cn-font.claude-code-best.win https://fonts.googleapis.com",
  "img-src 'self' blob: data: https: http:",
  "media-src 'self' blob: data:",
  "connect-src 'self' https: wss:",
  "font-src 'self' data: https: https://cn-font.claude-code-best.win https://fonts.gstatic.com",
  "frame-src https://www.youtube.com https://youtube.com https://www.bilibili.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]

// ──────────── Cache Rules ────────────

function getCacheControl(pathname) {
  // Static assets with hash — immutable, 1 year
  if (pathname.startsWith('/_next/static/')) {
    return 'public, max-age=31536000, immutable'
  }
  // Images and fonts — 30 days
  if (/\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)$/i.test(pathname)) {
    return 'public, max-age=2592000, stale-while-revalidate=86400'
  }
  // RSS and sitemap — 1 hour
  if (pathname === '/feed.xml' || pathname === '/sitemap.xml' || pathname.startsWith('/tags/')) {
    return 'public, max-age=3600, stale-while-revalidate=1800'
  }
  // Search index — 10 min
  if (pathname === '/search.json') {
    return 'public, max-age=600, stale-while-revalidate=300'
  }
  return null
}

// ──────────── Main Handler ────────────

export default async function onRequest(context) {
  const url = new URL(context.request.url)
  const pathname = url.pathname

  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // Get the response from origin (static file or 404)
  const response = await context.next()

  // Clone headers so we can modify them
  const headers = new Headers(response.headers)

  // ── Security headers ──
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value)
  }
  headers.set('Content-Security-Policy', CSP_DIRECTIVES.join('; '))

  // ── Cache control ──
  const cache = getCacheControl(pathname)
  if (cache && !headers.has('Cache-Control')) {
    headers.set('Cache-Control', cache)
  }

  // ── Theme injection (HTML only) ──
  const contentType = headers.get('content-type') || ''
  if (contentType.includes('text/html')) {
    const cookie = context.request.headers.get('cookie') || ''
    const themeMatch = cookie.match(/(?:^|;\s*)theme=([^;]+)/)
    const theme = themeMatch ? decodeURIComponent(themeMatch[1]) : null

    const html = await response.text()
    let modified = html

    // Inject theme class into <html>
    if (theme === 'dark' || theme === 'light') {
      modified = modified.replace(/<html([^>]*)>/, `<html$1 class="${theme}">`)
    }

    // Inject theme detection script before </head>
    modified = modified.replace('</head>', `<script>${THEME_SCRIPT}</script></head>`)

    return new Response(modified, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
