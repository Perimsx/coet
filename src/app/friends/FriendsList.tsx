'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import FriendCard from '@/features/friends/components/FriendCard'
import type { Friend } from '@/server/db/schema'

interface FriendsListProps {
  friends: Friend[]
}

export default function FriendsList({ friends }: FriendsListProps) {
  const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set())
  const activeIndicesRef = useRef<Set<number>>(new Set())
  const [isMobile, setIsMobile] = useState(false)

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleIndex = useCallback((index: number, duration: number) => {
    setActiveIndices((prev) => {
      const next = new Set(prev)
      next.add(index)
      activeIndicesRef.current = next
      return next
    })

    setTimeout(() => {
      setActiveIndices((prev) => {
        const next = new Set(prev)
        next.delete(index)
        activeIndicesRef.current = next
        return next
      })
    }, duration)
  }, [])

  useEffect(() => {
    // 如果是移动端或没有友链，不开启自动弹出逻辑
    if (friends.length === 0 || isMobile) return

    const interval = setInterval(() => {
      const batchSize = Math.floor(Math.random() * 2) + 2
      const indicesToPick = new Set<number>()

      while (indicesToPick.size < batchSize) {
        const randomIndex = Math.floor(Math.random() * friends.length)
        if (!activeIndicesRef.current.has(randomIndex)) {
          indicesToPick.add(randomIndex)
        }
        if (indicesToPick.size >= friends.length) break
      }

      indicesToPick.forEach((idx) => {
        const duration = 1200 + Math.random() * 1000
        toggleIndex(idx, duration)
      })
    }, 1800)

    return () => clearInterval(interval)
  }, [friends, toggleIndex, isMobile])

  return (
    <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-4">
      {friends.map((friend, index) => (
        <FriendCard 
          key={friend.id} 
          friend={friend} 
          index={index} 
          isAutoOpen={activeIndices.has(index)}
          disableTooltip={isMobile}
        />
      ))}

      {friends.length === 0 && (
        <div className="col-span-full py-12 text-center text-muted-foreground">
          暂无友链
        </div>
      )}
    </div>
  )
}
