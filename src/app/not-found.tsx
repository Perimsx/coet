import Link from "next/link";
import { ChevronRight, LayoutTemplate, ArrowLeft, Search } from "lucide-react";
import RecentPostsList from "@/components/RecentPostsList";
import { getDictionary } from "@/shared/utils/i18n";
import ErrorPageShell from "@/app/error-page-shell";

export default function NotFound() {
  const dictionary = getDictionary("zh");
  const t = dictionary.errors;

  return (
    <ErrorPageShell>
      <div className="animate-spring-reveal font-mono text-xs sm:text-sm tracking-[0.2em] text-foreground/25 uppercase mb-8">
        HTTP/1.1 · 404 · Not Found
      </div>

      <h1 className="animate-text-focus-in delay-100 font-sans text-[140px] sm:text-[200px] md:text-[260px] lg:text-[300px] font-extrabold tracking-[-0.06em] leading-none select-none mb-6 bg-gradient-to-b from-foreground via-foreground/70 to-foreground/10 bg-clip-text text-transparent">
        404
      </h1>

      <p className="animate-text-focus-in delay-200 text-sm sm:text-base text-foreground/60 tracking-wide leading-relaxed mb-2">
        {t.notFoundDesc}
      </p>
      <p className="animate-text-focus-in delay-300 text-xs text-foreground/35 mb-10">
        {t.notFoundHint}
      </p>

      <div className="animate-spring-reveal delay-300 w-full max-w-sm mb-8">
        <Link
          href="/"
          className="group w-full flex items-center px-4 py-3 bg-foreground/[0.02] border border-foreground/[0.06] backdrop-blur-md rounded-sm text-sm text-foreground/40 hover:text-foreground/60 hover:border-foreground/[0.12] transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            <Search size={14} />
            {t.searchPosts}
          </span>
        </Link>
      </div>

      <div className="animate-spring-reveal delay-400 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-14">
        <Link
          href="/"
          className="group relative flex items-center justify-center gap-2.5 w-full sm:w-auto rounded-sm bg-foreground text-background px-9 py-3.5 text-xs font-semibold tracking-wider hover:bg-foreground/90 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(2,132,199,0.18)] active:scale-[0.98] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) select-none shadow-sm"
        >
          <LayoutTemplate className="w-3.5 h-3.5 stroke-[2] relative z-10" />
          <span className="relative z-10">{t.goHome}</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) group-hover:translate-x-1 relative z-10" />
        </Link>
        <Link
          href="/blog"
          className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-sm border border-divider px-9 py-3.5 text-xs font-semibold tracking-wider text-foreground/75 hover:text-foreground hover:border-foreground/30 hover:bg-foreground/[0.03] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t.backToBlog}
        </Link>
      </div>

      <RecentPostsList />
    </ErrorPageShell>
  );
}
