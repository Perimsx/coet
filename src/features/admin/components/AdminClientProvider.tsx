"use client"

import { SWRConfig } from "swr"

import { Toaster } from "@/shared/ui/sonner"

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
      <Toaster richColors closeButton />
    </SWRConfig>
  )
}
