import type { Metadata } from "next";
import { posts } from "#content";
import HomeContent from '@/features/knowledge-base/components/HomeContent';
import { sortByDate } from '@/features/knowledge-base/lib/tree';
import { categoryMap } from '@/features/knowledge-base/lib/constants';
import { siteMetadata } from "@/blog.config";

export const metadata: Metadata = {
  title: "文章列表",
  description: "浏览序栈的精选文档，内容涵盖系统安全、渗透测试、底层架构设计以及现代全栈工程。以严谨的逻辑记录技术推演，还原纯粹的白纸黑字。",
  keywords: ["序栈文档", "技术自留地", "系统安全", "全栈开发", "知识库", "渗透日志"],
  openGraph: {
    title: "文章列表 | 序栈",
    description: "浏览序栈的精选文档，内容涵盖系统安全、渗透测试、底层架构设计以及现代全栈工程。",
    url: `${siteMetadata.siteUrl}/kb`,
    siteName: "序栈",
    images: [{ url: "/og-image.jpg", width: 1045, height: 1045 }],
  },
};

export default function HomePage() {
  // 提取去重后的分类并进行排序（确保分类按钮排序符合树的顺序）
  const categories = Array.from(
    new Set(posts.map((p) => p.category).filter((c): c is string => !!c))
  ).sort((a, b) => {
    const keys = Object.keys(categoryMap);
    const getIndex = (key: string) => {
      const index = keys.indexOf(key);
      return index === -1 ? 999 : index;
    };
    return getIndex(a) - getIndex(b);
  });

  // 在服务端预排序，同时剔除大体积的 content 字段以减小客户端 RSC Payload 体积
  const sortedPosts = sortByDate(posts.map((p) => ({
    title: p.title,
    slug: p.slug,
    permalink: p.permalink,
    category: p.category,
    description: p.description,
    date: p.date ?? "",
  })));

  return (
    <HomeContent
      posts={sortedPosts}
      categories={categories}
    />
  );
}
