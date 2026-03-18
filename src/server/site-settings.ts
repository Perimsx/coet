import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import siteMetadata from '@/config/site'

export type SiteSettings = {
  title: string
  headerTitle: string
  description: string
  email: string
  github: string
  x: string
  yuque: string
  icp: string
  policeBeian: string
  siteUrl: string
  seoKeywords: string
  socialBanner: string
  welcomeMessage: string
  googleSearchConsole: string
  siteCreatedAt: string
}

const settingsFilePath = path.join(process.cwd(), 'storage', 'settings', 'site-settings.json')

function defaultSettings(): SiteSettings {
  return {
    title: siteMetadata.title || '',
    headerTitle:
      typeof siteMetadata.headerTitle === 'string'
        ? siteMetadata.headerTitle
        : siteMetadata.title || '',
    description: siteMetadata.description || '',
    email: siteMetadata.email || '',
    github: siteMetadata.github || '',
    x: siteMetadata.x || '',
    yuque: siteMetadata.yuque || '',
    icp: '',
    policeBeian: '',
    siteUrl: siteMetadata.siteUrl || '',
    seoKeywords: '',
    socialBanner: siteMetadata.socialBanner || '',
    welcomeMessage: '',
    googleSearchConsole: (siteMetadata as any).googleSearchConsole || '',
    siteCreatedAt: (siteMetadata as any).siteCreatedAt || '2025-11-10 00:07:03',
  }
}

function normalize(value: unknown, max = 300) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const base = defaultSettings()
  try {
    const raw = await fs.readFile(settingsFilePath, 'utf8')
    const parsed = JSON.parse(raw) as Partial<SiteSettings>
    return {
      title: normalize(parsed.title, 120) || base.title,
      headerTitle: normalize(parsed.headerTitle, 120) || base.headerTitle,
      description: normalize(parsed.description, 300) || base.description,
      email: normalize(parsed.email, 120) || base.email,
      github: normalize(parsed.github, 240) || base.github,
      x: normalize(parsed.x, 240) || base.x,
      yuque: normalize(parsed.yuque, 240) || base.yuque,
      icp: normalize(parsed.icp, 120),
      policeBeian: normalize(parsed.policeBeian, 120),
      siteUrl: normalize(parsed.siteUrl, 120) || base.siteUrl,
      seoKeywords: normalize(parsed.seoKeywords, 500),
      socialBanner: normalize(parsed.socialBanner, 240) || base.socialBanner,
      welcomeMessage: normalize(parsed.welcomeMessage, 500) || base.welcomeMessage,
      googleSearchConsole: normalize(parsed.googleSearchConsole, 240) || base.googleSearchConsole,
      siteCreatedAt: normalize(parsed.siteCreatedAt, 100) || base.siteCreatedAt,
    }
  } catch {
    return base
  }
}

export async function saveSiteSettings(next: Partial<SiteSettings>) {
  const current = await getSiteSettings()
  const merged: SiteSettings = {
    title: normalize(next.title, 120) || current.title,
    headerTitle: normalize(next.headerTitle, 120) || current.headerTitle,
    description: normalize(next.description, 300) || current.description,
    email: normalize(next.email, 120),
    github: normalize(next.github, 240),
    x: normalize(next.x, 240),
    yuque: normalize(next.yuque, 240),
    icp: normalize(next.icp, 120),
    policeBeian: normalize(next.policeBeian, 120),
    siteUrl: normalize(next.siteUrl, 120),
    seoKeywords: normalize(next.seoKeywords, 500),
    socialBanner: normalize(next.socialBanner, 240),
    welcomeMessage: normalize(next.welcomeMessage, 500),
    googleSearchConsole: normalize(next.googleSearchConsole, 240),
    siteCreatedAt: normalize(next.siteCreatedAt, 100),
  }
  await fs.writeFile(settingsFilePath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')
  return merged
}
