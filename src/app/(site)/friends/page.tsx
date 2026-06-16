import type { Metadata } from "next";
import { genPageMetadata } from "@/app/seo";
import FriendsClient from "@/features/friends/components/FriendsClient";

export async function generateMetadata(): Promise<Metadata> {
  return await genPageMetadata({
    title: "友链",
    description: "系统升级中，暂不开放友链功能。如有想法意见联系 cotovo@163.com",
    pathname: "/friends",
  });
}

export default function FriendsPage() {
  return <FriendsClient />;
}
