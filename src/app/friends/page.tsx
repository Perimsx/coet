import type { Metadata } from "next";

import siteMetadata from "@/config/site";
import { getPublishedFriends } from "@/features/friends/lib/friends";
import { getSiteSettings } from "@/server/site-settings";
import PageHeader from "@/shared/components/PageHeader";

import FriendsList from "@/features/friends/components/FriendsList";
import FriendsTabs from "@/features/friends/components/FriendsTabs";
import { genPageMetadata } from "@/app/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return await genPageMetadata({
    title: "友链",
    pathname: "/friends",
  });
}

export default async function FriendsPage() {
  const friends = await getPublishedFriends();
  const settings = await getSiteSettings();
  const siteInfo = {
    title: settings.friendName || settings.title || siteMetadata.title,
    description:
      settings.friendDescription ||
      settings.heroBottomText ||
      settings.description ||
      siteMetadata.description,
    url: settings.friendUrl || settings.siteUrl || siteMetadata.siteUrl,
    avatar:
      settings.friendAvatar ||
      settings.heroAvatar ||
      "/static/images/avatar.png",
  };

  return (
    <section className="mx-auto max-w-5xl px-4 pb-32 pt-2 sm:pt-4 sm:px-6 lg:px-8">
      <PageHeader
        title="友链"
        meta={`欢迎交换友链，目前已与 ${friends.length} 位朋友建立连接。也可以直接复制本站信息后完成添加。`}
      />

      <FriendsList friends={friends} />
      <FriendsTabs siteInfo={siteInfo} />
    </section>
  );
}
