import type { CommentStatus } from "@/server/db/schema"

type CommentRow = {
  id: number
  parentId: number | null
  postId: string
  qq: string | null
  avatar: string | null
  authorName: string
  content: string
  isAdmin: boolean
  ipAddress?: string | null
  location?: string | null
  browser?: string | null
  os?: string | null
  status: CommentStatus
  likes: number
  createdAt: Date | string | number
}

export type AdminCommentRole = "admin" | "visitor"

export type AdminCommentNode = {
  id: number
  parentId: number | null
  postId: string
  qq: string | null
  avatar: string | null
  avatarSrc: string
  authorName: string
  content: string
  role: AdminCommentRole
  isAdmin: boolean
  ipAddress: string | null
  location: string | null
  browser: string | null
  os: string | null
  status: CommentStatus
  likes: number
  createdAt: string
}

export type AdminCommentThread = {
  id: number
  root: AdminCommentNode
  replies: AdminCommentNode[]
  status: CommentStatus
  lastActivityAt: string
  adminReplyCount: number
  visitorReplyCount: number
}

function toIsoString(value: Date | string | number): string {
  if (value instanceof Date) return value.toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function getAvatarSrc(row: CommentRow, ownerQq?: string): string {
  if (row.avatar) return row.avatar

  const qq = row.isAdmin ? ownerQq : row.qq
  if (qq && /^\d{5,12}$/.test(qq)) {
    return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100`
  }

  const name = encodeURIComponent((row.authorName || "U").trim() || "U")
  return `https://ui-avatars.com/api/?name=${name}&size=80&background=e8eefc&color=1d4ed8`
}

export function serializeAdminComment(
  row: CommentRow,
  ownerQq?: string,
): AdminCommentNode {
  return {
    id: row.id,
    parentId: row.parentId ?? null,
    postId: row.postId,
    qq: row.qq ?? null,
    avatar: row.avatar ?? null,
    avatarSrc: getAvatarSrc(row, ownerQq),
    authorName: row.authorName,
    content: row.content,
    role: row.isAdmin ? "admin" : "visitor",
    isAdmin: Boolean(row.isAdmin),
    ipAddress: row.ipAddress ?? null,
    location: row.location ?? null,
    browser: row.browser ?? null,
    os: row.os ?? null,
    status: row.status,
    likes: row.likes,
    createdAt: toIsoString(row.createdAt),
  }
}

function flattenReplies(
  parentId: number,
  childrenMap: Map<number, CommentRow[]>,
  ownerQq?: string,
): AdminCommentNode[] {
  const children = childrenMap.get(parentId) ?? []
  const ordered = [...children].sort((left, right) => {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  })

  return ordered.flatMap((child) => [
    serializeAdminComment(child, ownerQq),
    ...flattenReplies(child.id, childrenMap, ownerQq),
  ])
}

export function buildAdminCommentThreads(
  rows: CommentRow[],
  ownerQq?: string,
): AdminCommentThread[] {
  const childrenMap = new Map<number, CommentRow[]>()
  const roots = rows.filter((row) => !row.parentId)

  for (const row of rows) {
    if (!row.parentId) continue
    const current = childrenMap.get(row.parentId) ?? []
    current.push(row)
    childrenMap.set(row.parentId, current)
  }

  return [...roots]
    .sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
    .map((root) => {
      const replies = flattenReplies(root.id, childrenMap, ownerQq)
      const lastActivityAt = replies.at(-1)?.createdAt || toIsoString(root.createdAt)

      return {
        id: root.id,
        root: serializeAdminComment(root, ownerQq),
        replies,
        status: root.status,
        lastActivityAt,
        adminReplyCount: replies.filter((reply) => reply.role === "admin").length,
        visitorReplyCount: replies.filter((reply) => reply.role === "visitor").length,
      }
    })
}
