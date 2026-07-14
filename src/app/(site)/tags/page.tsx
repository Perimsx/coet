import { getTagData } from "@/features/content/lib/contentlayer-adapter";
import { genPageMetadata } from "@/features/site/lib/seo";
import TagsClient from "@/features/tags/components/TagsClient";
import { Metadata } from "next";


export async function generateMetadata(): Promise<Metadata> {
  return await genPageMetadata({
    title: "标签",
    description: "Kerntau 博客的全部文章标签索引。通过标签快速筛选网络安全、前端开发、全栈工程等技术方向的相关文章。",
    pathname: "/tags",
  });
}

export default async function TagsPage() {
  const tagData = getTagData();

  return <TagsClient tagCounts={tagData} />;
}
