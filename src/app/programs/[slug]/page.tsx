import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { Navbar } from "@/components/sections/Navbar";
import { FooterClean } from "@/components/sections/FooterClean";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { RedeemCourseCodeInline } from "@/features/activation/RedeemCourseCodeInline";

type Profile = {
  id: string;
  ageGroupId: string;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
};

 function isImgTagSrc(src: string) {
   const s = String(src ?? "").trim();
   if (!s) return false;
   return /^(https?:)?\/\//i.test(s) || /^data:/i.test(s) || /^blob:/i.test(s);
 }

export function generateStaticParams() {
  return [];
}

export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
  searchParams?: { pkg?: string } | Promise<{ pkg?: string }>;
}) {
  noStore();
  const p = await Promise.resolve(params as any);
  const rawSlug = typeof p.slug === "string" ? decodeURIComponent(p.slug) : "";
  const normalizedSlug = rawSlug
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "")
    .replace(/\.html$/, "");
  const imageFallback: Record<string, string> = {
    football: "object-[78%_58%]",
    volleyball: "object-[70%_52%]",
    basketball: "object-[82%_52%]",
    handball: "object-[72%_52%]",
    injuries: "object-[78%_60%]",
  };

  const courseSlug = normalizedSlug;

  const sp = await Promise.resolve((searchParams ?? {}) as any);
  const pkgSlug =
    typeof sp?.pkg === "string"
      ? decodeURIComponent(String(sp.pkg))
          .trim()
          .toLowerCase()
          .replace(/\/+$/, "")
          .replace(/\.html$/, "")
      : "";

  // NOTE: This page is server-rendered; load course + cards from DB.
  // eslint-disable-next-line @typescript-eslint/no-floating-promises

  try {
    return await ProgramPageInner({ rawSlug, courseSlug, pkgSlug, imageFallback });
  } catch (e) {
    console.error("ProgramPage error", { rawSlug, courseSlug, pkgSlug, error: e });
    return (
      <div className="min-h-screen bg-[#0B0B0B]">
        <Navbar />
        <main className="pt-44 sm:pt-48 md:pt-56">
          <section className="relative overflow-hidden bg-[#050506] py-20 sm:py-28">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_620px_at_20%_0%,rgba(255,255,255,0.10),transparent_62%),radial-gradient(1000px_620px_at_85%_10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(900px_520px_at_50%_65%,rgba(255,255,255,0.06),transparent_68%)]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
            <Container>
              <div className="mx-auto max-w-2xl" dir="rtl">
                <h1 className="text-right font-heading text-3xl tracking-[0.10em] text-white sm:text-5xl">
                  حصل خطأ مؤقت
                </h1>
                <p className="mt-4 text-right text-sm text-white/70">
                  جرّب تفتح الصفحة تاني بعد شوية.
                </p>
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <Link
                    href={pkgSlug ? `/packages/${encodeURIComponent(pkgSlug)}` : "/packages"}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white/5 px-5 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
                  >
                    الباقات
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
}

async function ProgramPageInner({
  rawSlug,
  courseSlug,
  pkgSlug,
  imageFallback,
}: {
  rawSlug: string;
  courseSlug: string;
  pkgSlug: string;
  imageFallback: Record<string, string>;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: courseRow } = await supabase
    .from("courses")
    .select("id,slug,title_ar,title_en,description,cover_image_url")
    .eq("slug", courseSlug)
    .maybeSingle();

  const course =
    courseRow && courseRow.slug
      ? {
          id: String(courseRow.id),
          slug: String(courseRow.slug),
          title: String((courseRow as any).title_ar ?? (courseRow as any).title_en ?? courseSlug),
          titleEn: String((courseRow as any).title_en ?? "").trim(),
          desc: String(courseRow.description ?? ""),
          image: (() => {
            const raw = String(courseRow.cover_image_url ?? "").trim();
            const resolved = raw ? raw : "/kalya.png";
            if (!resolved) return "/kalya.png";
            if (isImgTagSrc(resolved)) return resolved;
            if (resolved.startsWith("/")) return resolved;
            return `/${resolved}`;
          })(),
          imageClassName: imageFallback[String(courseRow.slug)] ?? "object-center",
        }
      : null;

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0B0B0B]">
        <Navbar />
        <main className="pt-44 sm:pt-48 md:pt-56">
          <section className="relative overflow-hidden bg-[#050506] py-20 sm:py-28">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_620px_at_20%_0%,rgba(255,255,255,0.10),transparent_62%),radial-gradient(1000px_620px_at_85%_10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(900px_520px_at_50%_65%,rgba(255,255,255,0.06),transparent_68%)]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
            <Container>
              <div className="mx-auto max-w-3xl" dir="rtl">
                <h1 className="text-right font-heading text-4xl tracking-[0.10em] text-white sm:text-6xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
                  الكورس غير موجود
                </h1>
                <p className="mt-4 text-right text-base leading-7 text-white/70 sm:text-lg">
                  الرابط اللي فتحته: <span className="text-white/90">{rawSlug || "(فارغ)"}</span>
                </p>
                <p className="mt-3 text-right text-sm text-white/65">
                  افتح الباقات واختر الكورس من داخل الباقة.
                </p>
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <Link
                    href="/packages"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white/5 px-5 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
                  >
                    الباقات
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

  const pkg: { id: string; slug: string; title: string } | null = pkgSlug
    ? await (async () => {
        const pRes = await supabase
          .from("packages")
          .select("id,slug,title")
          .eq("slug", pkgSlug)
          .maybeSingle();

        const row = (!pRes.error && pRes.data ? (pRes.data as any) : null) as any;
        if (!row?.id) return null;

        const pcRes = await supabase
          .from("package_courses")
          .select("course_id")
          .eq("package_id", String(row.id))
          .eq("course_id", course.id)
          .maybeSingle();

        if (pcRes.error || !pcRes.data) return null;

        return {
          id: String(row.id),
          slug: String(row.slug),
          title: String(row.title ?? ""),
        };
      })()
    : null;

  const adminRes = user
    ? await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle()
    : { data: null, error: null };
  const isAdmin = Boolean(user && !adminRes.error && adminRes.data);

  const enrollRes = user && course && !isAdmin
    ? await supabase
        .from("enrollments")
        .select("end_at,status,source")
        .eq("course_id", course.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null, error: null };

  const now = Date.parse(new Date().toISOString());
  const endAtMs = (enrollRes as any)?.data?.end_at ? new Date(String((enrollRes as any).data.end_at)).getTime() : NaN;
  const enrollSource = String((enrollRes as any)?.data?.source ?? "").trim();
  const hasCourseAccess =
    isAdmin ||
    (Boolean(user) &&
      !isAdmin &&
      !enrollRes.error &&
      Boolean((enrollRes as any).data) &&
      (!Number.isFinite(endAtMs) || endAtMs > now) &&
      (enrollSource === "code" || enrollSource === "manual" || enrollSource === "admin"));

  const nowIso = new Date().toISOString();
  const cardAccessRes = user && course && !isAdmin && !hasCourseAccess
    ? await supabase
        .from("course_age_group_access")
        .select("player_card_id,end_at,status")
        .eq("course_id", course.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("end_at", nowIso)
    : { data: null, error: null };

  const allowedCardIds = (((cardAccessRes as any)?.data ?? []) as any[])
    .map((r: any) => String(r.player_card_id ?? "").trim())
    .filter(Boolean);
  const hasAnyCardAccess = allowedCardIds.length > 0;

  const cardsLocked = !user || (!isAdmin && !hasCourseAccess && !hasAnyCardAccess);

  let profiles: Profile[] = [];
  if (cardsLocked) {
    const previewRes = await supabase.rpc("preview_course_player_cards", {
      p_course_id: course.id,
      p_package_id: pkg ? pkg.id : null,
    });

    profiles = ((previewRes as any)?.data ?? []).map((r: any) => ({
      id: String(r.id),
      ageGroupId: String(r.age_group_id),
      age: r.age === null || r.age === undefined ? null : Number(r.age),
      heightCm: r.height_cm === null || r.height_cm === undefined ? null : Number(r.height_cm),
      weightKg: r.weight_kg === null || r.weight_kg === undefined ? null : Number(r.weight_kg),
    }));
  } else {
    const { data: agRows } = await supabase
      .from("age_groups")
      .select("id")
      .eq("course_id", course.id);
    let agIds = (agRows ?? []).map((r) => String(r.id)).filter(Boolean);

    if (pkg && agIds.length) {
      const allowRes = await supabase
        .from("package_course_age_groups")
        .select("age_group_id")
        .eq("package_id", pkg.id)
        .eq("course_id", course.id);

      const allowed = ((allowRes.data as any[]) ?? [])
        .map((r) => String(r.age_group_id ?? ""))
        .filter(Boolean);

      if (allowed.length) {
        const allowSet = new Set(allowed);
        agIds = agIds.filter((id) => allowSet.has(id));
      }
    }

    if (!isAdmin && !hasCourseAccess && hasAnyCardAccess) {
      const { data: pcRows } = await supabase
        .from("player_cards")
        .select("id,age_group_id,age,height_cm,weight_kg")
        .in("id", allowedCardIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(100);

      const agSet = new Set(agIds);
      profiles =
        (pcRows ?? [])
          .filter((r: any) => (agSet.size ? agSet.has(String((r as any).age_group_id)) : true))
          .map((r: any) => ({
            id: String(r.id),
            ageGroupId: String(r.age_group_id),
            age: r.age === null || r.age === undefined ? null : Number(r.age),
            heightCm: r.height_cm === null || r.height_cm === undefined ? null : Number(r.height_cm),
            weightKg: r.weight_kg === null || r.weight_kg === undefined ? null : Number(r.weight_kg),
          })) ?? [];
    } else if (agIds.length) {
      const { data: pcRows } = await supabase
        .from("player_cards")
        .select("id,age_group_id,age,height_cm,weight_kg")
        .in("age_group_id", agIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(100);

      profiles =
        pcRows?.map((r) => ({
          id: String((r as any).id),
          ageGroupId: String((r as any).age_group_id),
          age: r.age === null || r.age === undefined ? null : Number(r.age),
          heightCm: (r as any).height_cm === null || (r as any).height_cm === undefined ? null : Number((r as any).height_cm),
          weightKg: (r as any).weight_kg === null || (r as any).weight_kg === undefined ? null : Number((r as any).weight_kg),
        })) ?? [];
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <Navbar />
      <main className="pt-44 sm:pt-48 md:pt-56">
        <section className="relative overflow-hidden bg-[#050506] py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_620px_at_20%_0%,rgba(255,255,255,0.10),transparent_62%),radial-gradient(1000px_620px_at_85%_10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(900px_520px_at_50%_65%,rgba(255,255,255,0.06),transparent_68%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <Container>
            <div className="max-w-4xl" dir="rtl">
              <div className="flex items-center justify-end gap-3">
                <p className="font-heading text-xs tracking-[0.22em] text-[#B5B5B5]">تفاصيل الكورس</p>
                <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              </div>

              <h1 className="mt-4 text-right font-heading text-4xl tracking-[0.10em] text-white sm:text-6xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
                {course.title}
              </h1>
              {course.titleEn ? (
                <div className="mt-2 text-right text-sm text-white/70" dir="ltr">
                  {course.titleEn}
                </div>
              ) : null}
              <p className="mt-4 text-right text-base leading-7 text-white/70 sm:text-lg">{course.desc}</p>

              <div className="mt-8 flex flex-wrap justify-end gap-3">
                <Button
                  href={
                    pkg
                      ? `/?chat=1&pkg=${encodeURIComponent(pkg.slug)}&course=${encodeURIComponent(course.slug)}#contact`
                      : "/?chat=1#contact"
                  }
                  size="lg"
                  variant="primary"
                  className="rounded-full normal-case tracking-[0.12em]"
                >
                  احجز مكانك
                </Button>
                <Link
                  href={pkg ? `/packages/${encodeURIComponent(pkg.slug)}` : "/#programs"}
                  className="inline-flex h-14 items-center justify-center rounded-full bg-white/5 px-7 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
                >
                  {pkg ? "رجوع للباقة" : "رجوع للكورسات"}
                </Link>
              </div>
            </div>

            <div className="mt-12" dir="rtl">
              <div className="relative isolate aspect-[16/9] overflow-hidden rounded-3xl bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_70px_210px_-160px_rgba(0,0,0,0.95)] sm:aspect-[16/7]">
                {isImgTagSrc(course.image) ? (
                  <img
                    src={course.image}
                    alt={course.title}
                    loading="lazy"
                    className={
                      "absolute inset-0 h-full w-full object-cover contrast-[1.08] saturate-[1.10] brightness-[1.02] " +
                      course.imageClassName
                    }
                  />
                ) : (
                  <Image
                    src={course.image}
                    alt={course.title}
                    fill
                    sizes="100vw"
                    className={
                      "object-cover contrast-[1.08] saturate-[1.10] brightness-[1.02] " +
                      course.imageClassName
                    }
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/88 via-black/40 to-black/0" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
              </div>

              <div className="mt-10">
                <div className="font-heading text-xs tracking-[0.22em] text-white/70">كروت (طول / وزن / عمر)</div>
                <div className="mt-5 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  <div className="col-span-2 md:col-span-3 lg:col-span-5">
                    <RedeemCourseCodeInline
                      initialCourseSlug={course.slug}
                      initialCourseTitle={course.title}
                      pkgSlug={pkg ? pkg.slug : pkgSlug}
                    />
                  </div>
                  {cardsLocked ? (
                    profiles.length ? (
                      profiles.map((p, i) => (
                        <div
                          key={p.id}
                          className="group relative isolate block aspect-[4/5] overflow-hidden rounded-3xl bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_46px_150px_-120px_rgba(0,0,0,0.95)]"
                          aria-label={`الكارت رقم ${i + 1} (مقفول)`}
                        >
                          {isImgTagSrc(course.image) ? (
                            <img
                              src={course.image}
                              alt={course.title}
                              loading="lazy"
                              className={
                                "absolute inset-0 h-full w-full object-cover contrast-[1.08] saturate-[1.08] brightness-[1.00] " +
                                course.imageClassName
                              }
                            />
                          ) : (
                            <Image
                              src={course.image}
                              alt={course.title}
                              fill
                              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                              className={
                                "object-cover contrast-[1.08] saturate-[1.08] brightness-[1.00] " +
                                course.imageClassName
                              }
                            />
                          )}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/42 to-black/0" />
                          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />

                          <div className="absolute inset-0 flex flex-col justify-end p-5" dir="rtl">
                            <div className="font-heading text-[11px] tracking-[0.22em] text-white/70">كارت رقم {i + 1}</div>
                            <div className="mt-2 font-heading text-2xl tracking-[0.10em] text-white drop-shadow-[0_14px_34px_rgba(0,0,0,0.95)]">
                              طول {p.heightCm ?? "—"}
                              <span className="ms-1 text-sm text-white/70">سم</span>
                            </div>
                            <div className="mt-1 font-heading text-2xl tracking-[0.10em] text-white drop-shadow-[0_14px_34px_rgba(0,0,0,0.95)]">
                              وزن {p.weightKg ?? "—"}
                              <span className="ms-1 text-sm text-white/70">كجم</span>
                            </div>
                            <div className="mt-2 text-sm text-white/75">عمر {p.age ?? "—"} سنة</div>
                            <div className="mt-4 flex flex-wrap justify-end gap-3">
                              <Link
                                href={
                                  pkg
                                    ? `/?chat=1&pkg=${encodeURIComponent(pkg.slug)}&course=${encodeURIComponent(course.slug)}#contact`
                                    : "/?chat=1#contact"
                                }
                                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#25D366]/90 px-5 text-xs font-extrabold tracking-[0.12em] text-white shadow-[0_14px_60px_-36px_rgba(37,211,102,0.55)] transition hover:bg-[#25D366]"
                              >
                                اشترك
                              </Link>
                              <Link
                                href={
                                  pkg
                                    ? `/programs/${course.slug}/card/${p.id}?pkg=${encodeURIComponent(pkg.slug)}`
                                    : `/programs/${course.slug}/card/${p.id}`
                                }
                                className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/5 px-5 text-xs font-extrabold tracking-[0.12em] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10"
                              >
                                افتح التفاصيل
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 md:col-span-3 lg:col-span-5 rounded-3xl bg-white/5 px-6 py-6 text-right text-sm text-white/70 border border-white/10">
                        مفيش كروت متاحة دلوقتي.
                      </div>
                    )
                  ) : (
                    profiles.map((p, i) => (
                        <Link
                          key={p.id}
                          href={
                            pkg
                              ? `/programs/${course.slug}/card/${p.id}?pkg=${encodeURIComponent(pkg.slug)}`
                              : `/programs/${course.slug}/card/${p.id}`
                          }
                          aria-label={`فتح فيديوهات الكارت رقم ${i + 1}`}
                          className="group relative isolate block aspect-[4/5] overflow-hidden rounded-3xl bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_46px_150px_-120px_rgba(0,0,0,0.95)] transition-transform duration-300 hover:-translate-y-0.5"
                        >
                          {isImgTagSrc(course.image) ? (
                            <img
                              src={course.image}
                              alt={course.title}
                              loading="lazy"
                              className={
                                "absolute inset-0 h-full w-full object-cover contrast-[1.08] saturate-[1.08] brightness-[1.00] transition duration-700 group-hover:scale-[1.06] group-hover:contrast-[1.25] group-hover:saturate-[1.25] " +
                                course.imageClassName
                              }
                            />
                          ) : (
                            <Image
                              src={course.image}
                              alt={course.title}
                              fill
                              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                              className={
                                "object-cover contrast-[1.08] saturate-[1.08] brightness-[1.00] transition duration-700 group-hover:scale-[1.06] group-hover:contrast-[1.25] group-hover:saturate-[1.25] " +
                                course.imageClassName
                              }
                            />
                          )}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/42 to-black/0" />
                          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 transition group-hover:ring-white/25" />

                          <div className="absolute inset-0 flex flex-col justify-end p-5" dir="rtl">
                            <div className="font-heading text-[11px] tracking-[0.22em] text-white/70">كارت رقم {i + 1}</div>
                            <div className="mt-2 font-heading text-2xl tracking-[0.10em] text-white drop-shadow-[0_14px_34px_rgba(0,0,0,0.95)]">
                              طول {p.heightCm ?? "—"}
                              <span className="ms-1 text-sm text-white/70">سم</span>
                            </div>
                            <div className="mt-1 font-heading text-2xl tracking-[0.10em] text-white drop-shadow-[0_14px_34px_rgba(0,0,0,0.95)]">
                              وزن {p.weightKg ?? "—"}
                              <span className="ms-1 text-sm text-white/70">كجم</span>
                            </div>
                            <div className="mt-2 text-sm text-white/75">عمر {p.age ?? "—"} سنة</div>
                            <div className="mt-4 inline-flex items-center justify-end text-xs font-semibold tracking-[0.18em] text-[#FFB35A]">
                              افتح الفيديوهات
                            </div>
                          </div>
                        </Link>
                      ))
                  )}
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <FooterClean />
    </div>
  );
}
