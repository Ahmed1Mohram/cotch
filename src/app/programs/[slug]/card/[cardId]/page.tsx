import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ProgramCardContentViewer } from "@/features/programs/ProgramCardContentViewer";
import { RedeemCourseCodeInline } from "@/features/activation/RedeemCourseCodeInline";

type CourseRow = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
};

type CardRow = {
  id: string;
  age_group_id: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  note: string | null;
};

type AgeGroupRow = {
  id: string;
  course_id: string;
  title: string | null;
};

type MonthRow = {
  id: string;
  title: string | null;
  month_number: number | null;
  sort_order: number;
  created_at: string;
};

type PreviewCardRow = {
  id: string;
  age_group_id: string;
  course_id: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  note: string | null;
  age_group_title: string | null;
};

function normalizeSlug(input: string) {
  return input.trim().toLowerCase().replace(/\/+$/, "").replace(/\.html$/, "");
}

export default async function ProgramCardPage({
  params,
  searchParams,
}: {
  params:
    | { slug: string; cardId: string }
    | Promise<{ slug: string; cardId: string }>;
  searchParams?: { pkg?: string } | Promise<{ pkg?: string }>;
}) {
  const p = await Promise.resolve(params as any);
  const rawSlug = typeof p.slug === "string" ? decodeURIComponent(p.slug) : "";
  const courseSlug = normalizeSlug(rawSlug);
  const cardId = typeof p.cardId === "string" ? decodeURIComponent(p.cardId).trim() : "";

  const sp = await Promise.resolve((searchParams ?? {}) as any);
  const pkgSlug =
    typeof sp?.pkg === "string"
      ? decodeURIComponent(String(sp.pkg))
          .trim()
          .toLowerCase()
          .replace(/\/+$/, "")
          .replace(/\.html$/, "")
      : "";

  if (!courseSlug || !cardId) {
    redirect("/packages");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: courseRow } = await supabase
    .from("courses")
    .select("id,slug,title_ar,title_en")
    .eq("slug", courseSlug)
    .maybeSingle();

  const course: CourseRow | null =
    courseRow && (courseRow as any).slug
      ? {
          id: String((courseRow as any).id),
          slug: String((courseRow as any).slug),
          title_ar: ((courseRow as any).title_ar ?? null) as any,
          title_en: ((courseRow as any).title_en ?? null) as any,
        }
      : null;

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6" dir="rtl">
        <div className="w-full max-w-xl rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
          <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">الكورس غير موجود</div>
          <div className="mt-5">
            <Link href="/packages" className="text-xs text-white/70 hover:text-white transition">
              رجوع للباقات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const courseTitle = course.title_ar ?? course.title_en ?? course.slug;

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

  const enrollRes = user && !isAdmin
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

  const cardAccessRes = user && !isAdmin && !hasCourseAccess
    ? await supabase.rpc("has_active_player_card_access", { p_player_card_id: cardId })
    : { data: null, error: null };

  const hasCardAccess =
    Boolean(user) &&
    !isAdmin &&
    !hasCourseAccess &&
    !cardAccessRes.error &&
    Boolean((cardAccessRes as any).data);

  const hasContentAccess = isAdmin || hasCourseAccess || hasCardAccess;

  if (!hasContentAccess) {
    const previewRes = await supabase.rpc("preview_player_card", { p_card_id: cardId });
    const previewRow = (((previewRes as any)?.data ?? []) as any[])[0] as any;

    const previewCard: PreviewCardRow | null = previewRow?.id
      ? {
          id: String(previewRow.id),
          age_group_id: String(previewRow.age_group_id ?? ""),
          course_id: String(previewRow.course_id ?? ""),
          age: previewRow.age === null || previewRow.age === undefined ? null : Number(previewRow.age),
          height_cm:
            previewRow.height_cm === null || previewRow.height_cm === undefined ? null : Number(previewRow.height_cm),
          weight_kg:
            previewRow.weight_kg === null || previewRow.weight_kg === undefined ? null : Number(previewRow.weight_kg),
          note: previewRow.note ?? null,
          age_group_title: previewRow.age_group_title ?? null,
        }
      : null;

    if (!previewCard || previewCard.course_id !== course.id || !previewCard.age_group_id) {
      return (
        <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6" dir="rtl">
          <div className="w-full max-w-xl rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
            <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">الكارت غير موجود</div>
            <div className="mt-5">
              <Link
                href={pkg ? `/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}` : `/programs/${course.slug}`}
                className="text-xs text-white/70 hover:text-white transition"
              >
                رجوع لصفحة الكورس
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (pkg) {
      const allowRes = await supabase
        .from("package_course_age_groups")
        .select("age_group_id")
        .eq("package_id", pkg.id)
        .eq("course_id", course.id);

      const allowed = ((allowRes.data as any[]) ?? [])
        .map((r) => String(r.age_group_id ?? ""))
        .filter(Boolean);

      if (allowed.length && !allowed.includes(previewCard.age_group_id)) {
        return (
          <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6" dir="rtl">
            <div className="w-full max-w-xl rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
              <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">الكارت غير متاح في الباقة</div>
              <div className="mt-4 text-right text-sm text-white/70">
                الباقة: <span className="text-white/85">{pkg.title}</span>
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Link
                  href={`/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}`}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white/5 px-6 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
                >
                  رجوع للكورس
                </Link>
                <Link
                  href={`/packages/${encodeURIComponent(pkg.slug)}`}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white/5 px-6 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
                >
                  رجوع للباقة
                </Link>
              </div>
            </div>
          </div>
        );
      }
    }

    const monthsRes = await supabase.rpc("preview_months_for_package", {
      p_age_group_id: previewCard.age_group_id,
      p_package_id: pkg ? pkg.id : null,
    });
    const initialMonths: MonthRow[] = (((monthsRes as any)?.data ?? []) as any[]).map((m: any) => ({
      id: String(m.id),
      title: m.title ?? null,
      month_number: m.month_number === null || m.month_number === undefined ? null : Number(m.month_number),
      sort_order: Number(m.sort_order ?? 0),
      created_at: String(m.created_at ?? ""),
    }));

    return (
      <div className="min-h-screen bg-[#0B0B0B] px-6 py-16" dir="rtl">
        <div className="mx-auto w-full max-w-5xl">
          <div className="rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">
                  {course.title_ar ?? course.title_en ?? course.slug}
                </div>
                <div className="mt-2 text-right text-sm text-white/70">فيديوهات الكارت</div>
                <div className="mt-1 text-right text-xs text-white/55">
                  {previewCard.age_group_title ? previewCard.age_group_title : "مجموعة عمر"}
                </div>
              </div>
              <Link
                href={pkg ? `/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}` : `/programs/${course.slug}`}
                className="inline-flex h-11 items-center justify-center rounded-full bg-white/5 px-6 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
              >
                رجوع للكورس
              </Link>
            </div>

            <div className="mt-6 rounded-3xl bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
              <div className="text-right font-heading text-xs tracking-[0.22em] text-white/70">بيانات الكارت</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-black/35 px-4 py-4 text-sm text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                  <span className="text-white/60">الطول:</span> {previewCard.height_cm ?? "—"}
                </div>
                <div className="rounded-2xl bg-black/35 px-4 py-4 text-sm text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                  <span className="text-white/60">الوزن:</span> {previewCard.weight_kg ?? "—"}
                </div>
                <div className="rounded-2xl bg-black/35 px-4 py-4 text-sm text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                  <span className="text-white/60">العمر:</span> {previewCard.age ?? "—"}
                </div>
              </div>
              {previewCard.note ? (
                <div className="mt-4 text-right text-sm text-white/70">{previewCard.note}</div>
              ) : null}
            </div>

            <div className="mt-10">
              <RedeemCourseCodeInline
                initialCourseSlug={course.slug}
                initialCourseTitle={courseTitle}
                pkgSlug={pkg ? pkg.slug : pkgSlug}
              />
            </div>

            <ProgramCardContentViewer
              courseId={course.id}
              courseSlug={course.slug}
              courseTitle={courseTitle}
              pkgSlug={pkg ? pkg.slug : pkgSlug}
              hasCourseAccess={false}
              initialMonths={initialMonths}
            />
          </div>
        </div>
      </div>
    );
  }

  const cardRes = await supabase
    .from("player_cards")
    .select("id,age_group_id,age,height_cm,weight_kg,note")
    .eq("id", cardId)
    .maybeSingle();

  const card: CardRow | null =
    !cardRes.error && cardRes.data
      ? {
          id: String((cardRes.data as any).id),
          age_group_id: String((cardRes.data as any).age_group_id),
          age: (cardRes.data as any).age ?? null,
          height_cm: (cardRes.data as any).height_cm ?? null,
          weight_kg: (cardRes.data as any).weight_kg ?? null,
          note: (cardRes.data as any).note ?? null,
        }
      : null;

  if (!card) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6" dir="rtl">
        <div className="w-full max-w-xl rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
          <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">الكارت غير موجود</div>
          <div className="mt-5">
            <Link
              href={pkg ? `/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}` : `/programs/${course.slug}`}
              className="text-xs text-white/70 hover:text-white transition"
            >
              رجوع لصفحة الكورس
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const agRes = await supabase
    .from("age_groups")
    .select("id,course_id,title")
    .eq("id", card.age_group_id)
    .maybeSingle();

  const ageGroup: AgeGroupRow | null =
    !agRes.error && agRes.data
      ? {
          id: String((agRes.data as any).id),
          course_id: String((agRes.data as any).course_id),
          title: (agRes.data as any).title ?? null,
        }
      : null;

  if (!ageGroup || ageGroup.course_id !== course.id) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6" dir="rtl">
        <div className="w-full max-w-xl rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
          <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">الكارت غير مرتبط بالكورس</div>
          <div className="mt-5">
            <Link
              href={pkg ? `/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}` : `/programs/${course.slug}`}
              className="text-xs text-white/70 hover:text-white transition"
            >
              رجوع لصفحة الكورس
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pkg) {
    const allowRes = await supabase
      .from("package_course_age_groups")
      .select("age_group_id")
      .eq("package_id", pkg.id)
      .eq("course_id", course.id);

    const allowed = ((allowRes.data as any[]) ?? [])
      .map((r) => String(r.age_group_id ?? ""))
      .filter(Boolean);

    if (allowed.length && !allowed.includes(ageGroup.id)) {
      return (
        <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6" dir="rtl">
          <div className="w-full max-w-xl rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
            <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">الكارت غير متاح في الباقة</div>
            <div className="mt-4 text-right text-sm text-white/70">
              الباقة: <span className="text-white/85">{pkg.title}</span>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Link
                href={`/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}`}
                className="inline-flex h-11 items-center justify-center rounded-full bg-white/5 px-6 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
              >
                رجوع للكورس
              </Link>
              <Link
                href={`/packages/${encodeURIComponent(pkg.slug)}`}
                className="inline-flex h-11 items-center justify-center rounded-full bg-white/5 px-6 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
              >
                رجوع للباقة
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  const monthsRes = hasContentAccess
    ? pkg
      ? await (async () => {
          const pkgRes = await supabase
            .from("months")
            .select("id,title,month_number,sort_order,created_at")
            .eq("age_group_id", ageGroup.id)
            .eq("package_id", pkg.id)
            .order("month_number", { ascending: true })
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true });

          if (!pkgRes.error && (pkgRes.data ?? []).length) return pkgRes;

          return supabase
            .from("months")
            .select("id,title,month_number,sort_order,created_at")
            .eq("age_group_id", ageGroup.id)
            .is("package_id", null)
            .order("month_number", { ascending: true })
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true });
        })()
      : await supabase
          .from("months")
          .select("id,title,month_number,sort_order,created_at")
          .eq("age_group_id", ageGroup.id)
          .is("package_id", null)
          .order("month_number", { ascending: true })
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
    : await supabase.rpc("preview_months_for_package", {
        p_age_group_id: ageGroup.id,
        p_package_id: pkg ? pkg.id : null,
      });

  const months: MonthRow[] = (monthsRes.error ? [] : ((monthsRes.data as any) ?? [])).map((m: any) => ({
    id: String(m.id),
    title: m.title ?? null,
    month_number: m.month_number ?? null,
    sort_order: m.sort_order ?? 0,
    created_at: String(m.created_at ?? ""),
  }));

  const filteredMonths = months;

  return (
    <div className="min-h-screen bg-[#0B0B0B] px-6 py-16" dir="rtl">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">
                {course.title_ar ?? course.title_en ?? course.slug}
              </div>
              <div className="mt-2 text-right text-sm text-white/70">
                فيديوهات الكارت
                <span className="mx-2 text-white/35">•</span>
                {ageGroup.title ? ageGroup.title : "مجموعة عمر"}
              </div>
            </div>
            <Link
              href={pkg ? `/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}` : `/programs/${course.slug}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white/5 px-6 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
            >
              رجوع للكورس
            </Link>
          </div>

          <div className="mt-6 rounded-3xl bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
            <div className="text-right font-heading text-xs tracking-[0.22em] text-white/70">بيانات الكارت</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-black/35 px-4 py-4 text-sm text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                <span className="text-white/60">الطول:</span> {card.height_cm ?? "—"}
              </div>
              <div className="rounded-2xl bg-black/35 px-4 py-4 text-sm text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                <span className="text-white/60">الوزن:</span> {card.weight_kg ?? "—"}
              </div>
              <div className="rounded-2xl bg-black/35 px-4 py-4 text-sm text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                <span className="text-white/60">العمر:</span> {card.age ?? "—"}
              </div>
            </div>
            {card.note ? (
              <div className="mt-4 text-right text-sm text-white/70">{card.note}</div>
            ) : null}
          </div>

          <ProgramCardContentViewer
            courseId={course.id}
            courseSlug={course.slug}
            courseTitle={courseTitle}
            pkgSlug={pkg ? pkg.slug : pkgSlug}
            hasCourseAccess={hasContentAccess}
            initialMonths={filteredMonths}
          />
        </div>
      </div>
    </div>
  );
}
