'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const SPLASH_DURATION = 1800
const SPLASH_KEY = '__splash_shown__'

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // 同一会话内只展示一次
    if (sessionStorage.getItem(SPLASH_KEY)) return
    setVisible(true)
    // 锁定滚动
    document.body.style.overflow = 'hidden'

    const timer = setTimeout(() => {
      setVisible(false)
      document.body.style.overflow = ''
      sessionStorage.setItem(SPLASH_KEY, '1')
    }, SPLASH_DURATION)

    return () => {
      clearTimeout(timer)
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
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-2xl font-black text-white tracking-tighter">G</span>
              </div>
              <span className="text-3xl font-black tracking-tight text-foreground">
                序栈
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
