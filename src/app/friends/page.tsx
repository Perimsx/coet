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
    <section className="mx-auto max-w-5xl px-4 pt-4 pb-12 sm:pt-6 sm:pb-16 sm:px-6 lg:px-8">
      <PageHeader
        title="友链"
        meta={`共 ${friends.length} 个友链 · 欢迎参考底部格式交换`}
      />

      <FriendsList friends={friends} />
      <FriendsTabs siteInfo={siteInfo} />
    </section>
  );
}
