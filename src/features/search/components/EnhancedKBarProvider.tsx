'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode, createContext, useContext } from 'react'
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
import { formatDate } from 'pliny/utils/formatDate'
import { getNavLanguage } from '@/features/site/lib/nav-language'

const SearchLoadingContext = createContext(false)
export const useSearchLoading = () => useContext(SearchLoadingContext)

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
  return normalizeText(query).split(' ').filter(Boolean)
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
        className="rounded-md bg-amber-300/90 px-1 py-[1px] font-semibold text-gray-900 ring-1 ring-amber-400/70 dark:bg-amber-300 dark:text-gray-950 dark:ring-amber-200"
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

  let score = 0
  let matched = false

  if (meta.titleNorm.includes(keyword)) {
    score += 100
    matched = true
    if (meta.titleNorm === keyword) score += 45
    else if (meta.titleNorm.startsWith(keyword)) score += 25
  }
  if (meta.tagsNorm.includes(keyword)) {
    score += 60
    matched = true
  }
  if (meta.summaryNorm.includes(keyword)) {
    score += 40
    matched = true
  }
  if (meta.pathNorm.includes(keyword)) {
    score += 20
    matched = true
  }

  return matched ? score : null
}

function rankAction(
  action: KBarSearchAction,
  queryTokens: string[],
  queryNorm: string
): RankedAction | null {
  const meta = action.searchMeta
  if (!queryTokens.length) return null

  let totalScore = 0
  let matchedKeywords = 0
  let allMatched = true

  queryTokens.forEach((keyword) => {
    const score = scoreKeyword(meta, keyword)
    if (score == null) {
      allMatched = false
      return
    }
    matchedKeywords += 1
    totalScore += score
  })

  if (matchedKeywords === 0) return null
  if (queryTokens.length > 1 && !allMatched) return null

  if (queryNorm) {
    if (meta.titleNorm === queryNorm) totalScore += 120
    else if (meta.titleNorm.startsWith(queryNorm)) totalScore += 70
    else if (meta.titleNorm.includes(queryNorm)) totalScore += 45

    if (meta.summaryNorm.includes(queryNorm)) totalScore += 20
    if (meta.pathNorm.includes(queryNorm)) totalScore += 15
  }

  totalScore += (matchedKeywords / queryTokens.length) * 30

  const ageDays = Math.max(0, (Date.now() - meta.dateValue) / 86400000)
  totalScore += Math.max(0, 12 - ageDays / 60)

  if (totalScore <= 0) return null
  return { action, score: totalScore }
}

function mapDocumentsToActions(
  documents: SearchDocument[],
  router: ReturnType<typeof useRouter>
) {
  return documents.map((doc) => {
    const tagsRaw = (doc.tags || []).join(' / ')
    const summaryRaw = doc.summary || ''
    const pathRaw = `/${doc.path}`
    const dateValue = Number.isNaN(new Date(doc.date).getTime()) ? 0 : new Date(doc.date).getTime()

    return {
      id: doc.path,
      name: doc.title,
      keywords: buildSearchKeywords(doc),
      subtitle: formatDate(doc.date, 'zh-CN'),
      perform: () => router.push(`/${doc.path}`),
      searchMeta: {
        titleRaw: doc.title,
        titleNorm: normalizeText(doc.title),
        summaryRaw,
        summaryNorm: normalizeText(summaryRaw),
        tagsRaw,
        tagsNorm: normalizeText(tagsRaw),
        pathRaw,
        pathNorm: normalizeText(`${doc.path} ${doc.slug || ''}`),
        dateValue,
      },
    } as SearchAction
  })
}

function SearchResults({ idleText, emptyText }: { idleText: string; emptyText: string }) {
  const { searchQuery, actionStore } = useKBar((state) => ({
    searchQuery: state.searchQuery,
    actionStore: state.actions,
  }))

  const ranked = useMemo(() => {
    const searchActions = Object.values(actionStore)
      .filter((item) => hasSearchMeta(item) && !item.parent)
      .map((item) => item as unknown as KBarSearchAction)

    const queryNorm = normalizeText(searchQuery)
    const queryTokens = tokenizeQuery(searchQuery)
    if (!queryTokens.length) return []

    return searchActions
      .map((action) => rankAction(action, queryTokens, queryNorm))
      .filter((item): item is RankedAction => Boolean(item))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return b.action.searchMeta.dateValue - a.action.searchMeta.dateValue
      })
      .slice(0, 20)
  }, [actionStore, searchQuery])

  const items = useMemo(() => ranked.map((item) => item.action), [ranked])
  const hasQuery = searchQuery.trim().length > 0

  if (!items.length) {
    if (!hasQuery) return null
    const text = hasQuery ? emptyText : idleText
    return (
      <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">{text}</div>
    )
  }

  return (
    <div className="px-3 pb-2">
      <KBarResults
        items={items}
        maxHeight={432}
        onRender={({ item, active }) => {
          const actionItem = item as unknown as KBarSearchAction
          const previewText =
            actionItem.searchMeta.summaryRaw ||
            actionItem.searchMeta.tagsRaw ||
            actionItem.searchMeta.pathRaw

          return (
            <div
              className={`mx-1 mb-1 cursor-pointer rounded-xl border px-3 py-2.5 transition ${
                active
                  ? 'border-primary-500/20 bg-primary-500/8 dark:border-primary-400/30 dark:bg-primary-400/12'
                  : 'hover:bg-primary-500/5 dark:hover:bg-primary-400/10 border-transparent bg-transparent'
              }`}
            >
              <div className="min-w-0">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {highlightText(actionItem.name, searchQuery)}
                  </div>
                  {actionItem.subtitle ? (
                    <span className="shrink-0 font-mono text-[11px] text-gray-400 dark:text-gray-500">
                      {actionItem.subtitle}
                    </span>
                  ) : null}
                </div>
                <div className="[display:-webkit-box] overflow-hidden text-xs leading-5 text-gray-500 [-webkit-box-orient:vertical] [-webkit-line-clamp:2] dark:text-gray-400">
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
      <KBarPositioner className="z-50 flex items-start justify-center bg-[#f3f4f8]/88 px-4 pt-[15vh] backdrop-blur-[2px] sm:px-6">
        <KBarAnimator className="relative w-full max-w-[680px] lg:max-w-[740px]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-40 w-[78%] -translate-x-1/2 rounded-full bg-slate-300/32 blur-[64px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-8 -right-10 h-44 w-52 rounded-full bg-amber-200/30 blur-[66px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-14 -right-16 h-64 w-64 rounded-full bg-sky-300/22 blur-[80px]"
          />

          <div className="relative overflow-hidden rounded-[18px] border border-[#2f7cf7] bg-white/72 shadow-[0_20px_58px_-34px_rgba(64,84,126,0.5)] backdrop-blur-xl">
            <div className="px-4 py-2.5 sm:px-5 sm:py-3">
              <div className="flex items-center gap-2.5">
                <Search className="h-5 w-5 shrink-0 text-gray-400" />
                <KBarSearch
                  className="h-7 w-full border-0 bg-transparent p-0 text-base font-medium text-gray-500 placeholder:text-gray-400 focus:ring-0 focus:outline-none sm:h-8 sm:text-[18px] sm:leading-[1.15]"
                  placeholder={placeholder}
                />
                <div className="flex shrink-0 items-center">
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => query.setSearch('')}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-all hover:text-gray-600 active:scale-90 focus:outline-none"
                      aria-label="clear search"
                    >
                      &times;
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {showPanel && !isLoading ? (
              <div className="border-t border-[#dce3ef] bg-white/55">
                <SearchResults idleText={idleText} emptyText={emptyText} />
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
        const sourcePath = typeof searchDocumentsPath === 'string' ? searchDocumentsPath : ''
        const apiUrl = new URL('/api/search', window.location.origin)
        apiUrl.searchParams.set('locale', locale)
        apiUrl.searchParams.set('source', sourcePath)
        const response = await fetch(apiUrl.toString())

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

  const placeholder = '键入开始搜索'
  
    const actions = useMemo(
      () => mapDocumentsToActions(documents, router),
      [documents, router]
    )
    const defaultActions = useMemo(() => kbarConfig.defaultActions || [], [kbarConfig.defaultActions])
  
    return (
      <SearchLoadingContext.Provider value={isLoading}>
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
            idleText="输入关键词开始搜索"
            emptyText="没有找到匹配结果"
            loadingText="正在加载搜索索引..."
          />
          {children}
        </KBarProvider>
      </SearchLoadingContext.Provider>
    )
  }
