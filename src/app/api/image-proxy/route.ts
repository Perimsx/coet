import { NextRequest } from 'next/server'
import { getImageProxyReferers, isHotlinkProtectedHost } from '@/shared/utils/image-proxy'

const defaultUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
const FETCH_TIMEOUT_MS = 12000

export const runtime = 'nodejs'

function parseTargetUrl(raw: string) {
  try {
    if (raw.startsWith('//')) {
      return new URL(`https:${raw}`)
    }
    return new URL(raw)
  } catch {
    return null
  }
}

function buildImageHeaders(request: NextRequest, referer: string) {
  return {
    Accept:
      request.headers.get('accept') ||
      'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': request.headers.get('accept-language') || 'zh-CN,zh;q=0.9,en;q=0.8',
    'User-Agent': request.headers.get('user-agent') || defaultUserAgent,
    Referer: referer,
  }
}

function isImageResponse(response: Response) {
  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  return contentType.startsWith('image/')
}

function imageFilenameFromUrl(target: URL) {
  const file = target.pathname.split('/').filter(Boolean).pop()
  return file || 'image'
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')
  if (!rawUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }

  const target = parseTargetUrl(rawUrl)
  if (!target || (target.protocol !== 'https:' && target.protocol !== 'http:')) {
    return new Response('Invalid image url', { status: 400 })
  }

  if (!isHotlinkProtectedHost(target.hostname)) {
    return new Response('Host is not allowed for proxy', { status: 403 })
  }

  const referers = getImageProxyReferers(target)
  let upstream: Response | null = null
  let failureStatus = 502

  for (const referer of referers) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(target.toString(), {
        headers: buildImageHeaders(request, referer),
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal,
      })

      if (response.ok && isImageResponse(response)) {
        upstream = response
        break
      }

      failureStatus = response.status || 502
    } catch (error) {
      failureStatus = error instanceof Error && error.name === 'AbortError' ? 504 : 502
    } finally {
      clearTimeout(timer)
    }
  }

  if (!upstream) {
    return new Response('Failed to fetch image', { status: failureStatus })
  }

  const headers = new Headers()
  headers.set('Content-Type', upstream.headers.get('content-type') || 'image/*')
  headers.set(
    'Cache-Control',
    'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
  )
  headers.set('Vary', 'Accept, Accept-Language')
  headers.set(
    'Content-Disposition',
    `inline; filename*=UTF-8''${encodeURIComponent(imageFilenameFromUrl(target))}`
  )

  const contentLength = upstream.headers.get('content-length')
  if (contentLength) {
    headers.set('Content-Length', contentLength)
  }

  return new Response(upstream.body, {
    status: 200,
    headers,
  })
}
