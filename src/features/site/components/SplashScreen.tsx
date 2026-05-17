'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import BrandLogo from '@/shared/media/BrandLogo'



export default function SplashScreen() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    const MIN_DURATION = 800
    const MAX_DURATION = 5000
    const startTime = Date.now()

    let minTimer: ReturnType<typeof setTimeout>
    let maxTimer: ReturnType<typeof setTimeout>

    const removeSplash = () => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, MIN_DURATION - elapsed)
      
      minTimer = setTimeout(() => {
        setVisible(false)
        document.body.style.overflow = ''
      }, remaining)
    }

    if (document.readyState === 'complete') {
      removeSplash()
    } else {
      window.addEventListener('load', removeSplash)
      // 极端网络环境兜底解锁
      maxTimer = setTimeout(() => {
        window.removeEventListener('load', removeSplash)
        removeSplash()
      }, MAX_DURATION)
    }

    return () => {
      window.removeEventListener('load', removeSplash)
      clearTimeout(minTimer)
      clearTimeout(maxTimer)
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(12px)' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
        >
          {/* 极柔和的背景光晕 */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
          </div>

          <div className="relative flex flex-col items-center gap-6">
            {/* Logo 标志 */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <BrandLogo className="h-12 w-12" alt="序栈" />
              <span className="flex items-start text-3xl font-black tracking-tight text-foreground">
                序栈
                <span className="ml-1 mt-1 text-[12px] font-medium leading-none text-muted-foreground/50">©</span>
              </span>
            </motion.div>

            {/* 加载指示条 */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 120, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              className="h-[2px] rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            />

            {/* 极简文字 */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.4, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
              className="text-[12px] font-medium text-muted-foreground tracking-widest uppercase"
            >
              Loading
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
