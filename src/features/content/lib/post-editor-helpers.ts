export function normalizePostSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\.mdx?$/i, '')
    // 允许中文字符、字母、数字、空格和连字符
    .replace(/[^\u4e00-\u9fa5a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stripMarkdownToText(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^>\s+/gm, ' ')
    .replace(/^#{1,6}\s+/gm, ' ')
    .replace(/[*_~>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function suggestPostSlug(title: string) {
  return normalizePostSlug(title) || `post-${Date.now()}`
}

export function suggestPostSummary(content: string, maxLength = 140) {
  const plainText = stripMarkdownToText(content)
  if (!plainText) return ''

  if (plainText.length <= maxLength) {
    return plainText
  }

  return `${plainText.slice(0, maxLength).trim()}...`
}
