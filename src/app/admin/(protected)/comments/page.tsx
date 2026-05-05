import AdminCommentsTable from "@/features/admin/comments/AdminCommentsTable";

import { buildAdminCommentThreads } from "@/features/admin/lib/comment-threads";
import { getAllComments } from "@/features/comments/lib/comments";
import { getMailSettingsSafe } from "@/server/mail-settings";

export default async function AdminCommentsPage() {
  const [comments, mailSettings] = await Promise.all([
    getAllComments(),
    getMailSettingsSafe(),
  ]);

  const threads = buildAdminCommentThreads(
    comments,
    mailSettings.ownerQq || undefined,
  );

  return (
    <section>
      <AdminCommentsTable initialThreads={threads} />
    </section>
  );
}
