'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import type { AdminCommandItem } from '@/features/admin/lib/navigation'

import { useAdminShellStore } from './admin-shell-store'

export function AdminCommandPalette({ items }: { items: AdminCommandItem[] }) {
  const router = useRouter()
  const open = useAdminShellStore((state) => state.commandPaletteOpen)
  const setOpen = useAdminShellStore((state) => state.setCommandPaletteOpen)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(!open)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, setOpen])

  const groups = useMemo(() => {
    return items.reduce<Record<string, AdminCommandItem[]>>((accumulator, item) => {
      if (!accumulator[item.group]) {
        accumulator[item.group] = []
      }

      accumulator[item.group].push(item)
      return accumulator
    }, {})
  }, [items])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="搜索页面、设置或快捷操作..." />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>没有匹配结果。</CommandEmpty>
        {Object.entries(groups).map(([groupLabel, groupItems]) => (
          <CommandGroup key={groupLabel} heading={groupLabel}>
            {groupItems.map((item) => {
              const Icon = item.icon

              return (
                <CommandItem
                  key={item.id}
                  keywords={item.keywords}
                  onSelect={() => {
                    setOpen(false)
                    router.push(item.href)
                  }}
                  className="rounded-xl px-3 py-3"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-medium">{item.label}</span>
                    <span className="truncate text-xs text-muted-foreground">{item.hint}</span>
                  </div>
                  <CommandShortcut>进入</CommandShortcut>
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
