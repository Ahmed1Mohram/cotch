import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";

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

function normalizeFeatures(features: unknown): string[] {
  if (!features) return [];
  if (Array.isArray(features)) {
    return features.map((x) => String(x)).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof features === "string") {
    const s = features.trim();
    return s ? [s] : [];
  }
  if (typeof features === "object") {
    const obj = features as any;
    if (Array.isArray(obj?.items)) {
      return obj.items.map((x: any) => String(x)).map((s: string) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

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
  // Parse params first, before any other operations
  const p = await Promise.resolve(params as any);
  const rawSlug = typeof p.slug === "string" ? decodeURIComponent(p.slug) : "";
  const normalizedSlug = rawSlug
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "")
    .replace(/\.html$/, "");

  const courseSlug = normalizedSlug;

  // Early validation: reject invalid slugs like "-1" before any processing
  // This must happen BEFORE noStore() and any component imports
  if (!courseSlug || courseSlug === "-1" || courseSlug.trim() === "" || courseSlug.length === 0) {
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

  // Now safe to call noStore() after validation
  noStore();

  const imageFallback: Record<string, string> = {
    football: "object-[78%_58%]",
    volleyball: "object-[70%_52%]",
    basketball: "object-[82%_52%]",
    handball: "object-[72%_52%]",
    injuries: "object-[78%_60%]",
  };

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
    const digest = (e as any)?.digest;
    if (
      typeof digest === "string" &&
      (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND"))
    ) {
      throw e;
    }
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
  if (!courseSlug || courseSlug === "-1" || courseSlug.trim() === "") {
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

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (e) {
    console.error("Error creating Supabase client:", e);
    throw e;
  }

  let user = null;
  try {
    const userRes = await supabase.auth.getUser();
    user = userRes.data?.user ?? null;
  } catch (e) {
    console.error("Error fetching user:", e);
    // Continue without user
  }

  const { data: courseRow, error: courseError } = await supabase
    .from("courses")
    .select("id,slug,title_ar,title_en,description,cover_image_url")
    .eq("slug", courseSlug)
    .maybeSingle();

  if (courseError) {
    console.error("Error fetching course:", courseError);
    // Return error page instead of throwing
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
                  حصل خطأ في تحميل البيانات
                </h1>
                <p className="mt-4 text-right text-base leading-7 text-white/70 sm:text-lg">
                  جرّب تفتح الصفحة تاني بعد شوية.
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

  // Fetch all packages for this course
  let availablePackages: Array<{
    id: string;
    slug: string;
    title: string;
    theme: string;
    sort_order: number;
    subtitle: string | null;
    description: string | null;
    features: unknown;
  }> = [];
  try {
    // Try new structure first (course_id in packages)
    const { data: pkgRows } = await supabase
      .from("packages")
      .select("id,slug,title,theme,sort_order,subtitle,description,features")
      .eq("course_id", course.id)
      .eq("active", true)
      .order("sort_order", { ascending: true });

    // Fallback to old structure (package_courses)
    const { data: pcRows } = await supabase
      .from("package_courses")
      .select("package_id")
      .eq("course_id", course.id);

    const packageIds = Array.from(new Set((pcRows ?? []).map((r: any) => String(r.package_id)).filter(Boolean)));

    let pkgRows2: any[] = [];
    if (packageIds.length > 0) {
      const { data } = await supabase
        .from("packages")
        .select("id,slug,title,theme,sort_order,subtitle,description,features")
        .eq("active", true)
        .in("id", packageIds)
        .order("sort_order", { ascending: true });
      pkgRows2 = (data as any[]) ?? [];
    }

    const byId = new Map<string, any>();
    for (const p of (pkgRows ?? []) as any[]) byId.set(String(p.id), p);
    for (const p of pkgRows2) byId.set(String(p.id), p);

    availablePackages = Array.from(byId.values())
      .map((p: any) => ({
        id: String(p.id),
        slug: String(p.slug),
        title: String(p.title ?? ""),
        theme: String(p.theme ?? "orange"),
        sort_order: Number(p.sort_order ?? 0),
        subtitle: p.subtitle ?? null,
        description: p.description ?? null,
        features: (p as any).features ?? null,
      }))
      .sort((a, b) => {
        const diff = a.sort_order - b.sort_order;
        if (diff !== 0) return diff;
        return a.slug.localeCompare(b.slug);
      });
  } catch (e) {
    console.error("Error fetching packages:", e);
  }

  // Validate selected package
  const pkg: { id: string; slug: string; title: string } | null = pkgSlug
    ? await (async () => {
        try {
          const pRes = await supabase
            .from("packages")
            .select("id,slug,title,course_id")
            .eq("slug", pkgSlug)
            .maybeSingle();

          if (pRes.error || !pRes.data) return null;
          const row = pRes.data as any;
          if (!row?.id) return null;

          // Check if package belongs to this course (new structure)
          const packageCourseId = String((row as any).course_id ?? "");
          if (packageCourseId && packageCourseId === course.id) {
            return {
              id: String(row.id),
              slug: String(row.slug),
              title: String(row.title ?? ""),
            };
          }

          // Fallback: Check old structure (package_courses)
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
        } catch (e) {
          console.error("Error fetching package:", e);
          return null;
        }
      })()
    : null;

  if (!pkg) {
    const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

    const vipFromList = availablePackages.find((p) => {
      const s = norm(p.slug);
      const t = norm(p.theme);
      return t === "vip" || s === "vip" || s.includes("vip");
    });

    const fallbackFromList = availablePackages[availablePackages.length - 1] ?? null;

    let bestSlug = norm(vipFromList?.slug || fallbackFromList?.slug);

    if (!bestSlug) {
      try {
        const vipRes = await supabase
          .from("packages")
          .select("id,slug,course_id,active")
          .eq("slug", "vip")
          .eq("active", true)
          .maybeSingle();

        if (!vipRes.error && vipRes.data) {
          const row = vipRes.data as any;
          const packageCourseId = String((row as any).course_id ?? "");

          let belongs = false;
          if (packageCourseId && packageCourseId === course.id) {
            belongs = true;
          } else {
            const pcRes = await supabase
              .from("package_courses")
              .select("course_id")
              .eq("package_id", String(row.id))
              .eq("course_id", course.id)
              .maybeSingle();
            belongs = Boolean(!pcRes.error && pcRes.data);
          }

          if (belongs) {
            bestSlug = "vip";
          }
        }
      } catch (e) {
        console.error("Error resolving default VIP package", e);
      }
    }

    if (bestSlug) {
      redirect(`/programs/${encodeURIComponent(course.slug)}?pkg=${encodeURIComponent(bestSlug)}`);
    }
  }

  let isAdmin = false;
  if (user) {
    try {
      const adminRes = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
      isAdmin = Boolean(!adminRes.error && adminRes.data);
    } catch (e) {
      console.error("Error checking admin status:", e);
      isAdmin = false;
    }
  }

  let enrollRes: { data: any; error: any } = { data: null, error: null };
  if (user && course && !isAdmin) {
    try {
      enrollRes = await supabase
        .from("enrollments")
        .select("end_at,status,source")
        .eq("course_id", course.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
    } catch (e) {
      console.error("Error fetching enrollment:", e);
      enrollRes = { data: null, error: e };
    }
  }

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
  let cardAccessRes: { data: any; error: any } = { data: null, error: null };
  if (user && course && !isAdmin && !hasCourseAccess) {
    try {
      cardAccessRes = await supabase
        .from("course_age_group_access")
        .select("player_card_id,end_at,status")
        .eq("course_id", course.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("end_at", nowIso);
    } catch (e) {
      console.error("Error fetching card access:", e);
      cardAccessRes = { data: null, error: e };
    }
  }

  const allowedCardIds = (((cardAccessRes as any)?.data ?? []) as any[])
    .map((r: any) => String(r.player_card_id ?? "").trim())
    .filter(Boolean);
  const hasAnyCardAccess = allowedCardIds.length > 0;

  const cardsLocked = !user || (!isAdmin && !hasCourseAccess && !hasAnyCardAccess);

  let profiles: Profile[] = [];
  if (cardsLocked) {
    try {
      // Validate course.id before calling RPC
      if (!course.id || course.id === "-1" || course.id.trim() === "") {
        console.warn("Invalid course.id, skipping RPC call", { courseId: course.id });
        profiles = [];
      } else {
        const previewRes = await supabase.rpc("preview_course_player_cards", {
          p_course_id: course.id,
          p_package_id: pkg ? pkg.id : null,
        });

        if (previewRes.error) {
          console.error("RPC error:", previewRes.error, { courseId: course.id, packageId: pkg?.id });
          profiles = [];
        } else {
          const rawData = previewRes.data ?? [];
          console.log("RPC preview_course_player_cards result:", { 
            courseId: course.id, 
            packageId: pkg?.id, 
            count: rawData.length 
          });
          
          profiles = (rawData as any[])
            .filter((r: any) => r?.id) // Filter out invalid entries
            .map((r: any) => ({
              id: String(r.id ?? ""),
              ageGroupId: String(r.age_group_id ?? ""),
              age: r.age === null || r.age === undefined ? null : Number(r.age),
              heightCm: r.height_cm === null || r.height_cm === undefined ? null : Number(r.height_cm),
              weightKg: r.weight_kg === null || r.weight_kg === undefined ? null : Number(r.weight_kg),
            }));
        }
      }
    } catch (e) {
      console.error("Error loading preview cards:", e, { courseId: course.id, packageId: pkg?.id });
      profiles = [];
    }
  } else {
    try {
      const { data: agRows, error: agError } = await supabase
        .from("age_groups")
        .select("id")
        .eq("course_id", course.id);

      if (agError) {
        console.error("Error fetching age groups:", agError);
        profiles = [];
      } else {
        let agIds = (agRows ?? []).map((r) => String(r.id)).filter(Boolean);

        if (pkg && agIds.length) {
          try {
            const allowRes = await supabase
              .from("package_course_age_groups")
              .select("age_group_id")
              .eq("package_id", pkg.id)
              .eq("course_id", course.id);

            if (!allowRes.error && allowRes.data) {
              const allowed = (allowRes.data as any[])
                .map((r) => String(r.age_group_id ?? ""))
                .filter(Boolean);

              if (allowed.length) {
                const allowSet = new Set(allowed);
                agIds = agIds.filter((id) => allowSet.has(id));
              }
            }
          } catch (e) {
            console.error("Error fetching package age groups:", e);
          }
        }

        if (!isAdmin && !hasCourseAccess && hasAnyCardAccess && allowedCardIds.length > 0) {
          try {
            const { data: pcRows, error: pcError } = await supabase
              .from("player_cards")
              .select("id,age_group_id,age,height_cm,weight_kg")
              .in("id", allowedCardIds)
              .order("sort_order", { ascending: true })
              .order("created_at", { ascending: true })
              .limit(100);

            if (pcError) {
              console.error("Error fetching player cards:", pcError);
              profiles = [];
            } else {
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
            }
          } catch (e) {
            console.error("Error processing player cards:", e);
            profiles = [];
          }
        } else if (agIds.length) {
          try {
            const { data: pcRows, error: pcError } = await supabase
              .from("player_cards")
              .select("id,age_group_id,age,height_cm,weight_kg")
              .in("age_group_id", agIds)
              .order("sort_order", { ascending: true })
              .order("created_at", { ascending: true })
              .limit(100);

            if (pcError) {
              console.error("Error fetching player cards:", pcError);
              profiles = [];
            } else {
              profiles =
                pcRows?.map((r) => ({
                  id: String((r as any).id),
                  ageGroupId: String((r as any).age_group_id),
                  age: r.age === null || r.age === undefined ? null : Number(r.age),
                  heightCm: (r as any).height_cm === null || (r as any).height_cm === undefined ? null : Number((r as any).height_cm),
                  weightKg: (r as any).weight_kg === null || (r as any).weight_kg === undefined ? null : Number((r as any).weight_kg),
                })) ?? [];
            }
          } catch (e) {
            console.error("Error processing player cards:", e);
            profiles = [];
          }
        }
      }
    } catch (e) {
      console.error("Error loading player cards:", e);
      profiles = [];
    }
  }

  const requirePackageSelection = availablePackages.length > 0;
  const showCards = !requirePackageSelection || Boolean(pkg);

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

              {/* Packages Selection */}
              {availablePackages.length > 0 && (
                <div className="mt-8" dir="rtl">
                  <div className="mb-4">
                    <p className="text-right text-sm font-semibold text-white/90">اختر الباقة:</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {availablePackages.map((p) => {
                      const isSelected = pkg?.slug === p.slug;
                      const isVip = p.theme === "vip" || String(p.slug ?? "").toLowerCase().includes("vip");
                      const themeColors: Record<
                        string,
                        {
                          outer: string;
                          inner: string;
                          glow: string;
                          dots: string;
                          title: string;
                          chip: string;
                          chipSelected: string;
                          featureRing: string;
                          featureBg: string;
                          cta: string;
                        }
                      > = {
                        orange: {
                          outer: "from-[#FF6A00]/40 via-[#FF6A00]/30 to-[#FF6A00]/40",
                          inner: "ring-[#FF6A00]/30",
                          glow: "bg-[radial-gradient(680px_420px_at_20%_18%,rgba(255,106,0,0.18),transparent_64%)]",
                          dots:
                            "bg-[radial-gradient(circle,rgba(255,179,90,0.55)_1px,transparent_1.7px)] [background-size:28px_28px] [mask-image:radial-gradient(80%_70%_at_50%_50%,transparent_44%,black_76%)]",
                          title: "text-white",
                          chip: "bg-black/40 text-white/80 ring-white/10",
                          chipSelected: "bg-white/14 text-white ring-white/25",
                          featureRing: "ring-white/10",
                          featureBg: "bg-black/35",
                          cta: "bg-white/6 group-hover:bg-white/10",
                        },
                        blue: {
                          outer: "from-[#3B82F6]/40 via-[#3B82F6]/30 to-[#3B82F6]/40",
                          inner: "ring-[#3B82F6]/30",
                          glow: "bg-[radial-gradient(680px_420px_at_20%_18%,rgba(59,130,246,0.18),transparent_64%)]",
                          dots:
                            "bg-[radial-gradient(circle,rgba(59,130,246,0.55)_1px,transparent_1.7px)] [background-size:28px_28px] [mask-image:radial-gradient(80%_70%_at_50%_50%,transparent_44%,black_76%)]",
                          title: "text-white",
                          chip: "bg-black/40 text-white/80 ring-white/10",
                          chipSelected: "bg-white/14 text-white ring-white/25",
                          featureRing: "ring-white/10",
                          featureBg: "bg-black/35",
                          cta: "bg-white/6 group-hover:bg-white/10",
                        },
                        vip: {
                          outer: "from-[#FFD700]/40 via-[#FFA500]/30 to-[#FFD700]/40",
                          inner: "ring-[#FFD700]/30",
                          glow: "bg-[radial-gradient(720px_460px_at_22%_18%,rgba(255,215,0,0.20),transparent_62%)]",
                          dots:
                            "bg-[radial-gradient(circle,rgba(255,215,0,0.55)_1px,transparent_1.7px)] [background-size:28px_28px] [mask-image:radial-gradient(80%_70%_at_50%_50%,transparent_44%,black_76%)]",
                          title:
                            "text-transparent bg-clip-text bg-gradient-to-l from-[#FFD700] via-[#FFB35A] to-[#FFD700]",
                          chip: "bg-[#FFD700]/12 text-[#FFE2B8] ring-[#FFD700]/20",
                          chipSelected: "bg-[#FFD700]/18 text-[#FFF2CC] ring-[#FFD700]/30",
                          featureRing: "ring-[#FFD700]/18",
                          featureBg: "bg-[#140c00]/55",
                          cta: "bg-[#FFD700]/10 group-hover:bg-[#FFD700]/14",
                        },
                      };
                      const colors = themeColors[isVip ? "vip" : p.theme] ?? themeColors.orange;
                      const feats = normalizeFeatures(p.features).slice(0, 5);

                      return (
                        <Link
                          key={p.id}
                          href={`/programs/${course.slug}?pkg=${encodeURIComponent(p.slug)}`}
                          className={`group relative isolate block overflow-hidden rounded-3xl bg-gradient-to-r p-[2px] transition-transform duration-300 hover:-translate-y-1 ${
                            isSelected ? "ring-2 ring-white/60" : ""
                          } ${colors.outer} shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_50px_160px_-120px_rgba(0,0,0,0.92)]`}
                        >
                          {isSelected ? (
                            <>
                              <div className="pointer-events-none absolute -inset-[40%] opacity-80 blur-3xl">
                                <div className="absolute inset-0 bg-[radial-gradient(720px_520px_at_30%_20%,rgba(255,36,36,0.35),transparent_62%)]" />
                              </div>
                              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-rose-400/80 shadow-[0_0_0_1px_rgba(255,36,36,0.22),0_0_64px_rgba(255,36,36,0.28)]" />
                            </>
                          ) : null}
                          {isSelected ? (
                            <div className="pointer-events-none absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/15 text-white shadow-[0_0_0_1px_rgba(255,36,36,0.35),0_18px_60px_-35px_rgba(255,36,36,0.55)] backdrop-blur-xl">
                              <span className="text-lg font-black leading-none">✓</span>
                            </div>
                          ) : null}
                          <div className="pointer-events-none absolute -inset-[55%] opacity-70 blur-3xl">
                            <div className={`absolute inset-0 ${colors.glow}`} />
                          </div>
                          <div className="pointer-events-none absolute inset-0 opacity-65">
                            <div className={`absolute inset-0 ${colors.dots}`} />
                          </div>

                          <div className="relative overflow-hidden rounded-[22px] bg-black/65 px-7 py-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-2xl">
                            <div className={`pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ${colors.inner}`} />
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(860px_460px_at_18%_12%,rgba(255,255,255,0.08),transparent_66%)]" />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/6 via-transparent to-black/50" />
                            <div className="relative">
                              <div className="flex items-start justify-between gap-3" dir="rtl">
                                <div className="min-w-0">
                                  <h4 className={`text-right font-heading text-3xl tracking-[0.14em] ${colors.title}`}>
                                    {p.title}
                                  </h4>
                                  {p.subtitle ? (
                                    <div className="mt-2 text-right text-sm text-white/70">
                                      {String(p.subtitle)}
                                    </div>
                                  ) : null}
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                  {isVip ? (
                                    <div className="rounded-full bg-[#FFD700]/12 px-3 py-1 text-[11px] font-extrabold tracking-[0.22em] text-[#FFE2B8] shadow-[0_0_0_1px_rgba(255,215,0,0.24),0_18px_60px_-40px_rgba(255,215,0,0.50)] ring-1 ring-inset ring-[#FFD700]/22">
                                      VIP
                                    </div>
                                  ) : null}
                                  {!isSelected ? (
                                    <div
                                      className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.22em] ring-1 ring-inset ${colors.chip}`}
                                    >
                                      اختيار
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              {p.description ? (
                                <p className="mt-4 text-right text-sm leading-7 text-white/75 line-clamp-3">
                                  {String(p.description)}
                                </p>
                              ) : null}

                              <div className={`mt-5 rounded-2xl p-5 ring-1 ring-inset ${colors.featureRing} ${colors.featureBg}`}>
                                <div className="text-right text-xs font-semibold tracking-[0.22em] text-white/85">
                                  مميزات الباقة
                                </div>
                                {feats.length ? (
                                  <ul className="mt-4 space-y-2 text-right text-sm text-white/85">
                                    {feats.map((f) => (
                                      <li key={f} className="flex items-start justify-end gap-2 leading-6">
                                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/55" />
                                        <span className="min-w-0">{f}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="mt-3 text-right text-sm text-white/55">
                                    أضف مميزات للباقة لعرضها هنا
                                  </div>
                                )}
                              </div>

                              <div className="mt-6 flex justify-end">
                                <div className={`inline-flex h-12 items-center justify-center rounded-2xl px-7 text-xs font-extrabold tracking-[0.18em] text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition ${colors.cta}`}>
                                  اختر الباقة
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-end gap-3">
                {user ? (
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
                ) : (
                  <Button
                    href={`/login?next=${encodeURIComponent(pkg ? `/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}` : `/programs/${course.slug}`)}`}
                    size="lg"
                    variant="primary"
                    className="rounded-full normal-case tracking-[0.12em]"
                  >
                    سجل دخول للاشتراك
                  </Button>
                )}
                <Link
                  href="/#programs"
                  className="inline-flex h-14 items-center justify-center rounded-full bg-white/5 px-7 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
                >
                  رجوع للكورسات
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
                  {!showCards ? (
                    <div className="col-span-2 md:col-span-3 lg:col-span-5 rounded-3xl bg-white/5 px-6 py-8 text-right border border-white/10">
                      <div className="text-sm font-heading tracking-[0.12em] text-white/90 mb-2">
                        اختر باقة أولاً
                      </div>
                      <div className="text-xs text-white/60">
                        علشان تظهر كروت الأعمار، اختار الباقة من فوق.
                      </div>
                    </div>
                  ) : cardsLocked ? (
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
                              {user ? (
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
                              ) : (
                                <Link
                                  href={`/login?next=${encodeURIComponent(pkg ? `/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}` : `/programs/${course.slug}`)}`}
                                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#25D366]/90 px-5 text-xs font-extrabold tracking-[0.12em] text-white shadow-[0_14px_60px_-36px_rgba(37,211,102,0.55)] transition hover:bg-[#25D366]"
                                >
                                  سجل دخول للاشتراك
                                </Link>
                              )}
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
                      <div className="col-span-2 md:col-span-3 lg:col-span-5 rounded-3xl bg-white/5 px-6 py-8 text-right border border-white/10">
                        <div className="text-sm font-heading tracking-[0.12em] text-white/90 mb-2">
                          مفيش كروت متاحة دلوقتي
                        </div>
                        <div className="text-xs text-white/60 mb-4">
                          استخدم الكود في الأعلى لتفعيل الكورس أو اشترك في الباقة.
                        </div>
                        {pkg ? (
                          <Link
                            href={`/packages/${encodeURIComponent(pkg.slug)}`}
                            className="inline-flex h-10 items-center justify-center rounded-full bg-white/5 px-5 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
                          >
                            رجوع للباقة
                          </Link>
                        ) : null}
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
