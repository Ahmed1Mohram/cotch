import { notFound } from "next/navigation";

export default async function PackageDetailsPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  await Promise.resolve(params as any);
  notFound();
}
