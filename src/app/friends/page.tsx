import type { Metadata } from "next";

import siteMetadata from "@/config/site";
import { getPublishedFriends } from "@/features/friends/lib/friends";
import { getSiteSettings } from "@/server/site-settings";
import PageHeader from "@/shared/components/PageHeader";

import FriendsList from "@/features/friends/components/FriendsList";
import FriendsTabs from "@/features/friends/components/FriendsTabs";

export const dynamic = "force-dynamic";

import { genPageMetadata } from "@/app/seo";

export async function generateMetadata(): Promise<Metadata> {
  return await genPageMetadata({
    title: "友情链接",
    description: "汇聚志同道合的技术博主与优秀开源项目。在这里，我们通过链接连接思想，分享来自开发者们的实战经验与技术洞察，欢迎交换友链共建高质量内容生态。",
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
    <section className="mx-auto max-w-5xl px-4 pb-32 pt-10 sm:px-6 lg:px-8">
      <PageHeader
        title="友情链接"
        meta="欢迎交换友链，也可以直接复制本站信息后完成添加。"
      />

      <FriendsList friends={friends} />
      <FriendsTabs siteInfo={siteInfo} />
    </section>
  );
}
