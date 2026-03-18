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
} from './icons'

const components = {
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
}

type SocialIconProps = {
  kind: string
  href?: string
  size?: number
  icon?: string
  className?: string
}

const SocialIcon = ({ kind, href, size = 8, icon, className = "" }: SocialIconProps) => {
  const iconKind = icon?.startsWith('social:') ? icon.replace(/^social:/, '') : kind
  const SocialSvg = components[iconKind as keyof typeof components]
  const iconSize = `${size * 0.25}rem`

  if (href && kind === 'mail' && !/^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(href)) {
    return null
  }

  const content =
    icon && !icon.startsWith('social:') ? (
      <img src={icon} alt={iconKind} className="w-full h-full object-contain" />
    ) : SocialSvg ? (
      <>
        <span className="sr-only">{kind}</span>
        <SocialSvg
          className="fill-current transition-transform group-hover:rotate-12"
          style={{ width: '100%', height: '100%' }}
        />
      </>
    ) : null

  if (!content) return null

  if (!href) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: iconSize, height: iconSize }}
      >
        {content}
      </div>
    )
  }

  return (
    <a
      className={`inline-flex items-center justify-center text-sm transition ${className}`}
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      style={{ width: iconSize, height: iconSize }}
      title={kind}
    >
      {content}
    </a>
  )
}

export default SocialIcon
