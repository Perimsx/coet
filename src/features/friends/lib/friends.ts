export type Friend = {
  id: number
  name: string
  url: string
  avatar: string
  description: string
  status: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export async function getPublishedFriends(): Promise<Friend[]> {
  // 在 SSG 模式下，如果需要友人链，建议使用静态 JSON 或 Markdown。
  // 暂时返回空数组以确保构建通过。
  return []
}
