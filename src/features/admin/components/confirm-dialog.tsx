"use client"

import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  confirming = false,
  destructive = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  confirming?: boolean
  destructive?: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[28px] border-border/70 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border/60 px-6 py-5 text-left">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-base">{title}</DialogTitle>
              <DialogDescription className="text-sm leading-6">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-row items-center justify-end gap-2 px-6 py-4">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            className="rounded-xl"
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
