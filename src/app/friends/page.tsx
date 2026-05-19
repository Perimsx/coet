import type { Metadata } from "next";
import { genPageMetadata } from "@/app/seo";
import FriendsClient from "@/features/friends/components/FriendsClient";

export async function generateMetadata(): Promise<Metadata> {
  return await genPageMetadata({
    title: "友链",
    description: "kerntau 的友情链接页面。目前友链系统正在升级中。",
    pathname: "/friends",
  });
}

export default function FriendsPage() {
  return <FriendsClient />;
}
