import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

const uiFallback: Record<string, { emoji: string; imageClassName: string }> = {
  football: { emoji: "⚽", imageClassName: "object-[78%_58%]" },
  volleyball: { emoji: "🏐", imageClassName: "object-[70%_52%]" },
  basketball: { emoji: "🏀", imageClassName: "object-[82%_52%]" },
  handball: { emoji: "🤾‍♂️", imageClassName: "object-[72%_52%]" },
  injuries: { emoji: "🩹", imageClassName: "object-[78%_60%]" },
};

export async function Programs() {
  const supabase = await createSupabaseServerClient();
  
  // Fetch all published courses
  const { data: activePackageRows } = await supabase
    .from("packages")
    .select("id,slug,title,theme,sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const activePackages = ((activePackageRows as any[]) ?? [])
    .map((r) => ({
      id: String(r.id ?? "").trim(),
      slug: String(r.slug ?? "").trim(),
      title: String(r.title ?? ""),
      theme: String((r as any).theme ?? "orange"),
      sort_order: Number((r as any).sort_order ?? 0),
    }))
    .filter((p) => Boolean(p.id) && Boolean(p.slug));

  const activePackageIds = activePackages.map((p) => p.id);

  const { data: pcRows } = activePackageIds.length
    ? await supabase
        .from("package_courses")
        .select("package_id,course_id,sort_order")
        .in("package_id", activePackageIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  const courseIds = Array.from(
    new Set(
      ((pcRows as any[]) ?? [])
        .map((r) => String((r as any).course_id ?? "").trim())
        .filter(Boolean),
    ),
  );

  const { data: courseRows, error: courseError } = courseIds.length
    ? await supabase
        .from("courses")
        .select("id,slug,title_ar,title_en,description,cover_image_url")
        .in("id", courseIds)
        .eq("is_published", true)
        .order("created_at", { ascending: true })
    : { data: [], error: null };
  
  // Fetch packages for each course (using course_id if available, otherwise fallback to package_courses)
  let packagesByCourseId = new Map<string, Array<{ id: string; slug: string; title: string; theme: string }>>();

  if (courseIds.length > 0) {
    const pkgById = new Map(activePackages.map((p) => [p.id, p] as const));

    for (const pc of ((pcRows as any[]) ?? [])) {
      const courseId = String((pc as any).course_id ?? "").trim();
      const packageId = String((pc as any).package_id ?? "").trim();
      if (!courseId || !packageId) continue;
      const pkg = pkgById.get(packageId);
      if (!pkg) continue;

      const existing = packagesByCourseId.get(courseId) ?? [];
      existing.push({
        id: pkg.id,
        slug: pkg.slug,
        title: pkg.title,
        theme: pkg.theme,
      });
      packagesByCourseId.set(courseId, existing);
    }
  }

  const courses =
    (courseRows ?? []).map((r) => {
      const slug = String(r.slug);
      const courseId = String(r.id);
      const fallback = uiFallback[slug] ?? { emoji: "🔥", imageClassName: "object-center" };
      const cover = typeof (r as any).cover_image_url === "string" ? String((r as any).cover_image_url).trim() : "";
      const packages = packagesByCourseId.get(courseId) ?? [];
      return {
        slug,
        courseId,
        emoji: fallback.emoji,
        titleEn: String(r.title_en ?? slug).replace(/\s+/g, " ").trim(),
        titleAr: String(r.title_ar ?? ""),
        desc: String(r.description ?? ""),
        image: cover ? cover : "/kalya.png",
        imageClassName: fallback.imageClassName,
        packages,
      };
    }) ?? [];

  const isEmpty = courses.length === 0;

  return (
    <section id="programs" className="relative overflow-hidden bg-[#050506] py-20 sm:py-28 cv-auto">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/111.png)" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-black/75" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_620px_at_18%_0%,rgba(255,106,0,0.18),transparent_62%),radial-gradient(1000px_620px_at_86%_10%,rgba(255,36,36,0.12),transparent_60%),radial-gradient(900px_520px_at_55%_70%,rgba(255,255,255,0.05),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <Container>
        <Reveal>
          <div className="max-w-3xl" dir="rtl">
            <div className="flex items-center justify-end gap-3">
              <p className="font-heading text-xs tracking-[0.22em] text-[#B5B5B5]">
                الكورسات
              </p>
              <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            </div>
            <h2 className="mt-4 text-right font-heading text-4xl tracking-[0.10em] text-white sm:text-6xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
              كورسات رياضية قوية تبني جسمك وتطوّر أدائك
            </h2>
            <p className="mt-4 text-right text-base leading-7 text-white/70 sm:text-lg">
              اختار الكورس المناسب ليك، وابدأ تدريب عملي بخطة واضحة ونتيجة تشوفها.
            </p>
          </div>
        </Reveal>

        <div className="mt-14">
          {isEmpty ? (
            <div className="rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]" dir="rtl">
              <h3 className="text-right font-heading text-2xl tracking-[0.10em] text-white">
                الكورسات مش ظاهرة حالياً
              </h3>
              <p className="mt-3 text-right text-sm leading-7 text-white/75">
                تأكد إن الباقات <span dir="ltr" className="font-mono text-white/90">active = true</span> وربطت الباقات بالكورسات في
                <span dir="ltr" className="font-mono text-white/90">package_courses</span>، وكمان الكورسات منشورة
                <span dir="ltr" className="font-mono text-white/90">is_published = true</span>.
              </p>
              {process.env.NODE_ENV !== "production" && courseError?.message ? (
                <p className="mt-4 text-right text-xs leading-6 text-white/60" dir="ltr">
                  {courseError.message}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-12">
              {courses.map((c, idx) => (
                <Reveal key={c.slug} delay={0.06 * idx}>
                  <div className="rounded-3xl bg-black/45 p-6 sm:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]" dir="rtl">
                    {/* Course Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.emoji}</span>
                        <div>
                          <h3 className="text-right font-heading text-2xl tracking-[0.06em] text-white sm:text-3xl">
                            <span dir="ltr" className="uppercase">{c.titleEn}</span>
                            {c.titleAr && (
                              <span className="block text-base sm:text-lg font-semibold tracking-[0.08em] text-[#FFB35A] mt-1">
                                ({c.titleAr})
                              </span>
                            )}
                          </h3>
                          {c.desc && (
                            <p className="mt-2 text-right text-sm text-white/70 line-clamp-2">
                              {c.desc}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/programs/${c.slug}`}
                        className="inline-flex h-10 items-center justify-center rounded-2xl bg-white/5 px-5 text-xs font-semibold tracking-[0.12em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white shrink-0"
                      >
                        عرض الكورس
                      </Link>
                    </div>

                    {/* Packages */}
                    {c.packages.length > 0 ? (
                      <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory", overscrollBehaviorX: "contain", touchAction: "pan-x" }}>
                        <div className="flex gap-4 snap-x snap-mandatory scroll-px-5 sm:grid sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {c.packages.map((pkg) => {
                            const themeColors: Record<string, { outer: string; inner: string }> = {
                              orange: {
                                outer: "from-[#FF6A00]/40 via-[#FF6A00]/30 to-[#FF6A00]/40",
                                inner: "ring-[#FF6A00]/30",
                              },
                              blue: {
                                outer: "from-[#3B82F6]/40 via-[#3B82F6]/30 to-[#3B82F6]/40",
                                inner: "ring-[#3B82F6]/30",
                              },
                              vip: {
                                outer: "from-[#FFD700]/40 via-[#FFA500]/30 to-[#FFD700]/40",
                                inner: "ring-[#FFD700]/30",
                              },
                            };
                            const colors = themeColors[pkg.theme] ?? themeColors.orange;
                            
                            return (
                              <Link
                                key={pkg.id}
                                href={`/programs/${c.slug}?pkg=${encodeURIComponent(pkg.slug)}`}
                                className={`group relative isolate block w-[86vw] max-w-[280px] flex-none snap-start overflow-hidden rounded-2xl bg-gradient-to-r p-[2px] transition-transform duration-300 hover:-translate-y-1 sm:w-auto sm:max-w-none ${colors.outer}`}
                              >
                                <div className="relative overflow-hidden rounded-[18px] bg-black/60 px-5 py-5 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-2xl">
                                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(740px_380px_at_20%_24%,rgba(255,255,255,0.08),transparent_64%)]" />
                                  <div className={`pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ${colors.inner}`} />
                                  <div className="relative">
                                    <h4 className="text-right font-heading text-lg tracking-[0.06em] text-white mb-2">
                                      {pkg.title}
                                    </h4>
                                    <div className="mt-3 flex justify-end">
                                      <div className="inline-flex h-9 items-center justify-center rounded-xl bg-white/5 px-4 text-xs font-semibold tracking-[0.10em] text-white/85 transition group-hover:bg-white/10">
                                        اختيار الباقة
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-black/30 px-5 py-4 text-center text-sm text-white/60">
                        لا توجد باقات متاحة لهذا الكورس حالياً
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>

        <Reveal delay={0.08}>
          <div className="mt-14 relative overflow-hidden rounded-3xl p-[2px]">
            <div className="pointer-events-none absolute -inset-[45%] hidden opacity-70 blur-3xl bg-[conic-gradient(from_180deg_at_50%_50%,#FFB35A,#FF6A00,#FF2424,#FFB35A)] sm:block animate-[spin_10s_linear_infinite]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#FF6A00]/25 via-white/10 to-[#FF2424]/25" />
            <div className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(900px_520px_at_14%_30%,rgba(255,106,0,0.24),transparent_60%),radial-gradient(860px_520px_at_86%_36%,rgba(255,36,36,0.20),transparent_62%),radial-gradient(840px_520px_at_56%_82%,rgba(255,179,90,0.14),transparent_70%)]" />

            <div className="relative overflow-hidden rounded-3xl bg-[#060607]/86 px-7 py-12 shadow-[0_0_0_1px_rgba(255,179,90,0.18),0_50px_160px_-110px_rgba(0,0,0,0.92)] sm:px-12">
              <div className="pointer-events-none absolute inset-0 opacity-10">
                <Image src="/lava-cracks.svg" alt="" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_520px_at_14%_24%,rgba(255,255,255,0.10),transparent_62%),radial-gradient(920px_520px_at_86%_34%,rgba(255,255,255,0.08),transparent_64%),radial-gradient(900px_520px_at_55%_70%,rgba(255,255,255,0.06),transparent_72%)]" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/40" />
              <div className="pointer-events-none absolute inset-0 hidden opacity-70 sm:block animate-pulse bg-[radial-gradient(520px_220px_at_50%_92%,rgba(255,106,0,0.18),transparent_72%)]" />
              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-[#FFB35A]/25" />

              <div className="relative" dir="rtl">
                <h3 className="text-right font-heading text-4xl tracking-[0.10em] text-transparent bg-clip-text bg-gradient-to-l from-[#FFB35A] via-[#FF6A00] to-[#FF2424] sm:text-5xl drop-shadow-[0_18px_55px_rgba(0,0,0,0.96)]">
                  أنا مدرب بدني… شغل علمي ونتيجة واضحة
                </h3>
                <p className="mt-5 text-right max-w-3xl text-base leading-7 text-white/85 sm:text-lg drop-shadow-[0_16px_45px_rgba(0,0,0,0.96)]">
                  تدريبي مش كلام حماس وخلاص. هتدخل بخطة، هتمشي على نظام، وهتطلع بنسخة أقوى منك. قوة، لياقة، مرونة، وتحكم في جسمك… وكل ده بتدرّج محسوب وقياسات حقيقية.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <div className="relative group">
                    <Button
                      href="#contact"
                      size="lg"
                      variant="primary"
                      className="relative overflow-hidden rounded-full normal-case tracking-[0.12em] text-white shadow-[0_0_0_1px_rgba(255,179,90,0.28),0_34px_130px_-78px_rgba(255,36,36,0.58)] hover:shadow-[0_0_0_1px_rgba(255,179,90,0.34),0_46px_170px_-92px_rgba(255,106,0,0.72)]"
                    >
                      تواصل وابدأ الآن
                    </Button>
                    <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/15" />
                    <span className="pointer-events-none absolute -inset-y-10 -left-16 w-16 rotate-12 bg-white/20 blur-md opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:translate-x-[420px]" />
                    <span className="pointer-events-none absolute -inset-10 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100 bg-[radial-gradient(340px_180px_at_55%_55%,rgba(255,36,36,0.22),transparent_70%)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
