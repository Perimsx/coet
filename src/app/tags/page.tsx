import { getTagData } from "@/features/content/lib/contentlayer-adapter";
import { genPageMetadata } from "@/app/seo";
import TagsClient from "@/features/tags/components/TagsClient";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return await genPageMetadata({
    title: "标签归档",
    description: "聚合 Chen Guitao's Blog 站内所有技术领域标签。涵盖前端工程化实战、网络安全技术笔记、开发者工具与全栈开发心得等多维度的知识体系索引。",
    pathname: "/tags",
  });
}

export default async function TagsPage() {
  const tagData = getTagData();

  return <TagsClient tagCounts={tagData} />;
}
