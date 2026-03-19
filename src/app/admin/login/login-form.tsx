"use client";

import { useActionState, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Route, ShieldAlert } from "lucide-react";
import { loginAction, type LoginState } from "@/app/admin/actions";

const initialState: LoginState = {};

export default function LoginForm({ entryPath }: { entryPath: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.success) {
      window.location.href = "/admin";
    }
  }, [state?.success]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Route className="size-4" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-900">当前访问入口</div>
            <div className="break-all text-sm text-slate-600">{entryPath}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-800"
        >
          管理员密码
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="输入后台密码"
            className="hide-native-password-toggle h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-[15px] text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-700"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {state?.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        <span>{pending ? "正在验证" : "进入后台"}</span>
      </button>
    </form>
  );
}
