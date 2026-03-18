import { Metadata } from 'next'
import { getPublishedFriends } from '@/features/friends/lib/friends'
import PageHeader from '@/shared/components/PageHeader'
import ApplyFriendForm from './apply-friend-form'
import FriendsList from './FriendsList'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '友链',
    description: '看看这些我很喜欢的站点，也可以在这里申请交换友链。',
  }
}

import FriendsTabs from './FriendsTabs'

export default async function FriendsPage() {
  const friends = await getPublishedFriends()

  return (
    <section className="mx-auto max-w-5xl px-4 pt-10 pb-32 sm:px-6 lg:px-8">
      <PageHeader
        title="友情链接"
        meta="欢迎交换友链，请在下方提交申请。"
      />

      <FriendsList friends={friends} />

      <FriendsTabs />
    </section>
  )
}
