"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  side: "left" | "right";
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

export default function MobileDrawer({ isOpen, onClose, title, side, children, headerContent }: MobileDrawerProps) {
  const slideClass = side === "left" ? "animate-slide-in-left" : "animate-slide-in-right";
  const positionClass = side === "left" ? "left-0 border-r" : "right-0 border-l";

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-background/50 backdrop-blur-sm animate-fade-in-overlay no-print" />
        <Dialog.Content
          className={`fixed top-0 bottom-0 z-[60] w-80 max-w-[85vw] bg-background/90 dark:bg-background/80 backdrop-blur-[32px] saturate-[1.2] border-divider flex flex-col p-5 shadow-[0_0_60px_-15px_rgba(0,0,0,0.3)] ${positionClass} ${slideClass}`}
        >
          <Dialog.Description className="sr-only">
            侧边栏面板，用于展示文章大纲目录或提供移动端导航导航。
          </Dialog.Description>
          <div className="flex items-center justify-between border-b border-divider pb-3 mb-2">
            {headerContent ? (
              <>
                <Dialog.Title asChild>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {headerContent}
                  </div>
                </Dialog.Title>
              </>
            ) : (
              <Dialog.Title className="text-xs font-semibold tracking-wider text-foreground/60 uppercase">
                {title}
              </Dialog.Title>
            )}
            <Dialog.Close className="p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-foreground/60 hover:text-foreground hover:bg-foreground/5 active:scale-[0.9] transition-all duration-300 focus:outline-none">
              <X size={16} />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
