import { techStack } from '@/blog.config'

export type AboutSocialItem = {
  platform: string
  url: string
  icon?: string
}

export type AboutTechItem = {
  name: string
  level?: string
  icon?: string
}

/**
 * 关于页个人资料视图模型 (AboutProfileViewModel)
 */
export type AboutProfileViewModel = {
  name: string
  avatar: string
  email: string
  ageLabel: string
  headline: string
  socials: Array<
    AboutSocialItem & {
      label: string
      displayText: string
    }
  >
  techStacks: Array<
    AboutTechItem & {
      iconSrc?: string
    }
  >
  stats: Array<{
    label: string
    value: string
  }>
}

const SOCIAL_LABELS: Record<string, { zh: string; en: string }> = {
  github: { zh: 'GitHub', en: 'GitHub' },
  twitter: { zh: 'Twitter', en: 'Twitter' },
  x: { zh: 'X', en: 'X' },
  mail: { zh: '邮箱', en: 'Email' },
  facebook: { zh: 'Facebook', en: 'Facebook' },
  youtube: { zh: 'YouTube', en: 'YouTube' },
  linkedin: { zh: 'LinkedIn', en: 'LinkedIn' },
  instagram: { zh: 'Instagram', en: 'Instagram' },
  medium: { zh: 'Medium', en: 'Medium' },
  mastodon: { zh: 'Mastodon', en: 'Mastodon' },
  threads: { zh: 'Threads', en: 'Threads' },
  bluesky: { zh: 'Bluesky', en: 'Bluesky' },
  douyin: { zh: '抖音', en: 'Douyin' },
  bilibili: { zh: 'Bilibili', en: 'Bilibili' },
  yuque: { zh: '语雀', en: 'Yuque' },
  rss: { zh: 'RSS', en: 'RSS' },
}

type AboutSource = {
  name?: unknown
  avatar?: unknown
  email?: unknown
  birthYear?: unknown
  birthMonth?: unknown
  showBirthday?: unknown
  socials?: unknown
  techStacks?: unknown
  github?: unknown
  twitter?: unknown
  x?: unknown
  facebook?: unknown
  youtube?: unknown
  linkedin?: unknown
  instagram?: unknown
  medium?: unknown
  mastodon?: unknown
  threads?: unknown
  bluesky?: unknown
  douyin?: unknown
  bilibili?: unknown
  yuque?: unknown
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function readNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

/**
 * 根据出生年月计算并生成年龄标签（如：25 岁）
 */
function getAboutAgeLabel(birthYear?: number, birthMonth?: number, locale: 'zh' | 'en' = 'zh') {
  if (!birthYear || !birthMonth || birthMonth < 1 || birthMonth > 12) return ''

  const now = new Date()
  const age = now.getFullYear() - birthYear - (now.getMonth() + 1 < birthMonth ? 1 : 0)

  if (age < 0 || age > 120) return ''
  return locale === 'en' ? `${age} years old` : `${age} 岁`
}

function getSocialPlatformLabel(platform: string, locale: 'zh' | 'en' = 'zh') {
  return SOCIAL_LABELS[platform]?.[locale] || SOCIAL_LABELS[platform]?.zh || platform
}

function normalizeMailUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('mailto:')) return url
  return /^\S+@\S+\.\S+$/.test(url) ? `mailto:${url}` : url
}

function normalizeSocialUrl(platform: string, url: string) {
  if (platform === 'mail') {
    return normalizeMailUrl(url)
  }

  return url.trim()
}

function buildLegacySocials(source: AboutSource) {
  const legacyEntries = [
    ['mail', readString(source.email)],
    ['github', readString(source.github)],
    ['x', readString(source.x)],
    ['twitter', readString(source.twitter)],
    ['linkedin', readString(source.linkedin)],
    ['bluesky', readString(source.bluesky)],
    ['instagram', readString(source.instagram)],
    ['facebook', readString(source.facebook)],
    ['youtube', readString(source.youtube)],
    ['medium', readString(source.medium)],
    ['mastodon', readString(source.mastodon)],
    ['threads', readString(source.threads)],
    ['douyin', readString(source.douyin)],
    ['bilibili', readString(source.bilibili)],
    ['yuque', readString(source.yuque)],
  ] as const

  return legacyEntries
    .map(([platform, url]) => ({
      platform,
      url: normalizeSocialUrl(platform, url),
      icon: '',
    }))
    .filter((item) => item.url)
}

function normalizeAboutSocials(source: AboutSource) {
  const items = Array.isArray(source.socials) ? source.socials : []
  const normalizedItems = items
    .map((item) => {
      const current = item as AboutSocialItem
      const platform = readString(current.platform)
      const url = normalizeSocialUrl(platform, readString(current.url))
      const icon = readString(current.icon)

      return {
        platform,
        url,
        icon,
      }
    })
    .filter((item) => item.platform && item.url)

  return normalizedItems.length > 0 ? normalizedItems : buildLegacySocials(source)
}

function normalizeAboutTechStacks(source: AboutSource) {
  const items = Array.isArray(source.techStacks) ? source.techStacks : []

  return items
    .map((item) => {
      const current = item as AboutTechItem
      const name = readString(current.name)
      const level = readString(current.level)
      const customIcon = readString(current.icon)
      const iconSrc =
        customIcon ||
        techStack.find((tech) => tech.name.toLowerCase() === name.toLowerCase())?.icon

      return {
        name,
        level,
        icon: customIcon,
        iconSrc,
      }
    })
    .filter((item) => item.name)
}

function formatSocialDisplayText(url: string) {
  if (!url) return ''
  if (url.startsWith('mailto:')) {
    return url.replace(/^mailto:/, '')
  }

  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
}

/**
 * 构建“关于我”页面的视图模型
 * 包含基础信息、年龄、社交链接、技术栈及统计数据。建议修复错误。
 */
export function buildAboutProfileViewModel(source: AboutSource, locale: 'zh' | 'en' = 'zh'): AboutProfileViewModel {
  const name = readString(source.name) || 'About'
  const avatar = readString(source.avatar)
  const email = readString(source.email)
  const birthYear = readNumber(source.birthYear)
  const birthMonth = readNumber(source.birthMonth)
  const showBirthday = source.showBirthday !== false
  const ageLabel = showBirthday ? getAboutAgeLabel(birthYear, birthMonth, locale) : ''
  const socials = normalizeAboutSocials(source).map((item) => ({
    ...item,
    label: getSocialPlatformLabel(item.platform, locale),
    displayText: formatSocialDisplayText(item.url),
  }))
  const techStacks = normalizeAboutTechStacks(source)
  const headline = ageLabel

  const STATS_LABELS = {
    zh: { socialChannels: '社交渠道', techStack: '技术栈', currentStatus: '当前状态', updating: '持续更新中' },
    en: { socialChannels: 'Social Channels', techStack: 'Tech Stack', currentStatus: 'Status', updating: 'Continuously Updated' },
  }
  const sl = STATS_LABELS[locale]

  const stats = [
    {
      label: sl.socialChannels,
      value: String(socials.length),
    },
    {
      label: sl.techStack,
      value: String(techStacks.length),
    },
    {
      label: sl.currentStatus,
      value: sl.updating,
    },
  ]

  return {
    name,
    avatar,
    email,
    ageLabel,
    headline,
    socials,
    techStacks,
    stats,
  }
}
