import type { Metadata } from "next";

import siteMetadata from "@/config/site";
import PageHeader from "@/shared/components/PageHeader";

import FriendsList from "@/features/friends/components/FriendsList";
import FriendsTabs from "@/features/friends/components/FriendsTabs";
import { genPageMetadata } from "@/app/seo";

export async function generateMetadata(): Promise<Metadata> {
  return await genPageMetadata({
    title: "友链",
    description: "kerntau 的友情链接页面。在这里展示互相推荐的优质博客与技术站点，欢迎交换友链。",
    pathname: "/friends",
  });
}

export default async function FriendsPage() {
  const friends: any[] = [];
  const siteInfo = {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: siteMetadata.siteUrl,
    avatar: "/static/images/avatar.png",
  };

  return (
    <section className="mx-auto max-w-5xl px-4 pt-4 pb-12 sm:pt-6 sm:pb-16 sm:px-6 lg:px-8">
      <PageHeader
        title="友链"
        meta={`共 ${friends.length} 个友链`}
      />

      <FriendsList friends={friends} />
      <FriendsTabs siteInfo={siteInfo} />
    </section>
  );
}
