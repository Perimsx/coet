'use client'

import { useActionState, useEffect, useState } from 'react'
import { loginAction, type LoginState } from '@/app/admin/actions'
import { Loader2, Eye, EyeOff } from 'lucide-react'

const initialState: LoginState = {}

export default function LoginForm({
  setIsTyping,
  showPassword,
  setShowPassword,
  setPasswordLength,
}: {
  setIsTyping?: (val: boolean) => void
  showPassword?: boolean
  setShowPassword?: (val: boolean) => void
  setPasswordLength?: (val: number) => void
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState)
  const [localShowPassword, setLocalShowPassword] = useState(false)

  const isPasswordVisible = setShowPassword ? showPassword : localShowPassword

  const togglePasswordVisibility = () => {
    if (setShowPassword) {
      setShowPassword(!isPasswordVisible)
      return
    }

    setLocalShowPassword(!isPasswordVisible)
  }

  useEffect(() => {
    if (state?.success) {
      window.location.href = '/admin'
    }
  }, [state?.success])

  const handleInputFocus = () => setIsTyping?.(true)
  const handleInputBlur = () => setIsTyping?.(false)

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordLength?.(e.target.value.length)
  }

  return (
    <form action={formAction} className="space-y-5">
      <div
        className="animate-view-in rounded-3xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-600"
        style={{ animationDelay: '50ms' }}
      >
        Current admin entry: /18671188011
      </div>

      <div className="space-y-1.5 animate-view-in" style={{ animationDelay: '100ms' }}>
        <label htmlFor="password" className="block px-1 text-[14px] font-medium text-slate-800">
          Admin password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={isPasswordVisible ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="Enter admin password"
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onChange={handlePasswordChange}
            className="h-11 w-full rounded-full border border-slate-200/80 bg-slate-50/50 py-2 pl-4 pr-11 text-[15px] font-medium tracking-widest text-slate-800 transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-400/50 focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-blue-50"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            onClick={togglePasswordVisibility}
            tabIndex={-1}
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            {isPasswordVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {state?.error && (
        <div className="animate-in fade-in py-1 text-center text-sm font-medium text-red-500">
          {state.error}
        </div>
      )}

      <div className="animate-view-in pt-2" style={{ animationDelay: '200ms' }}>
        <button
          type="submit"
          disabled={pending}
          id="login-btn"
          className="flex h-11 w-full items-center justify-center rounded-full border border-slate-200/80 bg-transparent text-[15px] font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50/80 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Enter admin</span>}
        </button>
      </div>
    </form>
  )
}
