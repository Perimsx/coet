import React from "react";
import SmoothScroll from "@/components/layout/SmoothScroll";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <SmoothScroll>{children}</SmoothScroll>;
}
