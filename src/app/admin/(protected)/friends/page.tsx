import { getFriends } from "@/features/friends/lib/friends";
import AdminFriendsClient from "@/features/admin/friends/AdminFriendsClient";

export default async function AdminFriendsPage() {
  const friends = await getFriends();

  const viewData = friends.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt).toISOString(),
    updatedAt: new Date(item.updatedAt).toISOString(),
    lastCheckedAt: item.lastCheckedAt
      ? new Date(item.lastCheckedAt).toISOString()
      : null,
  }));

  return <AdminFriendsClient initialData={viewData} />;
}
