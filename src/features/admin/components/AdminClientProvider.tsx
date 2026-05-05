"use client"

import { SWRConfig } from "swr"

export function AdminClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        keepPreviousData: true,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
