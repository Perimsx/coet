"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import MyInfoCard, { type FriendSiteInfo } from "./MyInfoCard";

type TabType = "my-info";

export default function FriendsTabs({
  siteInfo,
}: {
  siteInfo: FriendSiteInfo;
}) {
  const [activeTab, setActiveTab] = useState<TabType>("my-info");

  const tabs = [
    { id: "my-info", label: "我的博客信息" },
  ];

  return (
    <div className="mt-8 flex flex-col space-y-6">
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "my-info" ? (
            <MyInfoCard key="my-info" siteInfo={siteInfo} />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
