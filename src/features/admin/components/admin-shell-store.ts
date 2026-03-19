'use client'

import { create } from 'zustand'

type AdminShellStore = {
  commandPaletteOpen: boolean
  bulkPostSelection: string[]
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setBulkPostSelection: (values: string[]) => void
}

export const useAdminShellStore = create<AdminShellStore>((set) => ({
  commandPaletteOpen: false,
  bulkPostSelection: [],
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setBulkPostSelection: (values) => set({ bulkPostSelection: values }),
}))
