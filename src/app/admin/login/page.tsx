import { redirect } from "next/navigation";
import { getAdminSession } from "@/features/admin/lib/admin-session";
import { getAdminLoginPath } from "@/features/admin/lib/routes";
import { getSiteSettings } from "@/server/site-settings";
import siteMetadata from "@/config/site";
import AdminLoginView from "@/features/admin/auth/AdminLoginView";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  const settings = await getSiteSettings();

  if (session) {
    redirect("/admin");
  }

  return (
    <AdminLoginView
      entryPath={getAdminLoginPath()}
      brandTitle={settings.title || siteMetadata.title}
    />
  );
}
