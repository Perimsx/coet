'use client'

import { useMemo, useState, useCallback } from 'react'
import { motion, type Variants } from 'framer-motion'
import Image from '@/features/content/components/Image'
import PageHeader from '@/shared/components/PageHeader'
import { useNavLanguage } from '@/features/site/lib/nav-language'
import type { Friend } from '@/features/friends/lib/friends'
import { siteMetadata } from '@/blog.config'

interface FriendsClientProps {
  friends: Friend[]
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 260, damping: 25 },
  },
}

function FriendAvatar({ name, src }: { name: string; src: string }) {
  const [broken, setBroken] = useState(false)

  if (broken) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary ring-2 ring-border/20 transition-transform duration-300 group-hover:scale-110 group-hover:ring-primary/30">
        {name.slice(0, 1).toUpperCase()}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={name}
      width={40}
      height={40}
      className="h-10 w-10 rounded-full object-cover ring-2 ring-border/20 transition-transform duration-300 group-hover:scale-110 group-hover:ring-primary/30"
      onError={() => setBroken(true)}
    />
  )
}

function FriendCard({
  friend,
  onClick,
}: {
  friend: Friend
  onClick: (friend: Friend) => void
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onClick(friend)}
      variants={itemVariants}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex cursor-pointer flex-col items-center gap-2 overflow-hidden rounded-xl border border-border/30 bg-background/50 p-3.5 sm:p-4 backdrop-blur-sm transition-all hover:shadow-lg hover:bg-muted/30 dark:hover:bg-white/5"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute left-1/2 top-6 h-20 w-20 -translate-x-1/2 rounded-full bg-primary/10 blur-2xl" />
      </div>

      <div className="relative z-10">
        <FriendAvatar name={friend.name} src={friend.avatar} />
      </div>
      <span className="relative z-10 text-[13px] font-bold text-foreground transition-colors group-hover:text-primary">
        {friend.name}
      </span>
      {friend.description && (
        <span className="relative z-10 text-[11px] text-muted-foreground line-clamp-1 text-center">
          {friend.description}
        </span>
      )}
    </motion.button>
  )
}

export default function FriendsClient({ friends }: FriendsClientProps) {
  const { dictionary } = useNavLanguage()
  const [pendingFriend, setPendingFriend] = useState<Friend | null>(null)
  const [copied, setCopied] = useState(false)

  const myInfo = {
    name: siteMetadata.title,
    url: siteMetadata.siteUrl,
    avatar: 'https://cot.wiki/avatar.png',
    description: '在有序的世界里，寻一处生活的归栈。',
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Friend[]>()
    for (const f of friends) {
      const key = f.group || '未分组'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    return Array.from(map.entries())
  }, [friends])

  const handleConfirm = () => {
    if (pendingFriend) {
      window.open(pendingFriend.url, '_blank', 'noopener,noreferrer')
      setPendingFriend(null)
    }
  }

  const handleCopy = useCallback(async () => {
    const info = `${myInfo.name}\n${myInfo.url}\n${myInfo.description}`
    try {
      await navigator.clipboard.writeText(info)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }, [myInfo])

  const scrollToInfo = () => {
    document.getElementById('friend-info')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="mx-auto max-w-5xl px-4 pt-4 pb-12 sm:pt-6 sm:pb-16 sm:px-6 lg:px-8">
      <PageHeader
        title={dictionary.friends.title}
        meta={
          <button
            type="button"
            onClick={scrollToInfo}
            className="inline-flex items-center gap-1 text-muted-foreground/85 hover:text-primary transition-colors"
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="hidden sm:inline">想交换友链？下滑查看本站信息与申请方式</span>
            <span className="sm:hidden">交换友链</span>
          </button>
        }
      />

      {friends.length === 0 ? (
        <div className="mt-20 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center">
            <span className="text-3xl">🤝</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">{dictionary.friends.upgrading}</h3>
            <p className="max-w-md text-muted-foreground">
              {dictionary.friends.description}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 友链卡片 */}
          <div className="space-y-8">
            {grouped.map(([groupName, groupFriends]) => (
              <div key={groupName}>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-tight text-foreground/80">
                  <span className="inline-block h-4 w-1 rounded-full bg-primary/60" />
                  {groupName}
                  <span className="text-xs font-medium text-muted-foreground/50">
                    {groupFriends.length}
                  </span>
                </h2>
                <motion.div
                  className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-50px' }}
                >
                  {groupFriends.map((friend) => (
                    <FriendCard
                      key={friend.url}
                      friend={friend}
                      onClick={setPendingFriend}
                    />
                  ))}
                </motion.div>
              </div>
            ))}
          </div>

          {/* 本站信息 + 申请友链 并排 */}
          <div id="friend-info" className="mt-14 grid gap-5 scroll-mt-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-border/20 bg-muted/30 p-5 sm:p-6"
            >
              <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground/80">
                <span className="inline-block h-4 w-1 rounded-full bg-primary/60" />
                本站信息
              </h2>
              <div className="mt-4 flex items-center gap-4">
                <div className="h-14 w-14 shrink-0">
                  <Image
                    src={myInfo.avatar}
                    alt={myInfo.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-border/30"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground">{myInfo.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {myInfo.description}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/60 truncate">
                    {myInfo.url}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[13px] text-muted-foreground/70">
                  如需添加本站为友链，可复制以下信息：
                </p>
                <div className="mt-2.5 rounded-lg border border-border/20 bg-background/80 p-3">
                  <pre className="whitespace-pre-wrap break-all text-[13px] text-muted-foreground leading-relaxed">
                    {`名称：${myInfo.name}\n链接：${myInfo.url}\n头像：${myInfo.avatar}\n简介：${myInfo.description}`}
                  </pre>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  {copied ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      已复制
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      复制信息
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-border/20 bg-muted/30 p-5 sm:p-6"
            >
              <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground/80">
                <span className="inline-block h-4 w-1 rounded-full bg-primary/60" />
                申请友链
              </h2>
              <ul className="mt-4 space-y-2.5 text-[13px] text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="mt-[3px] shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">1</span>
                  <span>请先在您的网站中添加本站友链（信息见左侧），确保链接可正常访问。</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-[3px] shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">2</span>
                  <span>通过 GitHub Issue 提交友链申请，附上您的站点信息和本站友链已添加的截图。</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-[3px] shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">3</span>
                  <span>我将在审核后尽快添加，如有疑问可联系 cotovo@163.com。</span>
                </li>
              </ul>
              <a
                href={`${siteMetadata.siteRepo}/issues/new?title=友链申请&labels=友链`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                前往 GitHub 提交申请
              </a>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 text-center text-xs text-muted-foreground/60"
          >
            感谢每一位朋友的陪伴与支持 ✦
          </motion.p>
        </>
      )}

      {/* 跳转确认弹窗 */}
      {pendingFriend && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setPendingFriend(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-sm rounded-2xl border border-border/20 bg-background p-6 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <FriendAvatar
                  name={pendingFriend.name}
                  src={pendingFriend.avatar}
                />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {pendingFriend.name}
              </h3>
              {pendingFriend.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {pendingFriend.description}
                </p>
              )}
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/60">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <span className="truncate max-w-[240px]">
                  {pendingFriend.url}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground/70">
                即将离开本站，跳转至外部站点
              </p>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingFriend(null)}
                className="flex-1 rounded-lg border border-border/30 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                继续访问
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  )
}
