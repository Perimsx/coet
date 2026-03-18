'use server'

import { revalidatePath } from 'next/cache'
import { desc, eq } from 'drizzle-orm'

import { requireAdminSession } from '@/features/admin/lib/admin-session'
import { adminError, adminSuccess, type AdminMutationResult } from '@/features/admin/lib/mutations'
import { sendSuggestionReplyNotification } from '@/server/mailer'
import { db } from '@/server/db'
import { suggestions, type Suggestion } from '@/server/db/schema'

export async function getSuggestionsAction() {
  await requireAdminSession()
  return db.select().from(suggestions).orderBy(desc(suggestions.createdAt)).all()
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

export async function replySuggestionAction(
  id: number,
  replyContent: string
): Promise<AdminMutationResult<Suggestion>> {
  await requireAdminSession()

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
      status: 'replied',
      updatedAt: new Date(),
    })
    .where(eq(suggestions.id, id))
    .returning()
    .get()

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
