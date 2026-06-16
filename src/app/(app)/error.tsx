"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, LayoutTemplate } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Terminal-style error card */}
      <div className="w-full max-w-md rounded-sm bg-foreground/[0.02] border border-foreground/[0.06] overflow-hidden mb-8">
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-foreground/[0.04]">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
          <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
          <span className="ml-2 text-[9px] font-mono text-foreground/25 uppercase tracking-wider">runtime error</span>
        </div>
        <div className="px-5 py-5">
          <h2 className="text-lg font-bold text-foreground mb-2">页面渲染异常</h2>
          <p className="text-sm text-foreground/50 mb-4">遇到了未预期的错误，请尝试刷新或返回。</p>
          <pre className="font-mono text-xs text-foreground/30 bg-foreground/[0.03] rounded-sm px-3 py-2 mb-5 text-left overflow-x-auto">
            &gt; {error.message || "Unknown error"}
          </pre>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="group inline-flex items-center gap-2 rounded-sm bg-foreground text-background px-9 py-3.5 text-xs font-semibold tracking-wider hover:bg-foreground/90 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(2,132,199,0.18)] active:scale-[0.98] transition-all duration-500 cubic-bezier(0.16,1,0.3,1) select-none shadow-sm cursor-pointer"
            >
              <RotateCcw size={14} className="group-hover:rotate-[-360deg] transition-transform duration-700" />
              重新加载
            </button>
            <Link
              href="/kb"
              className="inline-flex items-center gap-2 rounded-sm px-9 py-3.5 text-xs font-semibold tracking-wider text-foreground/75 border border-divider hover:text-foreground hover:border-foreground/30 hover:bg-foreground/[0.03] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 cubic-bezier(0.16,1,0.3,1) select-none"
            >
              <LayoutTemplate size={14} />
              返回列表
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
