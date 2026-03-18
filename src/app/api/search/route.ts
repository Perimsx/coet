import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import { NextRequest } from 'next/server'
import siteMetadata from '@/config/site'

type SearchDocument = {
  path: string
  title: string
  summary?: string
  date: string
  tags?: string[]
  categories?: string[]
  slug?: string
}

function resolveSearchIndexFile() {
  const searchConfig = siteMetadata?.search
  if (!searchConfig || searchConfig.provider !== 'kbar' || !('kbarConfig' in searchConfig)) {
    return ''
  }

  const searchPath = searchConfig.kbarConfig?.searchDocumentsPath
  if (!searchPath || typeof searchPath !== 'string') return ''
  return path.join(process.cwd(), 'public', path.basename(searchPath))
}

export async function GET(request: NextRequest) {
  const filePath = resolveSearchIndexFile()
  if (!filePath) {
    return Response.json([])
  }

  try {
    const payload = await fs.readFile(filePath, 'utf8')
    const docs = JSON.parse(payload) as SearchDocument[]
    if (!Array.isArray(docs)) {
      return Response.json([])
    }

    return Response.json(docs, {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    })
  } catch {
    return Response.json([])
  }
}
