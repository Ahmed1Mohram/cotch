import { notFound } from "next/navigation";

export default async function AdminPackageDetailsPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  await Promise.resolve(params as any);
  notFound();
}
