"use client"

import { useMemo, useState } from "react"
import { Check, CornerDownLeft, Search, X } from "lucide-react"

import { cn } from "@/components/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type PostTaxonomyOption = {
  label: string
  value?: string
  keywords?: string[]
}

type PostTaxonomyFieldProps = {
  label: string
  placeholder: string
  helperText: string
  tokens: string[]
  options?: PostTaxonomyOption[]
  allowHashPrefix?: boolean
  recentToken?: string | null
  onTokensChange: (tokens: string[]) => void
  onTokenCommit?: (token: string) => void
}

function normalizeSearchText(input: string) {
  return input.trim().toLowerCase()
}

function normalizeTokenCandidate(input: string, allowHashPrefix: boolean) {
  const trimmed = input.trim()
  if (!trimmed) return ""

  const withoutPrefix = allowHashPrefix ? trimmed.replace(/^#+/, "") : trimmed
  return withoutPrefix.replace(/\s+/g, " ").trim()
}

function splitCandidates(raw: string, allowHashPrefix: boolean) {
  return raw
    .split(/[,\n]/)
    .map((item) => normalizeTokenCandidate(item, allowHashPrefix))
    .filter(Boolean)
}

function resolveOptionLabel(
  candidate: string,
  options: PostTaxonomyOption[],
) {
  const normalizedCandidate = normalizeSearchText(candidate)
  const matched = options.find((option) => {
    const haystacks = [
      option.label,
      option.value || "",
      ...(option.keywords || []),
    ]

    return haystacks.some(
      (item) => normalizeSearchText(item) === normalizedCandidate,
    )
  })

  return matched?.label || candidate
}

export function PostTaxonomyField({
  label,
  placeholder,
  helperText,
  tokens,
  options = [],
  allowHashPrefix = false,
  recentToken,
  onTokensChange,
  onTokenCommit,
}: PostTaxonomyFieldProps) {
  const [query, setQuery] = useState("")

  const normalizedTokens = useMemo(
    () => new Map(tokens.map((token) => [normalizeSearchText(token), token])),
    [tokens],
  )

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query)

    if (!normalizedQuery) {
      return options.slice(0, 6)
    }

    return options
      .filter((option) => {
        const haystacks = [
          option.label,
          option.value || "",
          ...(option.keywords || []),
        ]

        return haystacks.some((item) =>
          normalizeSearchText(item).includes(normalizedQuery),
        )
      })
      .slice(0, 6)
  }, [options, query])

  const preferredOption = useMemo(() => {
    if (!query.trim()) return filteredOptions[0] || null

    const normalizedQuery = normalizeSearchText(query)
    return (
      options.find((option) => {
        const haystacks = [
          option.label,
          option.value || "",
          ...(option.keywords || []),
        ]

        return haystacks.some(
          (item) => normalizeSearchText(item) === normalizedQuery,
        )
      }) ||
      filteredOptions[0] ||
      null
    )
  }, [filteredOptions, options, query])

  const pendingToken = useMemo(() => {
    if (!query.trim()) return ""

    if (/[,\n]/.test(query)) {
      return splitCandidates(query, allowHashPrefix)[0] || ""
    }

    const normalized = normalizeTokenCandidate(query, allowHashPrefix)
    if (!normalized) return ""

    return preferredOption?.label || normalized
  }, [allowHashPrefix, preferredOption, query])

  const duplicateToken =
    pendingToken && normalizedTokens.has(normalizeSearchText(pendingToken))
      ? normalizedTokens.get(normalizeSearchText(pendingToken)) || null
      : null

  const commitRawValue = (raw: string, forcedValue?: string) => {
    const candidates = forcedValue
      ? [forcedValue]
      : /[,\n]/.test(raw)
        ? splitCandidates(raw, allowHashPrefix)
        : [
            preferredOption?.label ||
              normalizeTokenCandidate(raw, allowHashPrefix),
          ].filter(Boolean)

    if (!candidates.length) return

    const nextTokens = [...tokens]
    let lastAdded = ""

    for (const candidate of candidates) {
      const resolved = resolveOptionLabel(candidate, options)
      const normalized = normalizeSearchText(resolved)
      if (!normalized || nextTokens.some((item) => normalizeSearchText(item) === normalized)) {
        continue
      }

      nextTokens.push(resolved)
      lastAdded = resolved
    }

    if (!lastAdded) return

    onTokensChange(nextTokens)
    onTokenCommit?.(lastAdded)
    setQuery("")
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      commitRawValue(query)
      return
    }

    if (event.key === "Backspace" && !query.trim() && tokens.length) {
      event.preventDefault()
      onTokensChange(tokens.slice(0, -1))
    }
  }

  const statusText = duplicateToken
    ? `${label}已存在`
    : pendingToken
      ? `已输入${label}：${pendingToken}`
      : helperText

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {recentToken && !normalizedTokens.has(normalizeSearchText(recentToken)) ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto rounded-xl px-2 py-1 text-xs text-muted-foreground"
            onClick={() => commitRawValue(recentToken, recentToken)}
          >
            最近使用：{recentToken}
          </Button>
        ) : null}
      </div>

      <div className="rounded-[24px] border border-border/70 bg-muted/10 p-3">
        <div className="flex min-h-12 flex-wrap items-center gap-2">
          {tokens.length ? (
            tokens.map((token) => {
              const isDuplicate = duplicateToken === token

              return (
                <Badge
                  key={token}
                  variant="secondary"
                  className={cn(
                    "gap-1 rounded-full border border-transparent px-3 py-1 text-xs font-medium",
                    isDuplicate && "border-amber-300 bg-amber-50 text-amber-700",
                  )}
                >
                  <span>{token}</span>
                  <button
                    type="button"
                    aria-label={`移除${label}${token}`}
                    className="rounded-full p-0.5 text-current/70 transition hover:bg-black/5 hover:text-current"
                    onClick={() =>
                      onTokensChange(tokens.filter((item) => item !== token))
                    }
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )
            })
          ) : (
            <div className="text-sm text-muted-foreground">
              暂未添加{label}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border/60 bg-background px-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            size="sm"
            className="h-9 rounded-xl px-3"
            disabled={!pendingToken || Boolean(duplicateToken)}
            onClick={() => commitRawValue(query)}
          >
            添加
          </Button>
        </div>

        <div
          className={cn(
            "mt-3 flex items-center gap-2 text-xs",
            duplicateToken ? "text-amber-600" : "text-muted-foreground",
          )}
        >
          {filteredOptions.length ? (
            <Search className="size-3.5 shrink-0" />
          ) : (
            <CornerDownLeft className="size-3.5 shrink-0" />
          )}
          <span>{statusText}</span>
        </div>

        {filteredOptions.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {filteredOptions.map((option) => {
              const selected = normalizedTokens.has(normalizeSearchText(option.label))

              return (
                <button
                  key={`${option.label}-${option.value || option.label}`}
                  type="button"
                  className={cn(
                    "flex min-h-11 items-center justify-between rounded-2xl border px-3 py-2 text-left transition",
                    selected
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-border/70 bg-background hover:border-primary/30 hover:bg-primary/5",
                  )}
                  onClick={() => commitRawValue(option.label, option.label)}
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">{option.label}</div>
                    {option.value && option.value !== option.label ? (
                      <div className="text-xs text-muted-foreground">
                        {option.value}
                      </div>
                    ) : null}
                  </div>
                  {selected ? (
                    <Check className="size-4 shrink-0" />
                  ) : (
                    <CornerDownLeft className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
