import { FilterXSS } from "xss"

const TEXT_SANITIZER = new FilterXSS({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
})

const RICH_TEXT_SANITIZER = new FilterXSS({
  whiteList: {
    a: ["href", "title", "target", "rel"],
    b: [],
    strong: [],
    i: [],
    em: [],
    u: [],
    s: [],
    p: [],
    br: [],
    ul: [],
    ol: [],
    li: [],
    blockquote: [],
    code: [],
    pre: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    hr: [],
    img: ["src", "alt", "title"],
    table: [],
    thead: [],
    tbody: [],
    tr: [],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    span: ["style"],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
})

function normalizeInput(input: string, maxLength?: number) {
  const value = typeof input === "string" ? input : ""
  if (!maxLength) return value
  return value.slice(0, Math.max(0, maxLength))
}

export function sanitizeText(input: string, maxLength?: number) {
  const value = normalizeInput(input, maxLength).trim()
  return TEXT_SANITIZER.process(value)
}

export function sanitizeRichText(input: string, maxLength?: number) {
  const value = normalizeInput(input, maxLength)
  return RICH_TEXT_SANITIZER.process(value)
}
