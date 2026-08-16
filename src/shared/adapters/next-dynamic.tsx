import React, { lazy, Suspense, ComponentType } from 'react'

interface DynamicOptions {
  loading?: (loadingProps: { error?: Error; isLoading?: boolean; pastDelay?: boolean; retry?: () => void }) => React.ReactNode
  ssr?: boolean
}

export function dynamic<P extends object = Record<string, unknown>>(
  dynamicOptions: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
  options?: DynamicOptions
): ComponentType<P> {
  const LazyComponent = lazy(async () => {
    const mod = await dynamicOptions()
    if (mod && 'default' in mod) {
      return { default: mod.default }
    }
    return { default: mod as ComponentType<P> }
  })

  return function DynamicWrapper(props: P) {
    const Fallback = options?.loading ? options.loading({ isLoading: true }) : null
    return (
      <Suspense fallback={Fallback}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

export default dynamic
