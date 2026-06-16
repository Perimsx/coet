import type { Metadata } from "next";
import ManifestoContent from "@/components/marketing/ManifestoContent";

export const metadata: Metadata = {
  title: "发刊词：代码、边界与工程实践",
  description: "序栈技术发刊词。剥离过度工程化的包装，回归代码与逻辑的本源。",
  keywords: ["发刊词", "序栈宣言", "技术思辨", "底层原理", "极客精神"],
  openGraph: {
    title: "发刊词：代码、边界与工程实践 | 序栈",
    description: "序栈技术发刊词。剥离过度工程化的包装，回归代码与逻辑的本源。",
    url: "https://cot.wiki/manifesto/",
    siteName: "序栈",
    images: [{ url: "/og-image.jpg", width: 1045, height: 1045 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "发刊词：代码、边界与工程实践 | 序栈",
    description: "序栈技术发刊词。剥离过度工程化的包装，回归代码与逻辑的本源。",
    images: ["/og-image.jpg"],
  },
};

export default function ManifestoPage() {
  return <ManifestoContent />;
}
