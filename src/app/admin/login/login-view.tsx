'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import LoginForm from './login-form'
import { AnimatedCharacters } from '@/features/admin/components/animated-characters'
import siteMetadata from '@/config/site'

export default function LoginView({
  entryPath,
  brandTitle,
}: {
  entryPath: string
  brandTitle: string
}) {
  const [isTyping, setIsTyping] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLength, setPasswordLength] = useState(0)

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/80 via-white to-blue-50/30 p-4">
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.03)]" />

      <div className="relative z-10 flex w-full max-w-[900px] animate-view-in flex-col items-center justify-center gap-8 pb-12 md:flex-row md:gap-16 lg:gap-24">
        <div className="hidden flex-col items-center justify-center md:flex">
          <AnimatedCharacters
            isTyping={isTyping}
            showPassword={showPassword}
            passwordLength={passwordLength}
          />
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-10 flex flex-col items-center md:items-start">
            <div className="mb-8 flex items-center justify-center gap-3">
              <Image
                src={siteMetadata.siteLogo}
                alt={`${brandTitle} 标志`}
                width={36}
                height={36}
                className="rounded-full shadow-sm"
                priority
              />
              <span className="text-[20px] font-semibold tracking-tight text-slate-800">
                {brandTitle}
              </span>
            </div>

            <div className="space-y-2 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">欢迎回来</h1>
              <p className="text-[15px] font-normal text-slate-500">
                请输入管理员密码以继续
              </p>
            </div>
          </div>

          <div className="bg-transparent px-2 sm:px-0">
            <LoginForm
              entryPath={entryPath}
              setIsTyping={setIsTyping}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              setPasswordLength={setPasswordLength}
            />
          </div>

          <div className="mt-12 text-center md:text-left">
            <Link
              href="/"
              className="inline-flex items-center text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-800"
            >
              返回前台
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
