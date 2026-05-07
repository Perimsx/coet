"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { toast } from "@/shared/hooks/use-toast";
import { applyFriendAction } from "@/features/friends/lib/actions";
import { toProxiedImageSrc } from "@/shared/utils/image-proxy";
import { Smile } from "lucide-react";

export default function ApplyFriendForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    avatar: "",
    description: "",
    qq: "",
  });

  const avatarUrl = useMemo(() => {
    if (formData.avatar && !/^\d{5,12}$/.test(formData.avatar)) {
      return formData.avatar;
    }
    const qqObj = /^\d{5,12}$/.test(formData.avatar)
      ? formData.avatar
      : formData.qq;
    if (qqObj && /^\d{5,12}$/.test(qqObj)) {
      return `https://q1.qlogo.cn/g?b=qq&nk=${qqObj}&s=100`;
    }
    return formData.avatar || "";
  }, [formData.avatar, formData.qq]);

  const proxiedAvatarUrl = useMemo(
    () => toProxiedImageSrc(avatarUrl),
    [avatarUrl],
  );

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [proxiedAvatarUrl]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.name || !formData.url) {
      toast("网站名称和链接为必填项", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      await applyFriendAction({
        ...formData,
        avatar: avatarUrl,
      });
      toast("申请已提交！审核通过后将展示在此页面。", "success");
      setFormData({ name: "", url: "", avatar: "", description: "", qq: "" });
    } catch (error: unknown) {
      toast(
        error instanceof Error ? error.message : "提交失败，请稍后重试",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5">
      <div className="flex items-start gap-3">
        {/* 左侧头像预览 */}
        <div className="hidden sm:block">
          {proxiedAvatarUrl && !avatarLoadFailed ? (
            <div className="relative group/avatar">
              <Image
                src={proxiedAvatarUrl}
                alt="Avatar preview"
                width={44}
                height={44}
                unoptimized
                className="h-11 w-11 rounded-2xl border border-zinc-200/50 bg-white object-cover shadow-sm transition-transform group-hover/avatar:scale-105 dark:border-white/10 dark:bg-zinc-800"
                onError={() => setAvatarLoadFailed(true)}
              />
              <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-950">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-zinc-900/50">
              <Smile className="h-5.5 w-5.5 opacity-40" />
            </div>
          )}
        </div>

        {/* 右侧输入区 */}
        <div className="flex-1 space-y-2.5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {/* 网站名称 */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-200/50 bg-white/40 backdrop-blur-md transition-all focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary/5 dark:border-white/10 dark:bg-zinc-900/40 dark:focus-within:border-primary/40 dark:focus-within:bg-zinc-900">
              <Input
                name="name"
                maxLength={40}
                required
                placeholder="网站名称 *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                className="h-10 border-none bg-transparent pl-9 text-sm shadow-none focus-visible:ring-0"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            </div>

            {/* 网站链接 */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-200/50 bg-white/40 backdrop-blur-md transition-all focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary/5 dark:border-white/10 dark:bg-zinc-900/40 dark:focus-within:border-primary/40 dark:focus-within:bg-zinc-900">
              <Input
                name="url"
                type="url"
                required
                placeholder="网站链接 *"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                disabled={isSubmitting}
                className="h-10 border-none bg-transparent pl-9 text-sm shadow-none focus-visible:ring-0"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
            </div>

            {/* QQ号 */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-200/50 bg-white/40 backdrop-blur-md transition-all focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary/5 dark:border-white/10 dark:bg-zinc-900/40 dark:focus-within:border-primary/40 dark:focus-within:bg-zinc-900">
              <Input
                name="qq"
                required
                pattern="[1-9][0-9]{4,11}"
                placeholder="通知 QQ *"
                value={formData.qq}
                onChange={(e) => setFormData({ ...formData, qq: e.target.value })}
                disabled={isSubmitting}
                className="h-10 border-none bg-transparent pl-9 text-sm shadow-none focus-visible:ring-0"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">QQ</div>
            </div>

            {/* 头像链接 */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-200/50 bg-white/40 backdrop-blur-md transition-all focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary/5 dark:border-white/10 dark:bg-zinc-900/40 dark:focus-within:border-primary/40 dark:focus-within:bg-zinc-900">
              <Input
                name="avatar"
                placeholder="头像链接 (选填)"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                disabled={isSubmitting}
                className="h-10 border-none bg-transparent pl-9 text-sm shadow-none focus-visible:ring-0"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/40 shadow-sm backdrop-blur-md transition-all focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-primary/5 dark:border-white/10 dark:bg-zinc-900/40 dark:focus-within:border-primary/40 dark:focus-within:bg-zinc-900">
            <Label htmlFor="friend-description" className="sr-only">网站简介</Label>
            <Textarea
              id="friend-description"
              name="description"
              maxLength={200}
              value={formData.description}
              placeholder="网站简介 (介绍下你的网站吧)"
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
              className="min-h-[100px] w-full resize-none rounded-none border-0 bg-transparent px-4 py-3 text-[15px] leading-relaxed shadow-none focus-visible:ring-0"
            />

            <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-3 py-1.5 dark:border-white/5 dark:bg-white/5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
                提交后需经后台审核
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden text-[10px] font-bold tabular-nums text-zinc-400 sm:block">
                  {Math.max(0, formData.description?.length || 0)} / 200
                </span>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-7.5 rounded-lg border border-primary/20 bg-primary px-4 text-[11px] font-bold text-white transition-all hover:bg-primary/90 active:scale-[0.98] dark:border-white/10"
                >
                  {isSubmitting ? "提交中..." : "提交申请"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
