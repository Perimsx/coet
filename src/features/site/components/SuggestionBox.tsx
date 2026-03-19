'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, Mail, Send } from 'lucide-react'

import { sendSuggestionAction } from '@/app/actions/suggestion'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  sitePresentationDefaults,
  type SuggestionPresentation,
} from '@/config/site-presentation'
import { useMediaQuery } from '@/hooks/use-media-query'

export default function SuggestionBox({
  customTrigger,
  onSuccess,
  copy = sitePresentationDefaults.suggestion,
}: {
  customTrigger?: React.ReactNode
  onSuccess?: () => void
  copy?: SuggestionPresentation
} = {}) {
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  const trigger = customTrigger || (
    <button
      title={copy.triggerTitle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground outline-none transition-all hover:bg-primary-500/10 hover:text-primary-600 focus:outline-none active:scale-95 dark:hover:bg-primary-400/15 dark:hover:text-primary-400"
    >
      <Mail className="h-[18px] w-[18px]" />
    </button>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="isolate w-[400px] max-w-[95vw] overflow-hidden rounded-[2.5rem] border border-border/60 bg-background/95 p-0 shadow-[0_32px_90px_rgba(15,23,42,0.24)] focus:outline-none">
          <SuggestionForm onSuccess={handleSuccess} isDesktop copy={copy} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent
        hideHandle
        className="isolate rounded-t-[2.5rem] border-t border-border/60 bg-background/95 p-0 backdrop-blur-md"
      >
        <SuggestionForm onSuccess={handleSuccess} isDesktop={false} copy={copy} />
      </DrawerContent>
    </Drawer>
  )
}

function SuggestionForm({
  onSuccess,
  isDesktop,
  copy,
}: {
  onSuccess: () => void
  isDesktop?: boolean
  copy: SuggestionPresentation
}) {
  const [qq, setQq] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!qq || !content) return

    setIsSubmitting(true)
    setError('')

    try {
      const result = await sendSuggestionAction(qq, content)
      if (result?.success) {
        setIsSuccess(true)
        setTimeout(() => {
          setIsSuccess(false)
          setQq('')
          setContent('')
          onSuccess()
        }, 2000)
      } else {
        setError(result?.error || '提交失败，请稍后重试')
      }
    } catch {
      setError('网络异常，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center bg-background/95 p-10 text-center backdrop-blur-xl"
      >
        <div className="relative mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-green-500/20"
          />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-green-100 shadow-xs dark:bg-green-900/30">
            <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-500" />
          </div>
        </div>
        {isDesktop ? (
          <DialogTitle className="mb-1.5 text-xl font-black tracking-tight text-foreground">
            {copy.successTitle}
          </DialogTitle>
        ) : (
          <DrawerTitle className="mb-1.5 text-xl font-black tracking-tight text-foreground">
            {copy.successTitle}
          </DrawerTitle>
        )}
        <p className="text-[13px] font-medium leading-relaxed text-muted-foreground">
          {copy.successDescription}
        </p>
      </motion.div>
    )
  }

  return (
    <div
      className={`relative isolate overflow-hidden bg-transparent ${isDesktop ? 'w-[400px] p-0' : 'w-full p-0 pb-6'}`}
    >
      <div className="relative border-b border-border/20 bg-linear-to-b from-primary/5 via-background to-transparent px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            {isDesktop ? (
              <DialogTitle className="text-[17px] font-black leading-tight tracking-tight text-foreground">
                {copy.dialogTitle}
              </DialogTitle>
            ) : (
              <DrawerTitle className="text-[17px] font-black leading-tight tracking-tight text-foreground">
                {copy.dialogTitle}
              </DrawerTitle>
            )}
            <div className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.2em] text-primary/50">
              {copy.dialogSubtitle}
            </div>
          </div>
        </div>
        {!isDesktop ? (
          <DrawerDescription className="sr-only">
            {copy.dialogDescription}
          </DrawerDescription>
        ) : null}
      </div>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6 p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="group rounded-2xl border border-border/10 bg-muted/30 p-2 transition-all focus-within:border-primary/20 focus-within:bg-muted/50">
          <div className="flex items-center justify-between px-3 pb-0 pt-1.5">
            <Label
              htmlFor="qq"
              className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/40 group-focus-within:text-primary/50"
            >
              {copy.qqLabel}
            </Label>
            <span className="text-[9px] font-bold uppercase tabular-nums text-primary/30">
              {copy.qqHint}
            </span>
          </div>
          <Input
            id="qq"
            disabled={isSubmitting}
            placeholder={copy.qqPlaceholder}
            value={qq}
            onChange={(event) => setQq(event.target.value)}
            className="h-11 border-none bg-transparent px-3 text-[15px] font-medium shadow-none placeholder:text-muted-foreground/30 focus-visible:ring-0"
            required
            pattern="[1-9][0-9]{4,11}"
          />
        </div>

        <div className="group rounded-2xl border border-border/10 bg-muted/30 p-2 transition-all focus-within:border-primary/20 focus-within:bg-muted/50">
          <div className="flex items-center justify-between px-3 pb-0 pt-1.5">
            <Label
              htmlFor="content"
              className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/40 group-focus-within:text-primary/50"
            >
              {copy.contentLabel}
            </Label>
            <span className="text-[9px] font-bold uppercase tabular-nums text-primary/30">
              {copy.contentHint}
            </span>
          </div>
          <Textarea
            id="content"
            disabled={isSubmitting}
            placeholder={copy.contentPlaceholder}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[130px] resize-none border-none bg-transparent p-3 text-[15px] font-medium leading-relaxed shadow-none placeholder:text-muted-foreground/30 focus-visible:ring-0"
            required
            minLength={5}
            maxLength={2000}
          />
        </div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-[10px] font-black uppercase tracking-widest text-destructive"
          >
            {error}
          </motion.div>
        ) : null}

        <motion.button
          type="submit"
          disabled={isSubmitting || !qq || !content}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          className="group relative h-12 w-full overflow-hidden rounded-xl bg-linear-to-r from-primary to-blue-500 text-xs font-black uppercase tracking-[0.15em] text-white shadow-xl shadow-primary/20 disabled:opacity-50"
        >
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%', skewX: -45 }}
              animate={isSubmitting ? {} : { x: '250%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatDelay: 2,
              }}
            />
          </div>

          <span className="relative z-10 flex items-center justify-center">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {copy.submittingLabel}
              </>
            ) : (
              <>
                {copy.submitLabel}
                <Send className="ml-2 h-3.5 w-3.5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </>
            )}
          </span>
        </motion.button>
      </motion.form>
    </div>
  )
}
