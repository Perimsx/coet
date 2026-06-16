"use client";

import { useEffect } from "react";
import { useUI, VeliteTocItem } from '@kb/context/UIContext';

interface TOCUpdaterProps {
  toc: VeliteTocItem[];
  title?: string;
}

export default function TOCUpdater({ toc, title }: TOCUpdaterProps) {
  const { setCurrentToc, setPageTitle } = useUI();

  useEffect(() => {
    setCurrentToc(toc);
    if (title) setPageTitle(title);

    return () => {
      // 仅在当前上下文仍然是本页写入的内容时才清理，避免路由切换时旧页面误清空新页面 TOC。
      setCurrentToc((current) => (current === toc ? [] : current));
      if (title) {
        setPageTitle((current) => (current === title ? "" : current));
      }
    };
  }, [toc, title, setCurrentToc, setPageTitle]);

  return null;
}
