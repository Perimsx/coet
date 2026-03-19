'use server'

import { revalidatePath } from 'next/cache'
import { asc, desc, eq } from 'drizzle-orm'

import { requireAdminSession } from '@/features/admin/lib/admin-session'
import { adminError, adminSuccess, type AdminMutationResult } from '@/features/admin/lib/mutations'
import { sendSuggestionReplyNotification } from '@/server/mailer'
import { db } from '@/server/db'
import {
  suggestionReplyTemplates,
  suggestions,
  suggestionTimelineEvents,
  type Suggestion,
  type SuggestionReplyTemplate,
  type SuggestionStatus,
} from '@/server/db/schema'

async function appendSuggestionTimeline(input: {
  suggestionId: number
  type: 'status_changed' | 'reply' | 'note'
  detail: string
}) {
  db.insert(suggestionTimelineEvents)
    .values({
      suggestionId: input.suggestionId,
      type: input.type,
      detail: input.detail,
      createdAt: new Date(),
    })
    .run()
}

export async function getSuggestionsAction() {
  await requireAdminSession()
  return db.select().from(suggestions).orderBy(desc(suggestions.updatedAt)).all()
}

export async function getSuggestionTemplatesAction() {
  await requireAdminSession()
  return db.select().from(suggestionReplyTemplates).orderBy(
    asc(suggestionReplyTemplates.sortOrder),
    desc(suggestionReplyTemplates.updatedAt)
  ).all()
}

export async function deleteSuggestionAction(
  id: number
): Promise<AdminMutationResult> {
  await requireAdminSession()

  const existing = db.select().from(suggestions).where(eq(suggestions.id, id)).get()
  if (!existing) {
    return adminError('建议不存在', 'SUGGESTION_NOT_FOUND')
  }

  await db.delete(suggestions).where(eq(suggestions.id, id)).run()
  revalidatePath('/admin/suggestions')
  return adminSuccess({ deletedIds: [id] })
}

export async function updateSuggestionStatusAction(
  id: number,
  status: SuggestionStatus
): Promise<AdminMutationResult<Suggestion>> {
  const session = await requireAdminSession()
  const suggestion = db.select().from(suggestions).where(eq(suggestions.id, id)).get()

  if (!suggestion) {
    return adminError('建议不存在', 'SUGGESTION_NOT_FOUND')
  }

  const updated = db
    .update(suggestions)
    .set({
      status,
      assignee: suggestion.assignee || session.username,
      updatedAt: new Date(),
    })
    .where(eq(suggestions.id, id))
    .returning()
    .get()

  await appendSuggestionTimeline({
    suggestionId: id,
    type: 'status_changed',
    detail: `状态变更为 ${status}`,
  })

  revalidatePath('/admin/suggestions')
  return adminSuccess({ item: updated })
}

export async function replySuggestionAction(
  id: number,
  replyContent: string,
  status: SuggestionStatus = 'replied'
): Promise<AdminMutationResult<Suggestion>> {
  const session = await requireAdminSession()
  const suggestion = db.select().from(suggestions).where(eq(suggestions.id, id)).get()
  if (!suggestion) {
    return adminError('建议不存在', 'SUGGESTION_NOT_FOUND')
  }

  const normalized = replyContent.trim()
  if (normalized.length < 2) {
    return adminError('回复内容不能少于 2 个字符', 'INVALID_REPLY')
  }

  const updated = await db
    .update(suggestions)
    .set({
      adminReply: normalized,
      status,
      assignee: suggestion.assignee || session.username,
      updatedAt: new Date(),
    })
    .where(eq(suggestions.id, id))
    .returning()
    .get()

  await appendSuggestionTimeline({
    suggestionId: id,
    type: 'reply',
    detail: normalized,
  })
  await appendSuggestionTimeline({
    suggestionId: id,
    type: 'status_changed',
    detail: `状态变更为 ${status}`,
  })

  try {
    await sendSuggestionReplyNotification({
      qq: suggestion.qq,
      suggestionContent: suggestion.content,
      adminReply: normalized,
    })
  } catch (error) {
    console.error('[replySuggestionAction] Failed to send email:', error)
  }

  revalidatePath('/admin/suggestions')
  return adminSuccess({ item: updated })
}

export async function saveSuggestionTemplateAction(input: {
  id?: number
  title: string
  content: string
  sortOrder?: number
}): Promise<AdminMutationResult<SuggestionReplyTemplate>> {
  await requireAdminSession()

  const title = input.title.trim().slice(0, 60)
  const content = input.content.trim().slice(0, 1000)
  if (!title || !content) {
    return adminError('模板标题和内容不能为空', 'INVALID_TEMPLATE')
  }

  const item = input.id
    ? db
        .update(suggestionReplyTemplates)
        .set({
          title,
          content,
          sortOrder: input.sortOrder ?? 0,
          updatedAt: new Date(),
        })
        .where(eq(suggestionReplyTemplates.id, input.id))
        .returning()
        .get()
    : db
        .insert(suggestionReplyTemplates)
        .values({
          title,
          content,
          sortOrder: input.sortOrder ?? 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
        .get()

  revalidatePath('/admin/suggestions')
  return adminSuccess({ item })
}

export async function deleteSuggestionTemplateAction(
  id: number
): Promise<AdminMutationResult> {
  await requireAdminSession()
  await db.delete(suggestionReplyTemplates).where(eq(suggestionReplyTemplates.id, id)).run()
  revalidatePath('/admin/suggestions')
  return adminSuccess({ deletedIds: [id] })
}
