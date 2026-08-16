import Image from "@/features/content/components/Image";
import { TooltipIconButton } from "@/shared/components/TooltipIconButton";
import type { ComponentType, SVGProps } from "react";
import { Globe, Send, MessageCircle as LucideMessageCircle, Link2 } from "lucide-react";
import {
  Mail,
  Github,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
  X,
  Mastodon,
  Threads,
  Instagram,
  Medium,
  Bluesky,
  Douyin,
  Bilibili,
  Yuque,
  Rss,
  MessageCircle,
  Key,
} from "./icons";

type SocialSvg = ComponentType<SVGProps<SVGSVGElement>>;

const builtinIcons: Record<string, SocialSvg> = {
  mail: Mail,
  github: Github,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Twitter,
  x: X,
  mastodon: Mastodon,
  threads: Threads,
  instagram: Instagram,
  medium: Medium,
  bluesky: Bluesky,
  douyin: Douyin,
  bilibili: Bilibili,
  yuque: Yuque,
  rss: Rss,
  wechat: MessageCircle,
  session: Key,
};

const lucideFallbacks: Record<string, SocialSvg> = {
  globe: Globe,
  send: Send,
  "message-circle": LucideMessageCircle,
  messagecircle: LucideMessageCircle,
  link: Link2,
  link2: Link2,
};

const iconAliases: Record<string, string> = {
  email: "mail",
  google: "globe",
  weibo: "globe",
  telegram: "send",
  discord: "message-circle",
};

export const SOCIAL_ICON_LIBRARY = {
  builtin: "social:<name>（内置品牌图标）",
  lucide: "lucide:<IconName>（Lucide React 图标库）",
  simple: "simple:<slug>（Simple Icons CDN）",
  image: "https://… 或 /path/to/icon.svg（自定义图片）",
} as const;

function normalizeIconName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function resolveLucideIcon(name: string): SocialSvg {
  const normalized = normalizeIconName(name.replace(/^lucide:/, ""));
  return lucideFallbacks[normalized] || Link2;
}

function resolveIcon(icon: string | undefined, kind: string) {
  const raw = icon?.trim() || kind.trim();
  const value = raw.startsWith("social:") ? raw.slice(7) : raw;
  const normalized = normalizeIconName(value);

  if (normalized.startsWith("lucide:")) {
    return { svg: resolveLucideIcon(normalized), image: "" };
  }
  if (normalized.startsWith("simple:")) {
    const slug = normalized.slice(7).replace(/[^a-z0-9-]/g, "");
    return {
      svg: null,
      image: slug ? `https://cdn.simpleicons.org/${slug}` : "",
    };
  }
  if (/^(?:https?:|data:|\/)/i.test(raw) && !raw.startsWith("social:")) {
    return { svg: null, image: raw };
  }
  const alias = iconAliases[normalized] || normalized;
  return {
    svg: builtinIcons[alias] || lucideFallbacks[alias] || Link2,
    image: "",
  };
}

type SocialIconProps = {
  kind: string;
  href?: string;
  size?: number;
  icon?: string;
  className?: string;
};

const SocialIcon = ({
  kind,
  href,
  size = 8,
  icon,
  className = "",
}: SocialIconProps) => {
  const iconKind = icon?.startsWith("social:")
    ? icon.replace(/^social:/, "")
    : kind;
  const resolved = resolveIcon(icon, iconKind);
  const SocialSvg = resolved.svg;
  const iconSize = `${size * 0.25}rem`;

  if (
    href &&
    kind === "mail" &&
    !/^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(href)
  ) {
    return null;
  }

  const content = resolved.image ? (
    <span className="relative block h-full w-full">
      <Image
        src={resolved.image}
        alt={iconKind}
        fill
        sizes={iconSize}
        className="object-contain"
      />
    </span>
  ) : SocialSvg ? (
    <>
      <span className="sr-only">{kind}</span>
      <SocialSvg
        className="fill-current transition-transform group-hover:rotate-12"
        style={{ width: "100%", height: "100%" }}
      />
    </>
  ) : null;

  if (!content) return null;

  if (!href) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: iconSize, height: iconSize }}
      >
        {content}
      </div>
    );
  }

  return (
    <TooltipIconButton label={kind} side="bottom">
      <a
        className={`inline-flex items-center justify-center text-sm transition ${className}`}
        target="_blank"
        rel="noopener noreferrer"
        href={href}
        style={{ width: iconSize, height: iconSize }}
      >
        {content}
      </a>
    </TooltipIconButton>
  );
};

export default SocialIcon;
