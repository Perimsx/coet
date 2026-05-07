import { getFriends } from "@/features/friends/lib/friends";
import { getSiteSettings } from "@/server/site-settings";
import AdminFriendsClient from "@/features/admin/friends/AdminFriendsClient";

export default async function AdminFriendsPage() {
  const [friends, settings] = await Promise.all([
    getFriends(),
    getSiteSettings(),
  ]);

  const viewData = friends.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt).toISOString(),
    updatedAt: new Date(item.updatedAt).toISOString(),
    lastCheckedAt: item.lastCheckedAt
      ? new Date(item.lastCheckedAt).toISOString()
      : null,
  }));

  return <AdminFriendsClient initialData={viewData} settings={settings} />;
}
