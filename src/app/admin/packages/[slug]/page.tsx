import { AdminPackageDetailsScreen } from "@/features/admin/screens/AdminPackageDetailsScreen";

export default async function AdminPackageDetailsPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const p = await Promise.resolve(params as any);
  return <AdminPackageDetailsScreen slug={p.slug} />;
}
