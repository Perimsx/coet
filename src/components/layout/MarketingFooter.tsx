"use client";

import Link from "next/link";
import Image from "next/image";

export default function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="animate-spring-reveal delay-800 relative z-10 bg-background/40 backdrop-blur-md md:backdrop-blur-xl pt-12 pb-8 md:pt-16 md:pb-10 px-5 md:px-6 select-none border-t border-divider/20">
      <div className="max-w-5xl mx-auto flex flex-col">
        
        {/* 上半部：品牌标识与核心导航 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 md:pb-10 border-b border-divider/20">
          
          {/* 左：Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity group w-fit">
            <Image
              src="/logo.png"
              alt="序栈"
              width={20}
              height={20}
              className="w-5 h-5 object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
              unoptimized
            />
            <span className="font-sans text-xs sm:text-sm font-bold tracking-[0.2em] text-foreground uppercase">
              Sequence Stack
            </span>
          </Link>

          {/* 右：Navigation */}
          <nav className="flex items-center gap-6 sm:gap-8 text-[11px] font-mono tracking-widest font-semibold uppercase" aria-label="Footer Navigation">
            <Link href="/kb" className="text-foreground/60 hover:text-foreground transition-colors relative group py-1">
              Knowledge Base
              <span className="absolute left-0 bottom-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/manifesto" className="text-foreground/60 hover:text-foreground transition-colors relative group py-1">
              Manifesto
              <span className="absolute left-0 bottom-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
            </Link>
          </nav>
        </div>

        {/* 下半部：版权与合规信息 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pt-8 gap-6 lg:gap-4 text-[10px] text-foreground/40 font-mono tracking-widest uppercase">
          
          {/* 版权声明 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span suppressHydrationWarning>© {year} 序栈</span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-divider" />
            <span>All Rights Reserved.</span>
          </div>

          {/* 驱动与备案信息 */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-4 gap-y-2 opacity-80">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Powered by EdgeOne
            </span>
            <span className="text-divider hidden sm:inline">|</span>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors py-1 whitespace-nowrap"
            >
              鄂ICP备2025157857号
            </a>
            <span className="text-divider hidden sm:inline">|</span>
            <a
              href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=42018502008592"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors py-1 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              鄂公网安备 42018502008592号
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}
