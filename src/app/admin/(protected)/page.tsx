import AdminDashboardClient from "./AdminDashboardClient";

import {
  getAllComments,
  getPendingCommentCount,
} from "@/features/comments/lib/comments";
import { getPostCount, listPostFiles } from "@/features/content/lib/posts";

export default async function AdminDashboardPage() {
  const [posts, postCount, allComments, pendingComments] = await Promise.all([
    listPostFiles(),
    getPostCount(),
    getAllComments(),
    getPendingCommentCount(),
  ]);

  const commentViewData = allComments.map((item) => ({
    id: item.id,
    avatar: item.avatar ?? null,
    authorName: item.authorName,
    content: item.content,
    isAdmin: Boolean(item.isAdmin),
    location: item.location ?? null,
    status: item.status,
    createdAt:
      item.createdAt instanceof Date
        ? item.createdAt.toISOString()
        : new Date(item.createdAt).toISOString(),
  }));

  const hour = new Date().getHours();
  const initialGreeting =
    hour < 6
      ? "凌晨好"
      : hour < 9
        ? "早上好"
        : hour < 12
          ? "上午好"
          : hour < 14
            ? "中午好"
            : hour < 18
              ? "下午好"
              : "晚上好";

  return (
    <AdminDashboardClient
      posts={posts}
      postCount={postCount}
      allComments={commentViewData}
      pendingComments={pendingComments}
      initialGreeting={initialGreeting}
    />
  );
}
