'use client'

import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import ApplyFriendForm from './apply-friend-form'
import MyInfoCard, { type FriendSiteInfo } from './MyInfoCard'

type TabType = 'my-info' | 'apply'

export default function FriendsTabs({ siteInfo }: { siteInfo: FriendSiteInfo }) {
  const [activeTab, setActiveTab] = useState<TabType>('my-info')

  const tabs = [
    { id: 'my-info', label: '我的博客信息' },
    { id: 'apply', label: '申请友链' },
  ]

  return (
    <div className="mt-8 flex flex-col space-y-6">
      <div className="flex justify-center">
        <div className="relative flex items-center gap-0.5 rounded-lg border border-border/40 bg-zinc-100/50 p-1 backdrop-blur-xl dark:bg-white/5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`group relative z-10 rounded-md px-4 py-1 text-[12px] font-bold transition-all duration-300 ${
                  isActive ? 'text-foreground' : 'text-foreground/45 hover:text-foreground/75'
                }`}
              >
                {isActive ? (
                  <motion.div
                    layoutId="active-friend-tab"
                    className="absolute inset-0 rounded-md bg-background shadow-[0_1px_2px_rgba(0,0,0,0.1)] ring-1 ring-black/5 dark:ring-white/10"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                ) : null}
                <span className="relative z-20">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'my-info' ? (
            <MyInfoCard key="my-info" siteInfo={siteInfo} />
          ) : (
            <motion.div
              key="apply"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-auto max-w-2xl"
            >
              <ApplyFriendForm />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
