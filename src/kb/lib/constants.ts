import { siteMetadata } from "@/blog.config";

export const SITE_NAME = "序栈";
export const SITE_URL = siteMetadata.siteUrl;

export const categoryMap: Record<string, string> = {
  "c-modern-approach": "C语言现代方法",
  "c-notes": "C语言笔记",
  "c-review": "C语言复习",
  "c-traps": "C陷阱与缺陷",
  "c-games": "C语言实战",
};
