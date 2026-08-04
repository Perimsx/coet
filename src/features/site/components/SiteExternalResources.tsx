"use client";

import { useEffect } from "react";

const stylesheetUrls = [
  "https://cn-font.claude-code-best.win/packages/lywkpmydb/dist/LXGWWenKaiScreen/result.css",
  "https://cn-font.claude-code-best.win/packages/xuandongkaishu/dist/XuandongKaishu/result.css",
  "https://cn-font.claude-code-best.win/packages/hcqyt/dist/ChillRoundFBold/result.css",
  "https://cdn.jsdelivr.net/npm/misans@4.0.0/lib/misans-400-regular.min.css",
  "https://cdn.jsdelivr.net/npm/misans@4.0.0/lib/misans-500-medium.min.css",
  "https://cdn.jsdelivr.net/npm/misans@4.0.0/lib/misans-600-semibold.min.css",
  "https://cdn.jsdelivr.net/npm/misans@4.0.0/lib/misans-700-bold.min.css",
];

export function SiteExternalResources() {
  useEffect(() => {
    if (!window.isSecureContext) return;

    const nodes: HTMLElement[] = [];
    for (const href of stylesheetUrls) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.siteExternalResource = "true";
      document.head.appendChild(link);
      nodes.push(link);
    }

    const analytics = document.createElement("script");
    analytics.async = true;
    analytics.src = "https://www.googletagmanager.com/gtag/js?id=G-923KSYBNY1";
    document.head.appendChild(analytics);
    nodes.push(analytics);

    const inlineAnalytics = document.createElement("script");
    inlineAnalytics.text =
      "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-923KSYBNY1');";
    document.head.appendChild(inlineAnalytics);
    nodes.push(inlineAnalytics);

    const tagManager = document.createElement("script");
    tagManager.text =
      "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-W3XWTM5C');";
    document.head.appendChild(tagManager);
    nodes.push(tagManager);

    const clarity = document.createElement("script");
    clarity.text =
      '(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","x9bdwsq18h");';
    document.head.appendChild(clarity);
    nodes.push(clarity);

    return () => {
      for (const node of nodes) node.remove();
    };
  }, []);

  return null;
}
