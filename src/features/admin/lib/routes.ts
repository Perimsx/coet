const DEFAULT_ADMIN_LOGIN_ENTRY = 'admin'

export const INTERNAL_ADMIN_LOGIN_PATH = '/admin/login'

function normalizeAdminEntry(value?: string | null) {
  const cleaned = (value || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '')

  return cleaned || DEFAULT_ADMIN_LOGIN_ENTRY
}

export function getAdminLoginEntry() {
  return normalizeAdminEntry(process.env.ADMIN_LOGIN_ENTRY)
}

export function getAdminLoginPath() {
  return `/${getAdminLoginEntry()}`
}

export const ADMIN_LOGIN_ENTRY = getAdminLoginEntry()
export const ADMIN_LOGIN_PATH = getAdminLoginPath()
