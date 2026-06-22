import { categoryMap } from "./constants";

export function sortByDate<T extends { date?: string; title?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const getTime = (d?: string) => {
      if (!d) return 0;
      const t = new Date(d).getTime();
      return isNaN(t) ? 0 : t;
    };
    const diff = getTime(b.date) - getTime(a.date);
    if (diff !== 0) return diff;
    // 辅排：如果时间戳相同，按标题字母排序，实现稳定排序
    const titleA = a.title || "";
    const titleB = b.title || "";
    return titleA.localeCompare(titleB);
  });
}

export interface TreeNode {
  name: string;
  path: string; // 文件夹路径或文章 permalink
  isFolder: boolean;
  children?: TreeNode[];
  title?: string;
  docCount?: number;
}

export function buildDocTree(posts: { slug: string; title: string; permalink: string }[]): TreeNode[] {
  const root: TreeNode[] = [];
  const seenSlugs = new Set<string>();

  posts.forEach((post) => {
    if (seenSlugs.has(post.slug)) {
      console.warn(`Duplicate slug detected and ignored: ${post.slug}`);
      return;
    }
    seenSlugs.add(post.slug);
    const parts = post.slug.split("/");
    let currentLevel = root;
    let currentPath = "";
    // 每一层维护一个 Map，实现 O(1) 文件夹查找
    let currentMap: Map<string, TreeNode> | null = null;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (isLast) {
        // 叶子节点（文章）
        currentLevel.push({
          name: part,
          path: post.permalink,
          isFolder: false,
          title: post.title,
          docCount: 1,
        });
      } else {
        // 目录节点（文件夹）— 用 Map 做 O(1) 查找
        if (!currentMap) {
          currentMap = new Map<string, TreeNode>();
          for (const item of currentLevel) {
            if (item.isFolder) currentMap.set(item.name, item);
          }
        }
        let folder = currentMap.get(part);
        if (!folder) {
          const key = part.toLowerCase();
          folder = {
            name: part,
            path: currentPath,
            isFolder: true,
            children: [],
            title: categoryMap[key] || (part.charAt(0).toUpperCase() + part.slice(1)),
          };
          currentLevel.push(folder);
          currentMap.set(part, folder);
        }
        currentLevel = folder.children!;
        currentMap = null; // 进入下一层，重新构建 Map
      }
    });
  });

  // 递归计算每个文件夹的文档总数
  const calculateDocCounts = (nodes: TreeNode[]): number => {
    let total = 0;
    nodes.forEach((node) => {
      if (node.isFolder) {
        node.docCount = calculateDocCounts(node.children || []);
        total += node.docCount;
      } else {
        total += 1;
      }
    });
    return total;
  };

  calculateDocCounts(root);

  // 对树进行排序（文件夹在前，文章在后；按标题字母排序）
  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return (a.title || a.name).localeCompare(b.title || b.name);
    });
    nodes.forEach((node) => {
      if (node.children) {
        sortTree(node.children);
      }
    });
  };

  sortTree(root);
  return root;
}
