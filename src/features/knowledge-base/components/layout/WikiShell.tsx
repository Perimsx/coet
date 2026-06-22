"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search as SearchIcon,
  List,
  ArrowLeft,
  ArrowRight,
  PanelLeftClose,
  PanelLeft,
  ChevronsUpDown,
  ChevronsDownUp,
  Sun,
  Moon,
  ExternalLink,
} from "lucide-react";
import { useUI } from '@/features/knowledge-base/context/ui-context';
import Sidebar from "../Sidebar";
import TableOfContents from "../TableOfContents";
import MobileDrawer from '@/features/knowledge-base/components/layout/MobileDrawer';
import Search from "../Search";
import { TreeNode } from '@/features/knowledge-base/lib/tree';
import { Tooltip } from '@/features/knowledge-base/components/ui/tooltip';
import { useMounted } from '@/features/knowledge-base/hooks/use-mounted';

interface WikiShellProps {
  tree: TreeNode[];
  children: React.ReactNode;
}

export default function WikiShell({ tree, children }: WikiShellProps) {
  const router = useRouter();
  const {
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    isMobileTOCOpen, setIsMobileTOCOpen,
    setIsSearchOpen,
    currentToc, pageTitle,
    expandedNodes, toggleExpandAll,
    theme, setTheme,
    sidebarFilter, setSidebarFilter,
  } = useUI();

  const mounted = useMounted();

  // Use mounted guard to prevent hydration mismatch for localStorage-derived state
  const hasExpanded = mounted ? Object.keys(expandedNodes).some((key) => expandedNodes[key]) : false;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 延迟从 localStorage 恢复侧边栏折叠状态，避免水合不匹配
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kb_sidebar_collapsed");
      if (saved === "true") {
        const timer = setTimeout(() => setIsSidebarCollapsed(true), 0);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleSidebar = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    try {
      localStorage.setItem("kb_sidebar_collapsed", String(collapsed));
    } catch (e) {
      console.warn("Failed to save sidebar collapsed state to localStorage:", e);
    }
  };

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  const hasToc = currentToc && currentToc.length > 0;

  return (
    <div className="h-dvh min-h-0 overflow-hidden flex flex-col bg-background text-foreground">
      {/* 跳转到内容 - 无障碍快捷链接 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-md focus:text-sm"
      >
        跳转到内容
      </a>
      {/* 移动端 Header - 学习自目标项目的现代 App Bar 设计 */}
      <header className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-divider/60 h-[3.25rem] shrink-0 flex items-center justify-between px-2 select-none no-print relative">
        {/* 左侧：菜单开关 */}
        <div className="flex items-center w-12 shrink-0">
          <button
            id="mobile-sidebar-toggle"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-[10px] text-foreground hover:text-accent hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-all focus:outline-none"
            aria-label="打开侧边目录"
          >
            <Menu size={20} strokeWidth={1.8} />
          </button>
        </div>

        {/* 中间：居中的页面标题（单行截断） */}
        <div className="absolute left-1/2 -translate-x-1/2 max-w-[55%] flex items-center justify-center pointer-events-none">
          {pageTitle ? (
            <span className="text-[0.95rem] font-bold text-foreground truncate block text-center tracking-tight pointer-events-auto px-2">
              {pageTitle}
            </span>
          ) : (
            <Link
              href="/kb"
              className="flex items-center gap-2 font-sans text-sm sm:text-base tracking-tight font-bold text-foreground pointer-events-auto"
            >
              <Image src="/logo.png" alt="序栈" width={20} height={20} className="w-5 h-5 object-contain mix-blend-multiply dark:mix-blend-screen rounded-sm" unoptimized />
              <span>序栈知识库</span>
            </Link>
          )}
        </div>

        {/* 右侧：功能按钮 */}
        <div className="flex items-center justify-end gap-1 shrink-0 w-[88px]">
          <button
            id="mobile-search-toggle"
            onClick={() => setIsSearchOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-[10px] text-foreground hover:text-accent hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-all focus:outline-none"
            aria-label="搜索"
          >
            <SearchIcon size={18} strokeWidth={1.8} />
          </button>

          {hasToc ? (
            <button
              id="mobile-toc-toggle"
              onClick={() => setIsMobileTOCOpen(!isMobileTOCOpen)}
              className={`w-10 h-10 flex items-center justify-center rounded-[10px] text-foreground transition-all duration-200 focus:outline-none ${
                isMobileTOCOpen ? "rotate-90 bg-foreground/5 text-accent" : "hover:text-accent hover:bg-foreground/5 dark:hover:bg-foreground/10"
              }`}
              aria-label="切换本页大纲"
            >
              <List size={20} strokeWidth={1.8} />
            </button>
          ) : (
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-[10px] text-foreground hover:text-accent hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-all focus:outline-none"
              aria-label="切换主题"
            >
              {mounted ? (theme === "dark" ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />) : <div className="w-[18px] h-[18px]" />}
            </button>
          )}
        </div>

        {/* 移动端手风琴式 TOC 下拉层 */}
        {hasToc && (
          <div
            className={`absolute top-full left-0 w-full bg-background border-b border-divider/40 shadow-xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-30 ${
              isMobileTOCOpen ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0 border-b-0"
            }`}
          >
            <div className="overflow-y-auto max-h-[70vh] p-4">
              <TableOfContents toc={currentToc} onNavigate={() => setIsMobileTOCOpen(false)} />
            </div>
          </div>
        )}
      </header>

      {/* 主内容区 */}
      <div className="flex-1 min-h-0 flex max-w-[1440px] w-full mx-auto px-4 md:px-6 lg:px-8 overflow-hidden">
        
        {/* 左侧侧边栏 - 桌面常驻，支持折叠与过渡动效 */}
        <aside
          aria-label="文档导航"
          className={`hidden md:flex flex-col border-r border-divider h-full select-none shrink-0 no-print transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
            isSidebarCollapsed ? "w-0 border-r-0 opacity-0" : "w-64 lg:w-72"
          }`}
        >
          <div className="w-64 lg:w-72 h-full flex flex-col pr-4 shrink-0">
            {/* 侧栏头部菜单 */}
            <div className="py-6 border-b border-divider/50 flex flex-col gap-4 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href="/kb"
                  className="flex items-center gap-2 font-sans text-base tracking-tight font-bold text-foreground hover:text-foreground/75 transition-colors"
                >
                  <Image src="/logo.png" alt="序栈" width={20} height={20} className="w-5 h-5 object-contain" unoptimized />
                  <span>序栈知识库</span>
                </Link>
                <div className="flex items-center gap-0.5">
                  <Tooltip content={hasExpanded ? "折叠所有目录" : "展开所有目录"}>
                    <button
                      suppressHydrationWarning
                      onClick={() => toggleExpandAll(tree)}
                      className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-colors cursor-pointer"
                      aria-label={hasExpanded ? "折叠所有目录" : "展开所有目录"}
                    >
                      {hasExpanded ? <ChevronsDownUp size={16} /> : <ChevronsUpDown size={16} />}
                    </button>
                  </Tooltip>
                  <Tooltip content="折叠侧边栏">
                    <button
                      suppressHydrationWarning
                      onClick={() => handleToggleSidebar(true)}
                      className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-colors cursor-pointer"
                      aria-label="折叠侧边栏"
                    >
                      <PanelLeftClose size={16} />
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* 搜索入口 */}
              <button
                id="desktop-search-btn"
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 border border-divider text-left text-sm text-foreground/60 hover:text-foreground hover:border-foreground/40 hover:bg-foreground/[0.02] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 cursor-pointer rounded-md shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <SearchIcon size={14} />
                  搜索文档...
                </span>
                <kbd className="text-[10px] opacity-60 font-mono bg-foreground/5 px-1.5 py-0.5 rounded border border-divider/50">Ctrl K</kbd>
              </button>
            </div>

            {/* 树状项目目录区 */}
            <div className="flex-1 overflow-y-auto min-h-0 relative group">
              {/* 顶部滚动遮罩渐变 */}
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="py-2">
                <input
                  type="text"
                  placeholder="筛选文档..."
                  value={sidebarFilter}
                  onChange={(e) => setSidebarFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-foreground/5 hover:bg-foreground/[0.08] focus:bg-foreground/[0.08] rounded-md text-foreground placeholder:text-foreground/40 border-0 focus:ring-0 focus:border-transparent focus:outline-none transition-colors mb-2"
                />
                <Sidebar tree={tree} />
              </div>
              {/* 底部滚动遮罩渐变 */}
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* 底部常驻回到官网 Portal 入口 */}
            <div className="mt-auto py-4 border-t border-divider/50 flex items-center justify-between gap-2 shrink-0">
              <Tooltip content="回到官网主站">
                <Link
                  suppressHydrationWarning
                  href="/"
                  className="flex flex-1 items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-colors cursor-pointer"
                >
                  <ExternalLink size={14} />
                  返回主站
                </Link>
              </Tooltip>
              <Tooltip content={theme === "dark" ? "切换到亮色主题" : "切换到暗色主题"}>
                <button
                  suppressHydrationWarning
                  onClick={toggleTheme}
                  className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-colors cursor-pointer shrink-0"
                  aria-label="切换主题"
                >
                  {mounted ? (theme === "dark" ? <Sun size={15} /> : <Moon size={15} />) : <div className="w-[15px] h-[15px]" />}
                </button>
              </Tooltip>
            </div>
          </div>
        </aside>

        {/* 中间正文区 */}
        <main id="main-content" className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto overscroll-contain flex justify-center py-4 md:py-6 px-0 sm:px-4 md:px-6 lg:px-8">
          <div className="w-full max-w-[820px] min-h-full flex flex-col">
            
            {/* 历史导航工具条 */}
            <div className="hidden md:flex items-center gap-2 mb-4 shrink-0 select-none">
              {isSidebarCollapsed && (
                <button
                  onClick={() => handleToggleSidebar(false)}
                  className="p-1 rounded-md text-foreground/60 hover:text-foreground hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-colors cursor-pointer mr-1"
                  title="展开侧边栏"
                >
                  <PanelLeft size={16} />
                </button>
              )}
              <button
                onClick={() => {
                  if (document.referrer.includes(window.location.host)) {
                    window.history.back();
                  } else {
                    router.push('/kb');
                  }
                }}
                className="p-1 rounded-md text-foreground/60 hover:text-foreground hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-colors cursor-pointer"
                title="后退"
                aria-label="后退"
              >
                <ArrowLeft size={15} />
              </button>
              <button
                onClick={() => window.history.forward()}
                className="p-1 rounded-md text-foreground/60 hover:text-foreground hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-colors cursor-pointer"
                title="前进"
                aria-label="前进"
              >
                <ArrowRight size={15} />
              </button>
            </div>

            {children}
          </div>
        </main>

        {/* 右侧大纲 - 桌面常驻 */}
        <aside aria-label="目录" className="hidden xl:flex xl:w-60 flex-col h-full select-none shrink-0 pl-6 pt-6 overflow-y-auto no-print">
          {hasToc && <TableOfContents toc={currentToc} />}
        </aside>
      </div>

      {/* 移动端侧边栏抽屉 */}
      <MobileDrawer
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        title="文章目录"
        side="left"
        headerContent={
          <>
            <Link
              href="/kb"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="flex items-center gap-2 font-sans text-sm tracking-tight font-bold text-foreground"
            >
              <Image src="/logo.png" alt="序栈" width={18} height={18} className="w-[18px] h-[18px] object-contain" unoptimized />
              <span>序栈知识库</span>
            </Link>
            <button
              onClick={() => toggleExpandAll(tree)}
              className="ml-auto p-1.5 rounded-md text-foreground/50 hover:text-foreground hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-colors cursor-pointer"
              aria-label={hasExpanded ? "折叠所有目录" : "展开所有目录"}
            >
              {hasExpanded ? <ChevronsDownUp size={15} /> : <ChevronsUpDown size={15} />}
            </button>
          </>
        }
      >

        {/* 筛选输入 */}
        <input
          type="text"
          placeholder="筛选文档..."
          value={sidebarFilter}
          onChange={(e) => setSidebarFilter(e.target.value)}
          className="w-full px-3 py-2.5 text-sm bg-foreground/5 hover:bg-foreground/[0.08] focus:bg-foreground/[0.08] rounded-md text-foreground placeholder:text-foreground/40 border-0 focus:ring-0 focus:border-transparent focus:outline-none transition-colors mb-2"
        />

        {/* 目录树 */}
        <Sidebar tree={tree} />

        {/* 底部：返回主站 + 主题切换（与桌面布局一致） */}
        <div className="mt-4 pt-3 border-t border-divider/50 flex items-center justify-between gap-2">
          <Link
            href="/"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex flex-1 items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-colors cursor-pointer"
          >
            <ExternalLink size={14} />
            返回主站
          </Link>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-foreground/5 dark:hover:bg-foreground/10 transition-colors cursor-pointer shrink-0"
            aria-label="切换主题"
          >
            {mounted ? (theme === "dark" ? <Sun size={15} /> : <Moon size={15} />) : <div className="w-[15px] h-[15px]" />}
          </button>
        </div>
      </MobileDrawer>

      {/* 全局搜索弹窗 */}
      <Search />
    </div>
  );
}
