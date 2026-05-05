import { eq, desc } from 'drizzle-orm'
import { db } from '@/server/db'
import { friends, type Friend, type NewFriend } from '@/server/db/schema'

export async function getFriends(): Promise<Friend[]> {
  return db.select().from(friends).orderBy(desc(friends.sortOrder), desc(friends.createdAt)).all()
}

export async function getPublishedFriends(): Promise<Friend[]> {
  return db
    .select()
    .from(friends)
    .where(eq(friends.status, 'published'))
    .orderBy(desc(friends.sortOrder), desc(friends.createdAt))
    .all()
}

export async function createFriend(data: NewFriend): Promise<Friend> {
  return db.insert(friends).values(data).returning().get()
}

export async function updateFriend(id: number, data: Partial<NewFriend>): Promise<Friend | undefined> {
  return db.update(friends).set({ ...data, updatedAt: new Date() }).where(eq(friends.id, id)).returning().get()
}

export async function deleteFriend(id: number): Promise<void> {
  db.delete(friends).where(eq(friends.id, id)).run()
}
