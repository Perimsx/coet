"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, LayoutTemplate, ArrowLeft } from "lucide-react";
import useLocaleDictionary from "@/shared/hooks/useLocaleDictionary";
import ErrorPageShell from "@/app/error-page-shell";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dictionary = useLocaleDictionary();
  const t = dictionary.errors;

  useEffect(() => {
    console.error("Global Layout Error Boundary:", error);
  }, [error]);

  return (
    <html lang="zh-CN" className="h-full" suppressHydrationWarning>
      <head>
        <title>System Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-accent selection:text-white">
        <ErrorPageShell>
          <div className="animate-spring-reveal font-mono text-xs sm:text-sm tracking-[0.2em] text-foreground/25 uppercase mb-8">
            SYSTEM EXCEPTION · CODE 500
          </div>

          <h1 className="animate-text-focus-in delay-100 font-sans text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-foreground via-foreground to-accent bg-clip-text text-transparent">
            {t.globalErrorTitle}
          </h1>

          <p className="animate-text-focus-in delay-200 text-sm sm:text-base text-foreground/60 tracking-wide leading-relaxed mb-8">
            {t.globalErrorDesc}
          </p>

          <div className="animate-spring-reveal delay-300 w-full max-w-md mb-8">
            <div className="rounded-sm bg-foreground/[0.02] border border-foreground/[0.06] backdrop-blur-md overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-foreground/[0.04]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                <span className="ml-2 text-[9px] font-mono text-foreground/25 uppercase tracking-wider">system.log</span>
              </div>
              <pre className="px-4 py-3 font-mono text-xs text-foreground/40 overflow-x-auto text-left">
                <code>&gt; {error.message || "Root Layout Render Error"}</code>
                {error.digest && (
                  <code className="block mt-1 text-foreground/20">digest: {error.digest}</code>
                )}
              </pre>
            </div>
          </div>

          <div className="animate-spring-reveal delay-400 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-8">
            <button
              onClick={reset}
              className="group flex items-center justify-center gap-2 w-full sm:w-auto rounded-sm bg-foreground text-background px-9 py-3.5 text-xs font-semibold tracking-wider hover:bg-foreground/90 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(2,132,199,0.18)] active:scale-[0.98] transition-all duration-500 cubic-bezier(0.16,1,0.3,1) select-none shadow-sm cursor-pointer"
            >
              <RotateCcw size={14} className="group-hover:rotate-[-360deg] transition-transform duration-700" />
              {t.reload}
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-sm px-9 py-3.5 text-xs font-semibold tracking-wider text-foreground/75 border border-divider hover:text-foreground hover:border-foreground/30 hover:bg-foreground/[0.03] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 cubic-bezier(0.16,1,0.3,1) select-none"
            >
              <LayoutTemplate size={14} />
              {t.goHome}
            </Link>
            <Link
              href="/blog"
              className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-sm px-9 py-3.5 text-xs font-semibold tracking-wider text-foreground/75 border border-divider hover:text-foreground hover:border-foreground/30 hover:bg-foreground/[0.03] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 cubic-bezier(0.16,1,0.3,1) select-none"
            >
              <ArrowLeft size={14} />
              {t.backToBlog}
            </Link>
          </div>

          <p className="animate-fade-in delay-600 text-[10px] font-mono text-foreground/20 tracking-wider">
            {t.cacheHint}
          </p>
        </ErrorPageShell>
      </body>
    </html>
  );
}
