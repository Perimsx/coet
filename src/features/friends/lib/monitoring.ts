import { db } from '@/server/db'
import { friends, type Friend, type LinkHealthStatus } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

function normalizeUrl(input: string) {
  const value = input.trim()
  if (!value) {
    throw new Error('URL 不能为空')
  }

  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`
  return new URL(normalized).toString()
}

function readHtmlTag(html: string, tag: string) {
  const match = html.match(new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, 'i'))
  return match?.[1]?.trim() || ''
}

function readMetaContent(html: string, name: string) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return match[1].trim()
  }

  return ''
}

function readFavicon(html: string, baseUrl: string) {
  const match = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i)
  if (!match?.[1]) {
    return `${new URL(baseUrl).origin}/favicon.ico`
  }

  return new URL(match[1], baseUrl).toString()
}

export async function fetchFriendLinkMetadata(rawUrl: string) {
  const url = normalizeUrl(rawUrl)
  const response = await fetch(url, {
    headers: {
      'user-agent': 'CoetAdminBot/1.0',
    },
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }

  const html = await response.text()
  return {
    url,
    name: readMetaContent(html, 'og:title') || readHtmlTag(html, 'title'),
    description:
      readMetaContent(html, 'description') || readMetaContent(html, 'og:description'),
    favicon: readFavicon(html, response.url || url),
  }
}

export async function checkFriendHealth(friend: Friend) {
  try {
    const response = await fetch(friend.url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent': 'CoetAdminHealthCheck/1.0',
      },
    })

    const healthStatus: LinkHealthStatus =
      response.status >= 200 && response.status < 400
        ? 'healthy'
        : response.status >= 400 && response.status < 500
          ? 'warning'
          : 'down'

    return {
      id: friend.id,
      healthStatus,
      lastCheckedAt: new Date(),
      lastStatusCode: response.status,
      lastError: null,
    }
  } catch (error) {
    return {
      id: friend.id,
      healthStatus: 'down' as LinkHealthStatus,
      lastCheckedAt: new Date(),
      lastStatusCode: null,
      lastError: error instanceof Error ? error.message.slice(0, 255) : 'unknown error',
    }
  }
}

export async function writeFriendHealthResult(result: Awaited<ReturnType<typeof checkFriendHealth>>) {
  return db
    .update(friends)
    .set({
      healthStatus: result.healthStatus,
      lastCheckedAt: result.lastCheckedAt,
      lastStatusCode: result.lastStatusCode,
      lastError: result.lastError,
      updatedAt: new Date(),
    })
    .where(eq(friends.id, result.id))
    .returning()
    .get()
}
