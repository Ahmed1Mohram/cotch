import { AdminCourseAgesCardsScreen } from "@/features/admin/screens/AdminCourseAgesCardsScreen";

export default async function AdminCourseDetailsPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const p = await Promise.resolve(params as any);
  return <AdminCourseAgesCardsScreen slug={p.slug} />;
}
