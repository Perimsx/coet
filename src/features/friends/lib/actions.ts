'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/features/admin/lib/admin-session'
import { adminError, adminSuccess, type AdminMutationResult } from '@/features/admin/lib/mutations'
import {
  sendFriendLinkApprovedNotification,
  sendNewFriendLinkApplicationNotification,
  type FriendLinkApprovedPayload,
} from '@/server/mailer'
import type { Friend, NewFriend } from '@/server/db/schema'

import { createFriend, deleteFriend, getFriends, updateFriend } from './friends'

export async function createFriendAction(
  data: NewFriend
): Promise<AdminMutationResult<Friend>> {
  await requireAdminSession()

  const created = await createFriend(data)
  revalidatePath('/admin/friends')
  revalidatePath('/friends')
  return adminSuccess({ item: created })
}

export async function updateFriendAction(
  id: number,
  data: Partial<NewFriend>
): Promise<AdminMutationResult<Friend>> {
  await requireAdminSession()

  let shouldSendApprovalEmail = false
  let friendDataToEmail: FriendLinkApprovedPayload | null = null

  if (data.status === 'published') {
    const existingFriends = await getFriends()
    const existing = existingFriends.find((friend) => friend.id === id)
    if (existing && existing.status !== 'published' && existing.qq) {
      shouldSendApprovalEmail = true
      friendDataToEmail = {
        name: existing.name,
        url: existing.url,
        qq: existing.qq,
      }
    }
  }

  const updated = await updateFriend(id, data)
  if (!updated) {
    return adminError('友链不存在', 'FRIEND_NOT_FOUND')
  }

  revalidatePath('/admin/friends')
  revalidatePath('/friends')

  if (shouldSendApprovalEmail && friendDataToEmail) {
    sendFriendLinkApprovedNotification(friendDataToEmail).catch((error) => {
      console.error('Failed to send friend link approval email:', error)
    })
  }

  return adminSuccess({ item: updated })
}

export async function deleteFriendAction(
  id: number
): Promise<AdminMutationResult> {
  await requireAdminSession()

  const existing = (await getFriends()).find((friend) => friend.id === id)
  if (!existing) {
    return adminError('友链不存在', 'FRIEND_NOT_FOUND')
  }

  await deleteFriend(id)
  revalidatePath('/admin/friends')
  revalidatePath('/friends')
  return adminSuccess({ deletedIds: [id] })
}

export async function applyFriendAction(data: Omit<NewFriend, 'status'>) {
  if (!data.qq) {
    throw new Error('QQ Number is required')
  }

  await createFriend({
    ...data,
    status: 'draft',
    sortOrder: 0,
  })
  revalidatePath('/admin/friends')

  sendNewFriendLinkApplicationNotification({
    name: data.name,
    url: data.url,
    description: data.description || '',
    qq: data.qq,
  }).catch((error) => {
    console.error('Failed to send friend link application email:', error)
  })

  return { success: true }
}
