'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { sendSuggestionAction } from '@/app/actions/suggestion'
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false)

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener('change', onChange)
    setValue(result.matches)

    return () => result.removeEventListener('change', onChange)
  }, [query])

  return value
}

export default function SuggestionBox({ 
  customTrigger, 
  onSuccess 
}: { 
  customTrigger?: React.ReactNode;
  onSuccess?: () => void;
} = {}) {
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  const trigger = customTrigger || (
    <button
      title="发送建议"
      className="text-muted-foreground transition-all hover:bg-primary-500/10 hover:text-primary-600 dark:hover:bg-primary-400/15 dark:hover:text-primary-400 active:scale-95 inline-flex h-10 w-10 items-center justify-center rounded-full outline-none focus:outline-none"
    >
      <Mail className="h-[18px] w-[18px]" />
    </button>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="w-[400px] max-w-[95vw] p-0 border-border/20 shadow-2xl rounded-[2.5rem] overflow-hidden focus:outline-none">
          <SuggestionForm onSuccess={handleSuccess} isDesktop={true} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger}
      </DrawerTrigger>
      <DrawerContent hideHandle={true} className="p-0 border-t border-border/20 bg-background/95 backdrop-blur-md rounded-t-[2.5rem]">
        <SuggestionForm onSuccess={handleSuccess} isDesktop={false} />
      </DrawerContent>
    </Drawer>
  )
}

function SuggestionForm({ onSuccess, isDesktop }: { onSuccess: () => void, isDesktop?: boolean }) {
  const [qq, setQq] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        setError(result?.error || '发送失败')
      }
    } catch (err) {
      setError('网络错误，请稍后再试')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-10 text-center bg-background/95 backdrop-blur-xl"
      >
        <div className="relative mb-6">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-green-500/20"
          />
          <div className="relative h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-500" />
          </div>
        </div>
        {isDesktop ? (
          <DialogTitle className="text-xl font-black tracking-tight text-foreground mb-1.5">发送成功</DialogTitle>
        ) : (
          <DrawerTitle className="text-xl font-black tracking-tight text-foreground mb-1.5">发送成功</DrawerTitle>
        )}
        <p className="text-[13px] font-medium text-muted-foreground leading-relaxed">
          感谢反馈！站长会尽快回复哦。
        </p>
      </motion.div>
    )
  }

  return (
    <div className={`bg-transparent overflow-hidden ${isDesktop ? 'w-[400px]' : 'w-full'} ${isDesktop ? 'p-0' : 'p-0 pb-6'}`}>
      {/* 沉浸式头部设计 */}
      <div className="relative px-6 py-6 bg-linear-to-b from-primary/5 via-background to-transparent border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            {isDesktop ? (
              <DialogTitle className="text-[17px] font-black tracking-tight text-foreground leading-tight">联系站长</DialogTitle>
            ) : (
              <DrawerTitle className="text-[17px] font-black tracking-tight text-foreground leading-tight">联系站长</DrawerTitle>
            )}
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/50 mt-1 truncate">
              反馈与建议
            </div>
          </div>
        </div>
        {!isDesktop && (
          <DrawerDescription className="sr-only">发送建议表单</DrawerDescription>
        )}
      </div>

      <motion.form 
        onSubmit={handleSubmit} 
        className="p-6 space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 20 }}
      >
        {/* 聚合式输入区块 - QQ */}
        <div className="group rounded-2xl bg-muted/30 border border-border/10 p-2 transition-all focus-within:bg-muted/50 focus-within:border-primary/20">
          <div className="px-3 pt-1.5 pb-0 flex items-center justify-between">
            <Label htmlFor="qq" className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/40 group-focus-within:text-primary/50">您的身份</Label>
            <span className="text-[9px] font-bold text-primary/30 tabular-nums uppercase">支持 QQ 号</span>
          </div>
          <Input
            id="qq"
            disabled={isSubmitting}
            placeholder="填写您的 QQ..."
            value={qq}
            onChange={(e) => setQq(e.target.value)}
            className="h-11 border-none bg-transparent shadow-none px-3 focus-visible:ring-0 text-[15px] font-medium placeholder:text-muted-foreground/30"
            required
            pattern="[1-9][0-9]{4,11}"
          />
        </div>

        {/* 聚合式输入区块 - 内容 */}
        <div className="group rounded-2xl bg-muted/30 border border-border/10 p-2 transition-all focus-within:bg-muted/50 focus-within:border-primary/20">
          <div className="px-3 pt-1.5 pb-0 flex items-center justify-between">
            <Label htmlFor="content" className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/40 group-focus-within:text-primary/50">您的留言</Label>
            <span className="text-[9px] font-bold text-primary/30 tabular-nums uppercase">想法与建议</span>
          </div>
          <Textarea
            id="content"
            disabled={isSubmitting}
            placeholder="发现了 Bug？或者有什么想对站长说的？"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[130px] border-none bg-transparent shadow-none p-3 focus-visible:ring-0 text-[15px] font-medium placeholder:text-muted-foreground/30 leading-relaxed resize-none"
            required
            minLength={5}
            maxLength={2000}
          />
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] text-destructive font-black uppercase tracking-widest text-center"
          >
            {error}
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={isSubmitting || !qq || !content}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="group relative w-full h-12 rounded-xl bg-linear-to-r from-primary to-blue-500 font-black text-xs uppercase tracking-[0.15em] text-white shadow-xl shadow-primary/20 disabled:opacity-50 overflow-hidden"
        >
          {/* 高级扫光 */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%', skewX: -45 }}
              animate={isSubmitting ? {} : { x: '250%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
            />
          </div>

          <span className="relative z-10 flex items-center justify-center">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在发送...
              </>
            ) : (
              <>
                提交反馈
                <Send className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </>
            )}
          </span>
        </motion.button>
      </motion.form>
    </div>
  )
}

