import { clientBrowserIcons, clientOsIcons } from '@/config/client-icons'

const UNKNOWN_META_VALUES = new Set([
  '',
  'unknown',
  'null',
  'none',
  'n/a',
  'na',
  '-',
  '--',
  'undefined',
  '\u672a\u77e5',
  '\u4e0d\u8be6',
])

const OS_DEFAULT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
const B_DEFAULT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><circle cx="6" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="9.5" cy="6" r="1" fill="currentColor" stroke="none"/></svg>'

function normalizeForMatch(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .trim()
}

function hasAny(text: string, parts: string[]) {
  return parts.some((part) => text.includes(part))
}

function decorate(svg: string, color = '#64748B') {
  return `<span class="client-brand-icon" style="color:${color};">${svg}</span>`
}

function imageIcon(src: string, alt = 'icon'): string {
  return `<span class="client-brand-icon"><img src="${src}" alt="${alt}" loading="lazy" decoding="async" /></span>`
}

export function hasKnownClientValue(value?: string | null) {
  const normalized = String(value || '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) return false
  return !(UNKNOWN_META_VALUES.has(normalized) || UNKNOWN_META_VALUES.has(normalized.toLowerCase()))
}

function trimTrailingEnglishPart(value: string) {
  const compact = String(value || '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!compact) return ''
  if (!/[\u3400-\u9fff]/.test(compact)) return compact

  const tokens = compact.split(' ').filter(Boolean)
  while (tokens.length > 1 && /^[A-Za-z][A-Za-z'.-]*$/.test(tokens[tokens.length - 1])) {
    tokens.pop()
  }
  return tokens.join(' ').trim()
}

export function formatClientLocation(value?: string | null) {
  if (!hasKnownClientValue(value)) return ''

  const compact = trimTrailingEnglishPart(String(value || ''))
  if (!compact) return ''

  return compact
    .split(/\s*(?:\||\/|,|\uFF0C|->|\u2192|\u00B7)\s*/)
    .map((part) => trimTrailingEnglishPart(part))
    .filter(Boolean)
    .slice(0, 2)
    .join(' \u00B7 ')
}

export function getOsIconHtml(os: string) {
  const s = String(os || '').toLowerCase()
  if (s.includes('windows')) return imageIcon(clientOsIcons.windows, 'Windows')
  if (
    s.includes('mac') ||
    s.includes('ios') ||
    s.includes('iphone') ||
    s.includes('ipad') ||
    s.includes('apple')
  ) {
    return imageIcon(clientOsIcons.apple, 'Apple')
  }
  if (s.includes('android') || s.includes('harmony')) {
    return imageIcon(clientOsIcons.android, 'Android')
  }
  if (s.includes('linux')) return imageIcon(clientOsIcons.linux, 'Linux')
  if (s.includes('cros') || s.includes('chromeos'))
    return imageIcon(clientOsIcons.chrome, 'ChromeOS')
  return decorate(OS_DEFAULT, '#8B5CF6')
}

export function getBrowserIconHtml(browser: string) {
  const s = normalizeForMatch(browser)

  if (hasAny(s, ['wechat', 'weixin', 'micromessenger']))
    return imageIcon(clientBrowserIcons.wechat, 'WeChat')
  if (hasAny(s, ['qqbrowser', 'mqqbrowser'])) return imageIcon(clientBrowserIcons.qq, 'QQ Browser')
  if (s === 'qq' || (s.startsWith('qq') && !hasAny(s, ['browser'])))
    return imageIcon(clientBrowserIcons.qq, 'QQ')
  if (hasAny(s, ['weibo'])) return imageIcon(clientBrowserIcons.weibo, 'Weibo')
  if (hasAny(s, ['baidubrowser', 'bidubrowser', 'baidu']))
    return imageIcon(clientBrowserIcons.baidu, 'Baidu Browser')
  if (hasAny(s, ['qhbrowser', '360se', '360ee', '360browser']))
    return imageIcon(clientBrowserIcons.q360, '360 Browser')

  if (s.includes('vivaldi')) return imageIcon(clientBrowserIcons.vivaldi, 'Vivaldi')
  if (s.includes('opera') || s.includes('opr')) return imageIcon(clientBrowserIcons.opera, 'Opera')
  if (s.includes('edge') || s.includes('edg')) return imageIcon(clientBrowserIcons.edge, 'Edge')
  if (s.includes('firefox') || s.includes('fxios'))
    return imageIcon(clientBrowserIcons.firefox, 'Firefox')
  if (hasAny(s, ['msie', 'trident', 'internetexplorer']))
    return imageIcon(clientBrowserIcons.ie, 'Internet Explorer')

  if (
    s.includes('chrome') ||
    s.includes('crios') ||
    s.includes('brave') ||
    s.includes('samsungbrowser') ||
    s.includes('samsunginternet') ||
    s.includes('yabrowser') ||
    s.includes('yandex') ||
    s.includes('quark') ||
    s.includes('ucbrowser') ||
    s.includes('sogou') ||
    s.includes('dingtalk') ||
    s.includes('alipay')
  ) {
    return imageIcon(clientBrowserIcons.chrome, 'Chrome')
  }

  if (s.includes('safari')) return imageIcon(clientBrowserIcons.safari, 'Safari')

  return decorate(B_DEFAULT, '#6366F1')
}
