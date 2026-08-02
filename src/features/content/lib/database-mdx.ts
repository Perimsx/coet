import 'server-only'

import { bundleMDX } from 'mdx-bundler'

export async function compileDatabaseMDX(source: string): Promise<string> {
  const result = await bundleMDX({ source, cwd: process.cwd() })
  return result.code
}

export function databaseToc(source: string) {
  return source.split('\n').flatMap((line) => {
    const match = /^(#{2,4})\s+(.+?)\s*$/.exec(line)
    if (!match) return []
    const value = match[2].replace(/[`*_]/g, '')
    return [{ value, url: `#${value.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-')}`, depth: match[1].length }]
  })
}
