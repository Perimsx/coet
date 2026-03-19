"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import FriendCard from "@/features/friends/components/FriendCard";
import type { Friend } from "@/server/db/schema";

interface FriendsListProps {
  friends: Friend[];
}

export default function FriendsList({ friends }: FriendsListProps) {
  const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set());
  const activeIndicesRef = useRef<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleActiveIndex = useCallback((index: number, duration: number) => {
    setActiveIndices((current) => {
      const next = new Set(current);
      next.add(index);
      activeIndicesRef.current = next;
      return next;
    });

    window.setTimeout(() => {
      setActiveIndices((current) => {
        const next = new Set(current);
        next.delete(index);
        activeIndicesRef.current = next;
        return next;
      });
    }, duration);
  }, []);

  useEffect(() => {
    if (!friends.length || isMobile) return;

    const intervalId = window.setInterval(() => {
      const batchSize = Math.floor(Math.random() * 2) + 2;
      const randomIndices = new Set<number>();

      while (
        randomIndices.size < batchSize &&
        randomIndices.size < friends.length
      ) {
        const randomIndex = Math.floor(Math.random() * friends.length);
        if (!activeIndicesRef.current.has(randomIndex)) {
          randomIndices.add(randomIndex);
        }
      }

      randomIndices.forEach((index) => {
        const duration = 1200 + Math.random() * 1000;
        toggleActiveIndex(index, duration);
      });
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, [friends.length, isMobile, toggleActiveIndex]);

  return (
    <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-4">
      {friends.map((friend, index) => (
        <FriendCard
          key={friend.id}
          friend={friend}
          index={index}
          isAutoOpen={activeIndices.has(index)}
          disableTooltip={isMobile}
        />
      ))}

      {friends.length === 0 ? (
        <div className="col-span-full py-12 text-center text-muted-foreground">
          暂无友链
        </div>
      ) : null}
    </div>
  );
}
