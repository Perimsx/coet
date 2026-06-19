"use client";

import { useEffect, useState } from "react";
import { getDictionary, type Dictionary } from "@/shared/utils/i18n";

type Locale = 'zh' | 'en';

function readLocale(): Locale {
  try {
    const v = localStorage.getItem('locale');
    if (v === 'en' || v === 'zh') return v;
  } catch {}
  return 'zh';
}

export default function useLocaleDictionary(): Dictionary {
  const [dictionary, setDictionary] = useState<Dictionary>(() => getDictionary('zh'));

  useEffect(() => {
    setDictionary(getDictionary(readLocale()));

    // 同标签页内 LanguageContext 切换语言时触发
    const onLocaleChange = (e: Event) => {
      const locale = (e as CustomEvent<Locale>).detail;
      if (locale === 'en' || locale === 'zh') {
        setDictionary(getDictionary(locale));
      }
    };

    // 跨标签页 localStorage 变化
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'locale') {
        setDictionary(getDictionary(readLocale()));
      }
    };

    window.addEventListener('locale-change', onLocaleChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('locale-change', onLocaleChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return dictionary;
}
