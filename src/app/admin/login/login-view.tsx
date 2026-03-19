'use client'

import Link from 'next/link'
import Image from 'next/image'
import { LockKeyhole, MonitorSmartphone, Route, ShieldCheck, TimerReset } from 'lucide-react'
import siteMetadata from '@/config/site'
import LoginForm from './login-form'

const securityNotes = [
  {
    icon: ShieldCheck,
    title: '双层入口',
    description: '外部隐藏路径会重写到内部登录页，生产环境不直接暴露真实登录地址。',
  },
  {
    icon: TimerReset,
    title: '登录限流',
    description: '连续输错会触发短时限流，降低暴力破解的可行性。',
  },
  {
    icon: MonitorSmartphone,
    title: '会话追踪',
    description: '登录会记录设备、IP 和最近活动时间，方便后续审计。',
  },
]

export default function LoginView({ entryPath }: { entryPath: string }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_40%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(255,255,255,1))] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.08fr_minmax(360px,460px)]">
          <section className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-8">
            <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(15,23,42,0))]" />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="space-y-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <Route className="size-3.5" />
                  当前外部入口 {entryPath}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={siteMetadata.siteLogo}
                      alt={`${siteMetadata.title} logo`}
                      width={40}
                      height={40}
                      className="rounded-2xl border border-slate-200 bg-white p-1"
                      priority
                    />
                    <div>
                      <div className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                        Coet Admin
                      </div>
                      <div className="text-lg font-semibold text-slate-900">{siteMetadata.title}</div>
                    </div>
                  </div>

                  <div className="max-w-xl space-y-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                      后台工作区已切到更安全、更清晰的一体化入口
                    </h1>
                    <p className="text-sm leading-7 text-slate-600 sm:text-[15px]">
                      登录后会进入新的后台壳层，导航、内容、互动、资产和设置会统一收在同一个工作流里。
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {securityNotes.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.title}
                      className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4"
                    >
                      <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <Icon className="size-4" />
                      </div>
                      <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                      <p className="mt-2 text-xs leading-6 text-slate-600">{item.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <LockKeyhole className="size-3.5" />
                  仅授权管理员可访问
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">登录后台</h2>
                  <p className="text-sm leading-6 text-slate-600">
                    继续使用你现在的管理员密码。刷新令牌和安全审计会在登录后自动启用。
                  </p>
                </div>
              </div>

              <LoginForm entryPath={entryPath} />

              <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
              >
                返回前台
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
