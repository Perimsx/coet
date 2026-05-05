import { notFound } from "next/navigation";
import AdminPostEditorPage from "@/features/admin/posts/AdminPostEditorPage";
import { getPostEditorData } from "@/features/content/lib/posts";
import { getCategoryListAction } from "@/app/admin/actions";

function createEmptyPost() {
  return {
    relativePath: "",
    title: "",
    slug: "",
    date: new Date().toISOString().slice(0, 10),
    summary: "",
    tags: "",
    categories: "",
    draft: true,
    content: "",
  };
}

export default async function AdminPostEditPage(props: {
  searchParams: Promise<{ path?: string; new?: string }>;
}) {
  const searchParams = await props.searchParams;
  const rawPath = searchParams.path?.trim();
  const isNew = searchParams.new === "1" || !rawPath;

  if (isNew) {
    const availableCategories = await getCategoryListAction();
    return (
      <AdminPostEditorPage
        initialValue={createEmptyPost()}
        availableCategories={availableCategories}
      />
    );
  }

  try {
    const post = await getPostEditorData(rawPath);
    const availableCategories = await getCategoryListAction();
    return (
      <AdminPostEditorPage
        initialValue={{
          relativePath: post.relativePath,
          title: post.title,
          slug: post.slug,
          date: post.date,
          summary: post.summary,
          tags: post.tags.join(", "),
          categories: post.categories.join(", "),
          draft: post.draft,
          content: post.content,
        }}
        availableCategories={availableCategories}
      />
    );
  } catch {
    notFound();
  }
}
