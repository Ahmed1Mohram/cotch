import { AdminCourseSubscribersScreen } from "@/features/admin/screens/AdminCourseSubscribersScreen";

export default async function AdminCourseSubscribersPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const p = await Promise.resolve(params as any);
  return <AdminCourseSubscribersScreen slug={p.slug} />;
}
