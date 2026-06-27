import { readFileSync } from 'fs'
import { join } from 'path'

export type Friend = {
  name: string
  url: string
  avatar: string
  description: string
  group?: string
}

export function getPublishedFriends(): Friend[] {
  try {
    const filePath = join(process.cwd(), 'content', 'friends.json')
    const raw = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw) as Friend[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}
