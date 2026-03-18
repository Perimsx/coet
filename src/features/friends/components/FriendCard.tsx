'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link2 } from 'lucide-react'
import Image from 'next/image'
import type { Friend } from '@/server/db/schema'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FriendCardProps {
  friend: Friend
  index: number
  isAutoOpen?: boolean
  disableTooltip?: boolean
}

export default function FriendCard({ 
  friend, 
  index, 
  isAutoOpen = false,
  disableTooltip = false 
}: FriendCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [imgError, setImgError] = useState(false)
  const description = friend.description || '一位优秀的博主，值得你点开看看。'

  // 融合状态，并考虑移动端禁用逻辑
  useEffect(() => {
    if (disableTooltip) {
      setIsOpen(false)
      return
    }
    setIsOpen(isHovered || isAutoOpen)
  }, [isHovered, isAutoOpen, disableTooltip])
  
  const cardContent = (
    <motion.a
      href={friend.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 300, 
        damping: 25,
        delay: Math.min(index * 0.02, 0.4) 
      }}
      onMouseEnter={() => !disableTooltip && setIsHovered(true)}
      onMouseLeave={() => !disableTooltip && setIsHovered(false)}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-300 hover:bg-muted/30 sm:gap-3.5 sm:p-3"
    >
      {/* 头像 */}
      <div className="relative h-9 w-9 shrink-0 sm:h-10 sm:w-10">
        <div className="relative h-full w-full overflow-hidden rounded-xl bg-muted/20 transition-all duration-500 group-hover:scale-110">
          {friend.avatar && !imgError ? (
            <Image 
              src={friend.avatar} 
              alt={friend.name} 
              fill
              sizes="(max-width: 640px) 36px, 40px"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-bold text-primary sm:text-sm">
              {friend.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* 昵称 */}
      <div className="flex flex-1 flex-col justify-center min-w-0">
        <div className="flex items-start gap-1.5 min-w-0">
          <span className="text-[13px] sm:text-sm font-bold tracking-tight text-foreground/80 transition-colors group-hover:text-primary break-words">
            {friend.name}
          </span>
          <div className="hidden sm:flex opacity-0 -translate-x-1 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            <Link2 className="h-3 w-3 text-primary/60" />
          </div>
        </div>
      </div>
    </motion.a>
  )

  if (disableTooltip) {
    return cardContent
  }

  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen}>
      <TooltipTrigger asChild>
        {cardContent}
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        sideOffset={8}
        className="max-w-[240px] break-words rounded-lg bg-card/90 py-1.5 px-3 text-xs font-medium leading-relaxed text-foreground/90 shadow-xl border border-border/30 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          transition={{ 
            type: "spring", 
            stiffness: 450,
            damping: 30
          }}
        >
          {description}
        </motion.div>
      </TooltipContent>
    </Tooltip>
  )
}
