'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarResults,
  KBarSearch,
  VisualState,
  useKBar,
  useRegisterActions,
  type Action,
} from 'kbar'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useLanguage } from '@/shared/contexts/LanguageContext'

type SearchDocument = {
  path: string
  title: string
  summary?: string
  date: string
  tags?: string[]
  categories?: string[]
  slug?: string
}

type SearchMeta = {
  titleRaw: string
  titleNorm: string
  summaryRaw: string
  summaryNorm: string
  tagsRaw: string
  tagsNorm: string
  pathRaw: string
  pathNorm: string
  dateValue: number
}

type SearchAction = Action & {
  searchMeta: SearchMeta
}

type RankedAction = {
  action: KBarSearchAction
  score: number
}

type KBarSearchAction = {
  id: string
  name: string
  subtitle?: string
  icon?: ReactNode
  parent?: string
  keywords?: string
  searchMeta: SearchMeta
}

type EnhancedKBarConfig = {
  searchDocumentsPath: string | false
  defaultActions?: Action[]
}

function hasSearchMeta(value: unknown): value is KBarSearchAction {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<KBarSearchAction>
  return Boolean(candidate.id && candidate.name && candidate.searchMeta)
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[-_/]/g, ' ')
    .replace(/[^a-z0-9\u4e00-\u9fa5\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeQuery(query: string) {
  const normalized = query
    .toLowerCase()
    .replace(/[-_/]/g, ' ')
    .trim()

  if (!normalized) return []

  // 按中英文边界切分：中文连续段和英文/数字段各自成 token
  const segments = normalized
    .replace(/([一-龥])(?=[a-z0-9])/g, '$1 ')
    .replace(/([a-z0-9])(?=[一-龥])/g, '$1 ')
    .split(/\s+/)
    .filter(Boolean)

  return segments.filter((seg) => /[a-z0-9一-龥]/.test(seg))
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildSearchKeywords(doc: SearchDocument) {
  const tags = (doc.tags || []).join(' ')
  const categories = (doc.categories || []).join(' ')
  const raw = [doc.title, doc.summary || '', tags, categories, doc.slug || '', doc.path].join(' ')
  const normalized = normalizeText(raw)
  return `${raw} ${normalized}`.trim()
}

function highlightText(text: string, query: string): ReactNode {
  const tokens = tokenizeQuery(query)
    .sort((a, b) => b.length - a.length)
    .slice(0, 8)

  if (!tokens.length) return text

  const matcher = new RegExp(`(${tokens.map(escapeRegex).join('|')})`, 'ig')
  const pieces = text.split(matcher)

  return pieces.map((piece, index) => {
    if (!piece) return null
    const isHit = tokens.some((token) => piece.toLowerCase() === token.toLowerCase())
    return isHit ? (
      <mark
        key={`${piece}-${index}`}
        className="rounded bg-accent/15 px-1 py-[1px] font-medium text-accent"
      >
        {piece}
      </mark>
    ) : (
      <span key={`${piece}-${index}`}>{piece}</span>
    )
  })
}

function scoreKeyword(meta: SearchMeta, keyword: string) {
  if (!keyword) return null
  const keywordNorm = normalizeText(keyword)
  if (!keywordNorm) return null

  let score = 0
  if (meta.titleRaw.toLowerCase() === keyword.toLowerCase()) score += 120
  if (meta.titleNorm.includes(keywordNorm)) score += 60
  if (meta.summaryNorm.includes(keywordNorm)) score += 25
  if (meta.tagsNorm.includes(keywordNorm)) score += 35
  if (meta.pathNorm.includes(keywordNorm)) score += 15

  return score > 0 ? score : null
}

function scoreAction(action: KBarSearchAction, query: string): number | null {
  const tokens = tokenizeQuery(query)
  if (!tokens.length) return 0

  let totalScore = 0
  for (const token of tokens) {
    const tokenScore = scoreKeyword(action.searchMeta, token)
    if (!tokenScore) return null
    totalScore += tokenScore
  }

  const recencyBonus = Math.max(0, 10 - Math.floor((Date.now() - action.searchMeta.dateValue) / (1000 * 60 * 60 * 24 * 30)))
  return totalScore + recencyBonus
}

function mapDocumentsToActions(documents: SearchDocument[], router: ReturnType<typeof useRouter>): SearchAction[] {
  return documents.map((doc) => {
    const titleRaw = doc.title || ''
    const summaryRaw = doc.summary || ''
    const tagsRaw = (doc.tags || []).join(' ')
    const pathRaw = doc.path || ''

    return {
      id: doc.path,
      name: doc.title,
      keywords: buildSearchKeywords(doc),
      subtitle: doc.date ? doc.date.split('T')[0] : '',
      perform: () => router.push(`/${doc.path}`),
      searchMeta: {
        titleRaw,
        titleNorm: normalizeText(titleRaw),
        summaryRaw,
        summaryNorm: normalizeText(summaryRaw),
        tagsRaw,
        tagsNorm: normalizeText(tagsRaw),
        pathRaw,
        pathNorm: normalizeText(pathRaw),
        dateValue: doc.date ? new Date(doc.date).getTime() : 0,
      },
    }
  })
}

function SearchResults({
  idleText,
  emptyText,
}: {
  idleText: string
  emptyText: string
}) {
  const { actionStore, searchQuery } = useKBar((state) => ({
    actionStore: state.actions,
    searchQuery: state.searchQuery,
  }))

  const hasQuery = searchQuery.trim().length > 0
  const items = useMemo(() => {
    const searchActions = Object.values(actionStore)
      .filter((item) => hasSearchMeta(item) && !item.parent)
      .map((item) => item as unknown as KBarSearchAction)

    if (!hasQuery) return []

    const ranked: RankedAction[] = []
    for (const item of searchActions) {
      const score = scoreAction(item, searchQuery)
      if (score !== null) {
        ranked.push({ action: item, score })
      }
    }

    ranked.sort((a, b) => b.score - a.score)
    return ranked.map((entry) => entry.action)
  }, [hasQuery, actionStore, searchQuery])

  if (!hasQuery) {
    return (
      <div className="px-6 py-8 text-center text-copy-13 text-neutral-6">{idleText}</div>
    )
  }

  if (!items.length) {
    return (
      <div className="px-6 py-8 text-center text-copy-13 text-neutral-6">{emptyText}</div>
    )
  }

  return (
    <div className="px-2 pb-2">
      <KBarResults
        items={items}
        maxHeight={400}
        onRender={({ item, active }) => {
          const actionItem = item as unknown as KBarSearchAction
          const previewText =
            actionItem.searchMeta.summaryRaw ||
            actionItem.searchMeta.tagsRaw ||
            actionItem.searchMeta.pathRaw

          return (
            <div
              className={`mx-1 mb-1 cursor-pointer rounded-lg border px-3 py-2 transition-colors ${
                active
                  ? 'border-border bg-neutral-2 text-neutral-10'
                  : 'border-transparent bg-transparent hover:bg-neutral-1 text-neutral-8'
              }`}
            >
              <div className="min-w-0">
                <div className="mb-0.5 flex items-start justify-between gap-3">
                  <div className="truncate font-serif text-copy-14 font-medium text-neutral-10">
                    {highlightText(actionItem.name, searchQuery)}
                  </div>
                  {actionItem.subtitle ? (
                    <span className="shrink-0 font-mono text-caption-10 text-neutral-5">
                      {actionItem.subtitle}
                    </span>
                  ) : null}
                </div>
                <div className="[display:-webkit-box] overflow-hidden text-label-12 leading-relaxed text-neutral-6 [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {highlightText(previewText, searchQuery)}
                </div>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}

function EnhancedKBarModal({
  actions,
  isLoading,
  placeholder,
  idleText,
  emptyText,
  loadingText,
}: {
  actions: SearchAction[]
  isLoading: boolean
  placeholder: string
  idleText: string
  emptyText: string
  loadingText: string
}) {
  const { query, searchQuery } = useKBar((state) => ({
    searchQuery: state.searchQuery,
  }))
  const hasQuery = searchQuery.trim().length > 0
  const showPanel = isLoading || hasQuery
  useRegisterActions(actions, [actions])

  return (
    <KBarPortal>
      <KBarPositioner className="z-[200] flex items-start justify-center bg-neutral-10/40 px-4 pt-[15vh] backdrop-blur-xs sm:px-6">
        <KBarAnimator className="relative w-full max-w-[620px]">
          <div className="relative overflow-hidden rounded-xl border border-border bg-paper shadow-lg">
            <div className="px-4 py-2.5 sm:px-4.5 sm:py-3">
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 shrink-0 text-neutral-5" />
                <KBarSearch
                  className="h-7 w-full border-0 bg-transparent p-0 text-copy-15 font-normal text-neutral-10 placeholder:text-neutral-5 focus:border-transparent focus:ring-0 focus:outline-none focus:[box-shadow:none] focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none focus-visible:[box-shadow:none]"
                  placeholder={placeholder}
                />
                <div className="flex shrink-0 items-center">
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => query.setSearch('')}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-neutral-5 transition-colors hover:text-neutral-8 focus:outline-none cursor-pointer"
                      aria-label="clear search"
                    >
                      &times;
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {showPanel ? (
              <div className="border-t border-border bg-paper">
                {isLoading ? (
                  <div className="px-6 py-8 text-center text-copy-13 text-neutral-6">
                    {loadingText}
                  </div>
                ) : (
                  <SearchResults idleText={idleText} emptyText={emptyText} />
                )}
              </div>
            ) : null}
          </div>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  )
}

function SearchDocumentsLoader({
  kbarConfig,
  setDocuments,
  setIsLoading,
}: {
  kbarConfig: EnhancedKBarConfig
  setDocuments: React.Dispatch<React.SetStateAction<SearchDocument[]>>
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { isShowing } = useKBar((state) => ({
    isShowing:
      state.visualState === VisualState.showing || state.visualState === VisualState.animatingIn,
  }))
  const loadedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    let isActive = true
    const { searchDocumentsPath } = kbarConfig

    if (!searchDocumentsPath) {
      setDocuments([])
      setIsLoading(false)
      return
    }

    const locale = 'zh'
    const loadKey = `${locale}:${searchDocumentsPath}`
    if (!isShowing || loadedKeyRef.current === loadKey) {
      return
    }

    async function loadDocuments() {
      setIsLoading(true)

      try {
        const response = await fetch(searchDocumentsPath as string)

        if (!response.ok) {
          throw new Error('failed to load search documents')
        }

        const payload = await response.json()
        if (!isActive || !Array.isArray(payload)) return

        const deduped = new Map<string, SearchDocument>()
        payload.forEach((doc) => {
          if (doc?.path && !deduped.has(doc.path)) {
            deduped.set(doc.path, doc as SearchDocument)
          }
        })

        const sorted = Array.from(deduped.values()).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        loadedKeyRef.current = loadKey
        setDocuments(sorted)
      } catch {
        if (isActive) {
          setDocuments([])
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadDocuments()

    return () => {
      isActive = false
    }
  }, [kbarConfig, isShowing, setDocuments, setIsLoading])

  return null
}

export default function EnhancedKBarProvider({
  kbarConfig,
  children,
}: {
  kbarConfig: EnhancedKBarConfig
  children: React.ReactNode
}) {
  const router = useRouter()
  const [documents, setDocuments] = useState<SearchDocument[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(kbarConfig.searchDocumentsPath))

  const { dictionary, locale } = useLanguage()
  const isEn = locale === 'en'
  const placeholder = dictionary.search.inputPlaceholder

    const actions = useMemo(
      () => mapDocumentsToActions(documents, router),
      [documents, router]
    )
    const defaultActions = useMemo(() => kbarConfig.defaultActions || [], [kbarConfig.defaultActions])

    return (
        <KBarProvider actions={defaultActions}>
          <SearchDocumentsLoader
            kbarConfig={kbarConfig}
            setDocuments={setDocuments}
            setIsLoading={setIsLoading}
          />
          <EnhancedKBarModal
            actions={actions}
            isLoading={isLoading}
            placeholder={placeholder}
            idleText={isEn ? "Type to start searching" : "输入关键词开始搜索"}
            emptyText={isEn ? "No results found" : "没有找到匹配结果"}
            loadingText={isEn ? "Loading search index..." : "正在加载搜索索引..."}
          />
          {children}
        </KBarProvider>
    )
  }
