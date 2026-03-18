import 'server-only'

import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/server/db'
import { comments, type CommentStatus } from '@/server/db/schema'

export type CommentTreeItem = {
  id: number
  postId: string
  parentId: number | null
  qq: string | null
  avatar: string | null
  authorName: string
  content: string
  isAdmin: boolean
  status: CommentStatus
  likes: number
  location: string | null
  browser: string | null
  os: string | null
  createdAt: Date
  replies: CommentTreeItem[]
}

function normalizeText(input: string, maxLength: number) {
  const value = input.trim()
  if (!value) return ''
  return value.slice(0, maxLength)
}

function toDate(value: Date | number) {
  return value instanceof Date ? value : new Date(value)
}

function buildCommentTree(rows: (typeof comments.$inferSelect)[]): CommentTreeItem[] {
  const sorted = [...rows].sort((a, b) => {
    const ta = toDate(a.createdAt).getTime()
    const tb = toDate(b.createdAt).getTime()
    return ta - tb
  })

  const nodeMap = new Map<number, CommentTreeItem>()
  const roots: CommentTreeItem[] = []

  for (const row of sorted) {
    nodeMap.set(row.id, {
      id: row.id,
      postId: row.postId,
      parentId: row.parentId ?? null,
      qq: row.qq ?? null,
      avatar: row.avatar ?? null,
      authorName: row.authorName,
      content: row.content,
      isAdmin: Boolean(row.isAdmin),
      status: row.status,
      likes: row.likes,
      location: row.location ?? null,
      browser: row.browser ?? null,
      os: row.os ?? null,
      createdAt: toDate(row.createdAt),
      replies: [],
    })
  }

  for (const node of nodeMap.values()) {
    if (!node.parentId) {
      roots.push(node)
      continue
    }
    const parent = nodeMap.get(node.parentId)
    if (parent) {
      parent.replies.push(node)
    } else {
      roots.push(node)
    }
  }

  roots.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return roots
}

export async function createComment(input: {
  postId: string
  qq?: string | null
  avatar?: string | null
  authorName: string
  content: string
  parentId?: number | null
  status?: CommentStatus
  isAdmin?: boolean
  ipAddress?: string | null
  location?: string | null
  userAgent?: string | null
  browser?: string | null
  os?: string | null
}) {
  const qq = normalizeText(input.qq || '', 12)
  const avatar = normalizeText(input.avatar || '', 512)
  const authorName = normalizeText(input.authorName, 40)
  const content = normalizeText(input.content, 1000)
  const postId = normalizeText(input.postId, 160)
  const isAdmin = Boolean(input.isAdmin)

  if (!authorName || !content || !postId) {
    return null
  }
  if (!isAdmin && !/^\d{5,12}$/.test(qq)) {
    return null
  }

  const parentId = input.parentId ?? null
  if (parentId !== null) {
    const parent = db
      .select()
      .from(comments)
      .where(and(eq(comments.id, parentId), eq(comments.postId, postId)))
      .get()
    if (!parent) {
      return null
    }
  }

  const result = db
    .insert(comments)
    .values({
      postId,
      parentId,
      qq: qq || null,
      avatar: avatar || null,
      authorName,
      content,
      isAdmin,
      ipAddress: normalizeText(input.ipAddress || '', 128) || null,
      location: normalizeText(input.location || '', 128) || null,
      userAgent: normalizeText(input.userAgent || '', 512) || null,
      browser: normalizeText(input.browser || '', 64) || null,
      os: normalizeText(input.os || '', 64) || null,
      status: input.status ?? 'approved',
      updatedAt: new Date(),
    })
    .run()

  const insertedId = Number(result.lastInsertRowid)
  return getCommentById(insertedId)
}

export async function getApprovedComments(postId: string) {
  const rows = db
    .select()
    .from(comments)
    .where(and(eq(comments.postId, postId), eq(comments.status, 'approved')))
    .orderBy(asc(comments.createdAt))
    .all()

  return buildCommentTree(rows)
}

export async function getAllComments() {
  return db.select().from(comments).orderBy(desc(comments.createdAt)).all()
}

export async function getPendingCommentCount() {
  const result = db
    .select({ value: count() })
    .from(comments)
    .where(eq(comments.status, 'pending'))
    .get()

  return Number(result?.value ?? 0)
}

export async function setCommentStatus(commentId: number, status: CommentStatus) {
  db
    .update(comments)
    .set({ status, updatedAt: new Date() })
    .where(eq(comments.id, commentId))
    .run()

  return getCommentById(commentId)
}

export async function removeComment(commentId: number) {
  const current = db.select().from(comments).where(eq(comments.id, commentId)).get()
  if (!current) return []

  const rows = db
    .select({ id: comments.id, parentId: comments.parentId })
    .from(comments)
    .where(eq(comments.postId, current.postId))
    .all()

  const childrenMap = new Map<number, number[]>()
  for (const row of rows) {
    if (!row.parentId) continue
    const list = childrenMap.get(row.parentId) ?? []
    list.push(row.id)
    childrenMap.set(row.parentId, list)
  }

  const stack = [commentId]
  const ids: number[] = []
  while (stack.length) {
    const id = stack.pop()
    if (!id) continue
    ids.push(id)
    const children = childrenMap.get(id) ?? []
    for (const childId of children) {
      stack.push(childId)
    }
  }

  if (ids.length) {
    db.delete(comments).where(inArray(comments.id, ids)).run()
  }

  return ids
}

export async function getCommentById(commentId: number) {
  return db.select().from(comments).where(eq(comments.id, commentId)).get()
}

export async function incrementCommentLikes(id: number, postId: string) {
  const result = db
    .update(comments)
    .set({ likes: sql`${comments.likes} + 1` })
    .where(and(eq(comments.id, id), eq(comments.postId, postId)))
    .run()
  return result.changes > 0
}
