'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/features/admin/lib/admin-session'
import { adminError, adminSuccess, type AdminMutationResult } from '@/features/admin/lib/mutations'
import {
  sendFriendLinkApprovedNotification,
  sendFriendLinkDeletedNotification,
  sendFriendLinkUpdatedNotification,
  sendNewFriendLinkApplicationNotification,
  type FriendLinkApprovedPayload,
} from '@/server/mailer'
import type { Friend, NewFriend } from '@/server/db/schema'

import { createFriend, deleteFriend, getFriends, updateFriend } from './friends'

function getNextFriendValue<T>(incoming: T | undefined, fallback: T): T {
  return incoming === undefined ? fallback : incoming
}

function hasFriendPublicInfoChanged(existing: Friend, next: Partial<NewFriend>) {
  return (
    getNextFriendValue(next.name, existing.name) !== existing.name ||
    getNextFriendValue(next.url, existing.url) !== existing.url ||
    getNextFriendValue(next.avatar, existing.avatar) !== existing.avatar ||
    getNextFriendValue(next.favicon, existing.favicon) !== existing.favicon ||
    getNextFriendValue(next.description, existing.description) !== existing.description
  )
}

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

  const existing = (await getFriends()).find((friend) => friend.id === id)
  if (!existing) {
    return adminError('Friend link not found', 'FRIEND_NOT_FOUND')
  }

  const nextStatus = getNextFriendValue(data.status, existing.status)
  const nextName = getNextFriendValue(data.name, existing.name)
  const nextUrl = getNextFriendValue(data.url, existing.url)
  const nextQq = getNextFriendValue(data.qq, existing.qq)
  const shouldSendApprovalEmail =
    existing.status !== 'published' &&
    nextStatus === 'published' &&
    Boolean(nextQq)
  const shouldSendRemovalEmail =
    existing.status === 'published' &&
    nextStatus !== 'published' &&
    Boolean(nextQq)
  const shouldSendUpdateEmail =
    existing.status === 'published' &&
    nextStatus === 'published' &&
    Boolean(nextQq) &&
    hasFriendPublicInfoChanged(existing, data)

  const updated = await updateFriend(id, data)
  if (!updated) {
    return adminError('Friend link not found', 'FRIEND_NOT_FOUND')
  }

  revalidatePath('/admin/friends')
  revalidatePath('/friends')

  if (shouldSendApprovalEmail && nextQq) {
    const payload: FriendLinkApprovedPayload = {
      name: nextName,
      url: nextUrl,
      qq: nextQq,
    }

    sendFriendLinkApprovedNotification(payload).catch((error) => {
      console.error('Failed to send friend link approval email:', error)
    })
  } else if (shouldSendRemovalEmail && nextQq) {
    sendFriendLinkDeletedNotification({
      name: nextName,
      url: nextUrl,
      qq: nextQq,
    }).catch((error) => {
      console.error('Failed to send friend link removal email:', error)
    })
  } else if (shouldSendUpdateEmail && nextQq) {
    sendFriendLinkUpdatedNotification({
      name: nextName,
      url: nextUrl,
      qq: nextQq,
    }).catch((error) => {
      console.error('Failed to send friend link update email:', error)
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
    return adminError('Friend link not found', 'FRIEND_NOT_FOUND')
  }

  await deleteFriend(id)
  revalidatePath('/admin/friends')
  revalidatePath('/friends')

  if (existing.qq) {
    sendFriendLinkDeletedNotification({
      name: existing.name,
      url: existing.url,
      qq: existing.qq,
    }).catch((error) => {
      console.error('Failed to send friend link delete email:', error)
    })
  }

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
