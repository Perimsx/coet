import Link from "next/link";
import Image from "next/image";

interface MarketingHeaderProps {
  activePath?: string;
}

export default function MarketingHeader({ activePath = "/" }: MarketingHeaderProps) {
  const getLinkClass = (path: string) => {
    const isActive = activePath === path;
    return `px-3 py-1.5 rounded-sm transition-all duration-300 ${
      isActive
        ? "text-foreground bg-foreground/5 font-semibold"
        : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
    }`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/60 backdrop-blur-xl border-b border-divider/30 select-none no-print transition-all duration-300">
      <div className="max-w-5xl mx-auto h-full px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="序栈"
            width={22}
            height={22}
            className="w-5.5 h-5.5 object-contain opacity-90 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-110 group-hover:rotate-3 mix-blend-multiply dark:mix-blend-screen rounded-sm"
            unoptimized
          />
          <span className="font-sans text-sm tracking-widest font-bold text-foreground">
            序栈<sup className="text-[8px] ml-0.5 align-super">®</sup>
          </span>
        </Link>

        <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-mono tracking-wider font-semibold uppercase">
          <Link href="/" className={getLinkClass("/")}>
            主页
          </Link>
          <Link href="/kb" className={getLinkClass("/kb")}>
            知识库
          </Link>
          <Link href="/manifesto" className={getLinkClass("/manifesto")}>
            发刊词
          </Link>
        </nav>
      </div>
    </header>
  );
}
