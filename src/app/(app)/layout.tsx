import { posts } from "#content";
import { buildDocTree } from '@kb/lib/tree';
import WikiShell from '@kb/components/layout/WikiShell';
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { TooltipProvider } from "@kb/components/ui/Tooltip";
import { UIProvider } from "@kb/context/UIContext";

// 这个布局只会在访问 /kb 或其子路由时生效
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 服务端静态构建目录树
  const docTree = buildDocTree(posts);

  return (
    <>
      {/* 搜索索引仅在知识库路由下预加载，避免 marketing 页面触发浏览器警告 */}
      <link rel="preload" href="/search-index.json" as="fetch" crossOrigin="anonymous" />
      <NuqsAdapter>
        <UIProvider>
          <TooltipProvider>
            <WikiShell tree={docTree}>{children}</WikiShell>
          </TooltipProvider>
        </UIProvider>
      </NuqsAdapter>
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
