import type { Metadata } from "next";
import { genPageMetadata } from "@/features/site/lib/seo";
import { getPublishedFriends } from "@/features/friends/lib/friends";
import FriendsClient from "@/features/friends/components/FriendsClient";

export async function generateMetadata(): Promise<Metadata> {
  return await genPageMetadata({
    title: "友链",
    description: "序栈的友情链接，感谢每一位朋友的支持与陪伴。",
    pathname: "/friends",
  });
}

export default function FriendsPage() {
  const friends = getPublishedFriends()
  return <FriendsClient friends={friends} />;
}
