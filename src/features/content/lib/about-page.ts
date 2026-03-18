import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

const aboutFilePath = path.join(process.cwd(), 'content', 'authors', 'default.md')

export type AboutPageData = {
  frontmatter: Record<string, unknown>
  content: string
}

function normalize(value: unknown, max = 240) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

export async function getAboutPageData(): Promise<AboutPageData> {
  const raw = await fs.readFile(aboutFilePath, 'utf8')
  const parsed = matter(raw)
  return {
    frontmatter: parsed.data || {},
    content: parsed.content || '',
  }
}

export async function saveAboutPageData(input: {
  name: string
  email?: string
  avatar?: string
  socials?: Array<{ platform: string; url: string; icon?: string }>
  techStacks?: Array<{ name: string; level?: string; icon?: string }>
  birthYear?: number
  birthMonth?: number
  showBirthday?: boolean
  content: string
}) {
  const current = await getAboutPageData()
  
  // 清理老旧的平铺社交字段以保持 frontmatter 干净
  const { 
    twitter, bluesky, linkedin, github, douyin, bilibili,
    ...cleanFrontmatter 
  } = current.frontmatter as any

  const nextFrontmatter = {
    ...cleanFrontmatter,
    name: normalize(input.name, 120),
    email: normalize(input.email, 120),
    avatar: normalize(input.avatar, 300),
    birthYear: input.birthYear,
    birthMonth: input.birthMonth,
    showBirthday: input.showBirthday ?? true,
    socials: (input.socials || [])
      .map((item) => ({
        platform: normalize(item.platform, 40),
        url: normalize(item.url, 300),
        icon: normalize(item.icon, 300),
      }))
      .filter((item) => item.platform && item.url),
    techStacks: (input.techStacks || [])
      .map((item) => ({
        name: normalize(item.name, 80),
        level: normalize(item.level, 60),
        icon: normalize(item.icon, 300),
      }))
      .filter((item) => item.name),
  }

  const nextSource = matter.stringify((input.content || '').trim(), nextFrontmatter)
  await fs.writeFile(aboutFilePath, nextSource, 'utf8')
}
