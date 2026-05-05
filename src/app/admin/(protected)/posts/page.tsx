import AdminPostsPanel from "@/features/admin/posts/AdminPostsPanel";
import { listPostFiles } from "@/features/content/lib/posts";
import { getCategoryListAction } from "@/app/admin/actions";

export default async function AdminPostsPage() {
  const posts = await listPostFiles();
  const categories = await getCategoryListAction();

  return (
    <section>
      <AdminPostsPanel posts={posts} categoryOptions={categories} />
    </section>
  );
}
