import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { CoursesMarquee } from "@/components/sections/CoursesMarquee";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

type FeaturedCourseRow = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
  description: string | null;
  cover_image_url: string | null;
  featured_sort_order: number | null;
  featured_package_id: string | null;
};

type PackageRow = {
  id: string;
  slug: string;
  title: string | null;
};

const uiFallback: Record<string, { emoji: string; imageClassName: string }> = {
  football: { emoji: "⚽", imageClassName: "object-[78%_58%]" },
  volleyball: { emoji: "🏐", imageClassName: "object-[70%_52%]" },
  basketball: { emoji: "🏀", imageClassName: "object-[82%_52%]" },
  handball: { emoji: "🤾‍♂️", imageClassName: "object-[72%_52%]" },
  injuries: { emoji: "🩹", imageClassName: "object-[78%_60%]" },
};

export async function FeaturedCourses() {
  noStore();

  const supabase = await createSupabaseServerClient();

  const coursesRes = await supabase
    .from("courses")
    .select("id,slug,title_ar,title_en,description,cover_image_url,featured_sort_order,featured_package_id")
    .eq("featured", true)
    .eq("is_published", true)
    .order("featured_sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(12);

  const rawCourses = ((coursesRes.data as any[]) ?? []) as any[];
  const courses: FeaturedCourseRow[] = rawCourses
    .map((r) => ({
      id: String(r.id),
      slug: String(r.slug ?? ""),
      title_ar: r.title_ar ?? null,
      title_en: r.title_en ?? null,
      description: r.description ?? null,
      cover_image_url: r.cover_image_url ?? null,
      featured_sort_order:
        r.featured_sort_order === null || r.featured_sort_order === undefined ? null : Number(r.featured_sort_order),
      featured_package_id: r.featured_package_id ? String(r.featured_package_id) : null,
    }))
    .filter((c) => Boolean(c.slug));

  if (courses.length === 0) return null;

  const pkgIds = Array.from(new Set(courses.map((c) => c.featured_package_id).filter(Boolean))) as string[];

  const packagesById = new Map<string, PackageRow>();
  if (pkgIds.length) {
    const pkgRes = await supabase.from("packages").select("id,slug,title").in("id", pkgIds);
    const pkgRows = ((pkgRes.data as any[]) ?? []) as any[];
    for (const r of pkgRows) {
      const id = String(r.id);
      if (!id) continue;
      packagesById.set(id, {
        id,
        slug: String(r.slug ?? ""),
        title: r.title ?? null,
      });
    }
  }

  const marqueeDurationSec = Math.max(36, Math.round(courses.length * 6.5));

  return (
    <section className="relative overflow-hidden bg-[#050506] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_620px_at_18%_0%,rgba(255,106,0,0.14),transparent_62%),radial-gradient(1000px_620px_at_86%_10%,rgba(255,255,255,0.05),transparent_60%),radial-gradient(900px_520px_at_55%_70%,rgba(255,255,255,0.05),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <Container>
        <Reveal>
          <div className="max-w-3xl" dir="rtl">
            <div className="flex items-center justify-end gap-3">
              <p className="font-heading text-xs tracking-[0.22em] text-[#B5B5B5]">كورسات مميزة</p>
              <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            </div>
            <h2 className="mt-4 text-right font-heading text-4xl tracking-[0.10em] text-white sm:text-6xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
              اختيارات مميزة
            </h2>
            <p className="mt-4 text-right text-base leading-7 text-white/70 sm:text-lg">
              كورسات مختارة علشان تبدأ صح.
            </p>
          </div>
        </Reveal>

        <CoursesMarquee
          className="relative mt-14 overflow-hidden"
          style={{
            ["--courses-marquee-duration" as any]: `${marqueeDurationSec}s`,
            ["--courses-marquee-gap" as any]: "28px",
          }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-[#050506] to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-[#050506] to-transparent sm:w-24" />

          <div className="courses-marquee-track flex w-max gap-7">
            {courses.concat(courses).map((c, idx) => {
            const pkg = c.featured_package_id ? packagesById.get(c.featured_package_id) ?? null : null;
            const pkgLabel = pkg?.title ?? pkg?.slug ?? "";
            const fallback = uiFallback[c.slug] ?? { emoji: "🔥", imageClassName: "object-center" };
            const cover = typeof c.cover_image_url === "string" ? String(c.cover_image_url).trim() : "";
            const image = cover ? cover : "/kalya.png";
            const title = (c.title_ar ?? c.title_en ?? c.slug).trim();

            const href = pkg?.slug
              ? `/programs/${encodeURIComponent(c.slug)}?pkg=${encodeURIComponent(pkg.slug)}`
              : `/programs/${encodeURIComponent(c.slug)}`;

            return (
              <Link
                key={`${c.id}-${idx}`}
                href={href}
                className="group relative isolate block w-[260px] flex-none aspect-[3/4] overflow-hidden rounded-3xl bg-gradient-to-r from-[#2b0000] via-[#120000] to-[#2b0000] p-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_80px_240px_-170px_rgba(0,0,0,0.96)] transition-transform duration-300 hover:-translate-y-1 sm:w-[280px] lg:w-[320px]"
              >
                <div className="pointer-events-none absolute inset-0 rounded-3xl">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#7a0000]/55 via-[#ff2424]/45 to-[#3a0000]/45 opacity-95" />
                  <div className="absolute inset-0 rounded-3xl opacity-70 bg-[radial-gradient(circle,rgba(255,36,36,0.65)_1px,transparent_1.6px)] [background-size:30px_30px] [mask-image:radial-gradient(80%_70%_at_50%_50%,transparent_48%,black_74%)]" />
                </div>

                <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-black/55 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                  <Image
                    src={image}
                    alt={c.title_en ?? c.slug}
                    fill
                    quality={90}
                    sizes="(min-width: 1024px) 320px, (min-width: 640px) 280px, 260px"
                    priority={idx < courses.length}
                    className={
                      "object-cover contrast-[1.04] saturate-[1.03] brightness-[1.00] transition duration-700 group-hover:scale-[1.08] group-hover:contrast-[1.10] group-hover:saturate-[1.08] " +
                      fallback.imageClassName
                    }
                  />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/78 via-black/22 to-black/0" />
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/10 transition group-hover:ring-[#FFB35A]/20" />

                  <div className="absolute right-4 top-4 flex flex-wrap items-center justify-end gap-2">
                    {pkgLabel ? (
                      <div className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold tracking-[0.10em] text-[#FFE2B8] shadow-[0_0_0_1px_rgba(255,179,90,0.24),0_20px_70px_-50px_rgba(255,106,0,0.85)] backdrop-blur-md">
                        {pkgLabel}
                      </div>
                    ) : null}
                    <div className="rounded-full bg-[#FF6A00]/15 px-3 py-1 text-[11px] font-semibold tracking-[0.10em] text-[#FFB35A] shadow-[0_0_0_1px_rgba(255,106,0,0.22)] backdrop-blur-md">
                      مميز
                    </div>
                    <div className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold tracking-[0.10em] text-[#FFE2B8] shadow-[0_0_0_1px_rgba(255,179,90,0.24),0_20px_70px_-50px_rgba(255,106,0,0.85)] backdrop-blur-md">
                      {fallback.emoji}
                    </div>
                  </div>

                  <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-7" dir="rtl">
                    <div className="rounded-2xl bg-black/45 p-4 shadow-[0_0_0_1px_rgba(255,179,90,0.16),0_40px_140px_-120px_rgba(0,0,0,0.95)] backdrop-blur-md">
                      <h3 className="text-right font-heading text-lg leading-snug tracking-[0.06em] text-[#FFE2B8] sm:text-xl">
                        {title}
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
                          افتح الكورس
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          </div>
        </CoursesMarquee>
      </Container>
    </section>
  );
}
