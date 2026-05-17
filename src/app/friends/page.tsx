import type { Metadata } from "next";
import PageHeader from "@/shared/components/PageHeader";
import { genPageMetadata } from "@/app/seo";

export async function generateMetadata(): Promise<Metadata> {
  return await genPageMetadata({
    title: "友链",
    description: "kerntau 的友情链接页面。目前友链系统正在升级中。",
    pathname: "/friends",
  });
}

export default function FriendsPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-4 pb-12 sm:pt-6 sm:pb-16 sm:px-6 lg:px-8">
      <PageHeader
        title="友链"
        meta="欢迎通过邮件联系交换友链"
      />

      <div className="mt-20 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center">
          <span className="text-3xl">🤝</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">友链系统正在升级</h3>
          <p className="max-w-md text-muted-foreground">
            为了提供更稳定的访问体验，我们正在对友链系统进行静态化迁移。目前暂不支持在线申请，如有交换需求请发送邮件至博主邮箱。
          </p>
        </div>
      </div>
    </section>
  );
}
