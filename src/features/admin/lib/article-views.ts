import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/server/db'
import { adminSavedArticleViews } from '@/server/db/schema'

export type AdminPostViewState = {
  query: string
  category: string
  status: string
  sortBy: string
}

export async function listArticleFilterPresets(userId: number) {
  return db
    .select()
    .from(adminSavedArticleViews)
    .where(eq(adminSavedArticleViews.userId, userId))
    .orderBy(desc(adminSavedArticleViews.updatedAt))
    .all()
}

export async function saveArticleFilterPreset(input: {
  userId: number
  name: string
  state: AdminPostViewState
}) {
  const normalizedName = input.name.trim().slice(0, 60)
  if (!normalizedName) {
    throw new Error('视图名称不能为空')
  }

  const payload = JSON.stringify(input.state)
  const existing = db
    .select()
    .from(adminSavedArticleViews)
    .where(eq(adminSavedArticleViews.userId, input.userId))
    .all()
    .find((item) => item.name === normalizedName)

  if (existing) {
    return db
      .update(adminSavedArticleViews)
      .set({
        query: input.state.query,
        category: input.state.category,
        status: input.state.status,
        sortBy: input.state.sortBy,
        payload,
        updatedAt: new Date(),
      })
      .where(eq(adminSavedArticleViews.id, existing.id))
      .returning()
      .get()
  }

  return db
    .insert(adminSavedArticleViews)
    .values({
      userId: input.userId,
      name: normalizedName,
      query: input.state.query,
      category: input.state.category,
      status: input.state.status,
      sortBy: input.state.sortBy,
      payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()
    .get()
}

export async function deleteArticleFilterPreset(id: number, userId: number) {
  return db
    .delete(adminSavedArticleViews)
    .where(and(eq(adminSavedArticleViews.id, id), eq(adminSavedArticleViews.userId, userId)))
    .returning()
    .all()
}
