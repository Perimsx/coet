"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { TreeNode } from '@kb/lib/tree';

export interface VeliteTocItem {
  title: string;
  url: string;
  items: VeliteTocItem[];
}

// ── TOC Context (isolated to avoid re-rendering sidebar/search on TOC changes) ──

interface TOCContextType {
  currentToc: VeliteTocItem[];
  setCurrentToc: React.Dispatch<React.SetStateAction<VeliteTocItem[]>>;
  pageTitle: string;
  setPageTitle: React.Dispatch<React.SetStateAction<string>>;
}

const TOCContext = createContext<TOCContextType | undefined>(undefined);

export function TOCProvider({ children }: { children: React.ReactNode }) {
  const [currentToc, setCurrentToc] = useState<VeliteTocItem[]>([]);
  const [pageTitle, setPageTitle] = useState<string>("");
  return (
    <TOCContext value={{ currentToc, setCurrentToc, pageTitle, setPageTitle }}>
      {children}
    </TOCContext>
  );
}

export function useTOC() {
  const context = useContext(TOCContext);
  if (!context) throw new Error("useTOC must be used within a TOCProvider");
  return context;
}

// ── Theme Context ──

interface ThemeContextType {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<"light" | "dark" | "system">(() => {
    if (typeof window === "undefined") return "system";
    try {
      const saved = localStorage.getItem("kb_theme");
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved;
      }
    } catch {}
    return "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    const applySystemTheme = () => {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.remove("light", "dark");
      root.classList.add(systemDark ? "dark" : "light");
    };

    if (theme === "system") {
      applySystemTheme();
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      mql.addEventListener("change", applySystemTheme);
      return () => mql.removeEventListener("change", applySystemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: "light" | "dark" | "system") => {
    setThemeState(newTheme);
    localStorage.setItem("kb_theme", newTheme);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}

// ── Sidebar Context ──

interface SidebarContextType {
  expandedNodes: Record<string, boolean>;
  toggleNode: (path: string) => void;
  expandNode: (path: string) => void;
  expandNodes: (paths: string[]) => void;
  toggleExpandAll: (tree: TreeNode[]) => void;
  sidebarFilter: string;
  setSidebarFilter: (f: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

function SidebarProviderInner({ children }: { children: React.ReactNode }) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem("kb_expanded_nodes");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });
  const savedExpandStateRef = useRef<Record<string, boolean> | null>(null);
  const [sidebarFilter, setSidebarFilter] = useState("");

  const toggleNode = useCallback((path: string) => {
    setExpandedNodes((prev) => {
      const next = { ...prev, [path]: !prev[path] };
      localStorage.setItem("kb_expanded_nodes", JSON.stringify(next));
      return next;
    });
  }, []);

  const expandNode = useCallback((path: string) => {
    setExpandedNodes((prev) => {
      if (prev[path]) return prev;
      const next = { ...prev, [path]: true };
      localStorage.setItem("kb_expanded_nodes", JSON.stringify(next));
      return next;
    });
  }, []);

  const expandNodes = useCallback((paths: string[]) => {
    setExpandedNodes((prev) => {
      let changed = false;
      const next = { ...prev };
      paths.forEach((path) => {
        if (!next[path]) {
          next[path] = true;
          changed = true;
        }
      });
      if (!changed) return prev;
      localStorage.setItem("kb_expanded_nodes", JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleExpandAll = useCallback((tree: TreeNode[]) => {
    setExpandedNodes((prev) => {
      const expandedKeys = Object.keys(prev).filter((k) => prev[k]);
      if (expandedKeys.length > 0) {
        // 只有在当前有展开项时，才保存快照
        savedExpandStateRef.current = { ...prev };
        localStorage.setItem("kb_expanded_nodes", JSON.stringify({}));
        return {};
      } else {
        if (savedExpandStateRef.current && Object.keys(savedExpandStateRef.current).length > 0) {
          const restored = savedExpandStateRef.current;
          savedExpandStateRef.current = null;
          localStorage.setItem("kb_expanded_nodes", JSON.stringify(restored));
          return restored;
        } else {
          const next: Record<string, boolean> = {};
          const traverse = (nodes: TreeNode[]) => {
            nodes.forEach((node) => {
              if (node.isFolder) {
                next[node.path] = true;
                if (node.children) traverse(node.children);
              }
            });
          };
          traverse(tree);
          localStorage.setItem("kb_expanded_nodes", JSON.stringify(next));
          return next;
        }
      }
    });
  }, []);

  const value = useMemo(
    () => ({ expandedNodes, toggleNode, expandNode, expandNodes, toggleExpandAll, sidebarFilter, setSidebarFilter }),
    [expandedNodes, toggleNode, expandNode, expandNodes, toggleExpandAll, sidebarFilter, setSidebarFilter],
  );

  return <SidebarContext value={value}>{children}</SidebarContext>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
}

// ── Modal Context (search, mobile sidebar, mobile TOC) ──

interface ModalContextType {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  isMobileTOCOpen: boolean;
  setIsMobileTOCOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileTOCOpen, setIsMobileTOCOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const value = useMemo(
    () => ({ isMobileSidebarOpen, setIsMobileSidebarOpen, isMobileTOCOpen, setIsMobileTOCOpen, isSearchOpen, setIsSearchOpen }),
    [isMobileSidebarOpen, setIsMobileSidebarOpen, isMobileTOCOpen, setIsMobileTOCOpen, isSearchOpen, setIsSearchOpen],
  );

  return <ModalContext value={value}>{children}</ModalContext>;
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within a ModalProvider");
  return context;
}

// ── Legacy UIProvider (wraps all sub-providers for backward compatibility) ──

export function UIProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProviderInner>
        <ModalProvider>
          <TOCProvider>
            {children}
          </TOCProvider>
        </ModalProvider>
      </SidebarProviderInner>
    </ThemeProvider>
  );
}

// ── Combined useUI (backward-compatible, reads from all sub-contexts) ──

export function useUI() {
  const theme = useContext(ThemeContext);
  const sidebar = useContext(SidebarContext);
  const modal = useContext(ModalContext);
  const toc = useContext(TOCContext);
  if (!theme || !sidebar || !modal || !toc) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return { ...theme, ...sidebar, ...modal, ...toc };
}

// Re-export all hooks for convenience
export { useSidebar as useUISidebar, useModal as useUIModal };
