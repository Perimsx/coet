import type { Metadata } from "next";
import { genPageMetadata } from "@/features/site/lib/seo";
import { getPublishedFriends } from "@/features/friends/lib/friends";
import { getDatabaseFriends } from '@/features/content/lib/database-content-source'
import FriendsClient from "@/features/friends/components/FriendsClient";

export async function generateMetadata(): Promise<Metadata> {
  return await genPageMetadata({
    title: "友链",
    description: "序栈的友情链接，感谢每一位朋友的支持与陪伴。",
    pathname: "/friends",
  });
}

export default async function FriendsPage() {
  const databaseFriends = await getDatabaseFriends()
  const friends = databaseFriends ? databaseFriends.map(friend => ({ name: friend.name, url: friend.url, avatar: friend.avatarUrl, description: friend.description, group: friend.groupName })) : getPublishedFriends()
  return <FriendsClient friends={friends} />;
}
