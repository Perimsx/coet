import { useMemo } from 'react'
import {
  useNavigate,
  useLocation,
  useSearchParams as useRouterSearchParams,
  useParams as useRouterParams,
} from 'react-router-dom'

export function useRouter() {
  const navigate = useNavigate()

  return useMemo(
    () => ({
      push: (url: string) => navigate(url),
      replace: (url: string) => navigate(url, { replace: true }),
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => window.location.reload(),
      prefetch: () => {},
    }),
    [navigate]
  )
}

export function usePathname(): string {
  const location = useLocation()
  return location.pathname
}

export function useSearchParams(): URLSearchParams {
  const [searchParams] = useRouterSearchParams()
  return searchParams
}

export function useParams<
  T extends Record<string, string | string[] | undefined> = Record<string, string>,
>(): T {
  return useRouterParams() as unknown as T
}

export function notFound(): never {
  throw new Error('NEXT_NOT_FOUND')
}

export function redirect(url: string): never {
  window.location.href = url
  throw new Error('NEXT_REDIRECT')
}

export function permanentRedirect(url: string): never {
  window.location.href = url
  throw new Error('NEXT_REDIRECT')
}
