import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { Navbar } from "@/components/sections/Navbar";
import { FooterClean } from "@/components/sections/FooterClean";
import { Container } from "@/components/ui/Container";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

type CourseRow = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
  description: string | null;
  cover_image_url: string | null;
};

type PackageRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  theme: string;
};

function normalizeSlug(input: string) {
  return input.trim().toLowerCase().replace(/\/+$/, "").replace(/\.html$/, "");
}

const uiFallback: Record<string, { emoji: string; imageClassName: string }> = {
  football: { emoji: "⚽", imageClassName: "object-[78%_58%]" },
  volleyball: { emoji: "🏐", imageClassName: "object-[70%_52%]" },
  basketball: { emoji: "🏀", imageClassName: "object-[82%_52%]" },
  handball: { emoji: "🤾‍♂️", imageClassName: "object-[72%_52%]" },
  injuries: { emoji: "🩹", imageClassName: "object-[78%_60%]" },
};

export default async function PackageDetailsPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  noStore();

  const p = await Promise.resolve(params as any);
  const pkgSlug = normalizeSlug(typeof p.slug === "string" ? decodeURIComponent(p.slug) : "");

  const supabase = await createSupabaseServerClient();

  const { data: pkgRow } = await supabase
    .from("packages")
    .select(
      "id,slug,title,subtitle,description,theme",
    )
    .eq("slug", pkgSlug)
    .maybeSingle();

  const pkg: PackageRow | null =
    pkgRow && (pkgRow as any).id
      ? {
          id: String((pkgRow as any).id),
          slug: String((pkgRow as any).slug),
          title: String((pkgRow as any).title ?? ""),
          subtitle: (pkgRow as any).subtitle ?? null,
          description: (pkgRow as any).description ?? null,
          theme: String((pkgRow as any).theme ?? "orange"),
        }
      : null;

  if (!pkg) {
    return (
      <div className="min-h-screen bg-[#0B0B0B]">
        <Navbar />
        <main className="pt-44 sm:pt-48 md:pt-56">
          <section className="relative overflow-hidden bg-[#050506] py-20 sm:py-28">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_620px_at_20%_0%,rgba(255,255,255,0.10),transparent_62%),radial-gradient(1000px_620px_at_85%_10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(900px_520px_at_50%_65%,rgba(255,255,255,0.06),transparent_68%)]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
            <Container>
              <div className="mx-auto max-w-3xl" dir="rtl">
                <h1 className="text-right font-heading text-4xl tracking-[0.10em] text-white sm:text-6xl">
                  الباقة غير موجودة
                </h1>
                <div className="mt-6 flex justify-end">
                  <Link
                    href="/packages"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-white/5 px-6 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
                  >
                    رجوع للباقات
                  </Link>
                </div>
              </div>
            </Container>
          </section>
        </main>
        <FooterClean />
      </div>
    );
  }

  const pcRes = await supabase
    .from("package_courses")
    .select("course_id,sort_order")
    .eq("package_id", pkg.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const courseIds: string[] = ((pcRes.data as any[]) ?? [])
    .map((r) => String(r.course_id ?? ""))
    .filter(Boolean);

  let courses: CourseRow[] = [];
  if (courseIds.length) {
    const cRes = await supabase
      .from("courses")
      .select("id,slug,title_ar,title_en,description,cover_image_url")
      .in("id", courseIds);

    const byId = new Map(((cRes.data as any[]) ?? []).map((c) => [String(c.id), c] as const));

    courses = courseIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((c: any) => ({
        id: String(c.id),
        slug: String(c.slug),
        title_ar: c.title_ar ?? null,
        title_en: c.title_en ?? null,
        description: c.description ?? null,
        cover_image_url: c.cover_image_url ?? null,
      }));
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <Navbar />
      <main className="pt-44 sm:pt-48 md:pt-56">
        <section className="relative overflow-hidden bg-[#050506] py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_620px_at_18%_0%,rgba(255,106,0,0.16),transparent_62%),radial-gradient(1000px_620px_at_86%_10%,rgba(96,165,250,0.12),transparent_60%),radial-gradient(900px_520px_at_55%_70%,rgba(255,255,255,0.05),transparent_72%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/80" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <Container>
            <div className="max-w-4xl" dir="rtl">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="font-heading text-xs tracking-[0.22em] text-white/60">الباقة</div>
                  <h1 className="mt-3 text-right font-heading text-4xl tracking-[0.10em] text-white sm:text-6xl">
                    {pkg.title}
                  </h1>
                  {pkg.subtitle ? <div className="mt-3 text-right text-white/75">{pkg.subtitle}</div> : null}
                  {pkg.description ? (
                    <div className="mt-4 text-right text-sm leading-7 text-white/75">{pkg.description}</div>
                  ) : null}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <Link
                    href="/packages"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-white/5 px-6 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
                  >
                    رجوع للباقات
                  </Link>
                </div>
              </div>

              <div className="mt-12">
                {courses.length === 0 ? (
                  <div className="rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
                    <div className="text-right font-heading text-2xl tracking-[0.10em] text-white">
                      لا توجد كورسات داخل هذه الباقة
                    </div>
                    <div className="mt-3 text-right text-sm text-white/70">ادخل الأدمن واربط الباقة بالكورسات.</div>
                  </div>
                ) : (
                  <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((c, idx) => {
                      const fallback = uiFallback[c.slug] ?? { emoji: "🔥", imageClassName: "object-center" };
                      const cover = typeof c.cover_image_url === "string" ? String(c.cover_image_url).trim() : "";
                      const image = cover ? cover : "/kalya.png";

                      return (
                        <Link
                          key={c.id}
                          href={`/programs/${encodeURIComponent(c.slug)}?pkg=${encodeURIComponent(pkg.slug)}`}
                          className="group relative isolate block aspect-[3/4] overflow-hidden rounded-3xl bg-gradient-to-r from-[#2b0000] via-[#120000] to-[#2b0000] p-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_80px_240px_-170px_rgba(0,0,0,0.96)] transition-transform duration-300 hover:-translate-y-1"
                          style={{ animationDelay: `${idx * 0.03}s` }}
                        >
                          <div className="pointer-events-none absolute inset-0 rounded-3xl">
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#7a0000]/65 via-[#ff2424]/55 to-[#3a0000]/55 opacity-95" />
                            <div className="absolute inset-0 rounded-3xl opacity-70 bg-[radial-gradient(circle,rgba(255,36,36,0.85)_1px,transparent_1.6px)] [background-size:30px_30px] [mask-image:radial-gradient(80%_70%_at_50%_50%,transparent_48%,black_74%)]" />
                          </div>

                          <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-black/55 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                            {/^https?:\/\//i.test(image) ? (
                              <img
                                src={image}
                                alt={c.title_en ?? c.slug}
                                loading="lazy"
                                className={
                                  "absolute inset-0 h-full w-full object-cover contrast-[1.04] saturate-[1.03] brightness-[1.00] transition duration-700 group-hover:scale-[1.08] group-hover:contrast-[1.10] group-hover:saturate-[1.08] " +
                                  fallback.imageClassName
                                }
                              />
                            ) : (
                              <Image
                                src={image}
                                alt={c.title_en ?? c.slug}
                                fill
                                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                                className={
                                  "object-cover contrast-[1.04] saturate-[1.03] brightness-[1.00] transition duration-700 group-hover:scale-[1.08] group-hover:contrast-[1.10] group-hover:saturate-[1.08] " +
                                  fallback.imageClassName
                                }
                              />
                            )}

                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/78 via-black/22 to-black/0" />
                            <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/10 transition group-hover:ring-[#FFB35A]/20" />

                            <div className="absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold tracking-[0.10em] text-[#FFE2B8] shadow-[0_0_0_1px_rgba(255,179,90,0.24),0_20px_70px_-50px_rgba(255,106,0,0.85)] backdrop-blur-md">
                              {fallback.emoji}
                            </div>

                            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-7" dir="rtl">
                              <div className="rounded-2xl bg-black/45 p-4 shadow-[0_0_0_1px_rgba(255,179,90,0.16),0_40px_140px_-120px_rgba(0,0,0,0.95)] backdrop-blur-md">
                                <h3 className="text-right font-heading text-lg leading-snug tracking-[0.06em] text-[#FFE2B8] sm:text-xl">
                                  {c.title_ar ?? c.title_en ?? c.slug}
                                </h3>
                                {c.title_en ? (
                                  <div className="mt-2 text-right text-xs text-[#FFB35A]" dir="ltr">
                                    {c.title_en}
                                  </div>
                                ) : null}
                                <p className="mt-2 line-clamp-2 text-right text-[13px] leading-6 text-white/88">
                                  {c.description ?? ""}
                                </p>
                                <div className="mt-4 flex justify-end">
                                  <div className="inline-flex h-11 items-center justify-center rounded-2xl bg-black/55 px-5 text-[12px] font-semibold tracking-[0.12em] text-[#FFE2B8] shadow-[0_0_0_1px_rgba(255,36,36,0.24),0_26px_90px_-70px_rgba(255,36,36,0.55)] transition hover:bg-black/45">
                                    افتح تفاصيل الكورس
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>
      </main>
      <FooterClean />
    </div>
  );
}
