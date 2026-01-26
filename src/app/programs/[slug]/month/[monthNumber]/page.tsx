import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

import { ProgramMonthViewer } from "@/features/programs/ProgramMonthViewer";

type AgeGroupRow = {
  id: string;
  sort_order: number;
  created_at: string;
};

type MonthRow = {
  id: string;
  age_group_id: string;
  title: string | null;
  month_number: number | null;
  sort_order: number;
  created_at: string;
};

type DayRow = {
  id: string;
  month_id: string;
  title: string | null;
  day_number: number | null;
  sort_order: number;
  created_at: string;
};

type VideoRow = {
  id: string;
  day_id: string;
  title: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  details: string | null;
  duration_sec: number | null;
  is_free_preview: boolean;
  sort_order: number;
  created_at: string;
};

type PreviewScheduleRow = {
  day_id: string;
  day_month_id: string;
  day_title: string | null;
  day_number: number | null;
  day_sort_order: number | null;
  day_created_at: string;
  video_id: string | null;
  video_day_id: string | null;
  video_title: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  details: string | null;
  duration_sec: number | null;
  is_free_preview: boolean | null;
  video_sort_order: number | null;
  video_created_at: string | null;
};

function normalizeSlug(input: string) {
  return input.trim().toLowerCase().replace(/\/+$/, "").replace(/\.html$/, "");
}

export default async function ProgramMonthPage({
  params,
  searchParams,
}: {
  params: { slug: string; monthNumber: string } | Promise<{ slug: string; monthNumber: string }>;
  searchParams?: { ag?: string; pkg?: string } | Promise<{ ag?: string; pkg?: string }>;
}) {
  const p = await Promise.resolve(params as any);
  const rawSlug = typeof p.slug === "string" ? decodeURIComponent(p.slug) : "";
  const courseSlug = normalizeSlug(rawSlug);

  const sp = await Promise.resolve((searchParams ?? {}) as any);
  const requestedAgeGroupId = typeof sp?.ag === "string" ? String(sp.ag).trim() : "";
  const pkgSlug =
    typeof sp?.pkg === "string"
      ? decodeURIComponent(String(sp.pkg))
          .trim()
          .toLowerCase()
          .replace(/\/+$/, "")
          .replace(/\.html$/, "")
      : "";

  const monthNumber = Number(p.monthNumber);
  if (!Number.isFinite(monthNumber) || monthNumber <= 0) {
    redirect(pkgSlug ? `/programs/${courseSlug}?pkg=${encodeURIComponent(pkgSlug)}` : `/programs/${courseSlug}`);
  }

  if (!requestedAgeGroupId) {
    redirect(pkgSlug ? `/programs/${courseSlug}?pkg=${encodeURIComponent(pkgSlug)}` : `/programs/${courseSlug}`);
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

  const course =
    courseRow && courseRow.slug
      ? {
          id: String((courseRow as any).id),
          slug: String((courseRow as any).slug),
          title: String((courseRow as any).title_ar ?? (courseRow as any).title_en ?? courseSlug),
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

  const subscribeHref = `/?chat=1&course=${encodeURIComponent(course.slug)}${pkg ? `&pkg=${encodeURIComponent(pkg.slug)}` : ""}#contact`;

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

  const monthAccessRes = user && !isAdmin && !hasCourseAccess
    ? await supabase
        .from("course_month_access")
        .select("end_at,status")
        .eq("course_id", course.id)
        .eq("user_id", user.id)
        .eq("month_number", monthNumber)
        .eq("status", "active")
        .maybeSingle()
    : { data: null, error: null };

  const nowIso = new Date().toISOString();
  const monthEndAtMs = (monthAccessRes as any)?.data?.end_at ? new Date(String((monthAccessRes as any).data.end_at)).getTime() : NaN;
  const hasMonthAccess =
    isAdmin ||
    (Boolean(user) &&
      !isAdmin &&
      !hasCourseAccess &&
      !monthAccessRes.error &&
      Boolean((monthAccessRes as any).data) &&
      (!Number.isFinite(monthEndAtMs) || monthEndAtMs > Date.parse(nowIso)));

  const lockedView = !user || (!isAdmin && !hasCourseAccess && !hasMonthAccess);

  if (lockedView) {
    const agPreviewRes = await supabase.rpc("preview_age_groups", { p_course_id: course.id });
    let agIds = (((agPreviewRes as any)?.data ?? []) as any[])
      .map((r) => String(r.id ?? ""))
      .filter(Boolean);

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

    if (!agIds.includes(requestedAgeGroupId)) {
      redirect(pkg ? `/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}` : `/programs/${course.slug}`);
    }

    const effectiveAgeGroupId = requestedAgeGroupId;

    let month: MonthRow | null = null;
    const candidateAgIds = effectiveAgeGroupId ? [effectiveAgeGroupId] : agIds;

    for (const agId of candidateAgIds) {
      const monthsRes = await supabase.rpc("preview_months", { p_age_group_id: agId });
      const m = (((monthsRes as any)?.data ?? []) as any[]).find((r) => Number(r.month_number) === monthNumber);
      if (m?.id) {
        month = {
          id: String(m.id),
          age_group_id: String(m.age_group_id ?? agId),
          title: (m.title ?? null) as any,
          month_number: m.month_number === null || m.month_number === undefined ? null : Number(m.month_number),
          sort_order: Number(m.sort_order ?? 0),
          created_at: String(m.created_at ?? ""),
        };
        break;
      }
    }

    const scheduleRes = month
      ? await supabase.rpc("preview_month_schedule", { p_month_id: month.id })
      : { data: [], error: null };

    const rows = (((scheduleRes as any)?.data ?? []) as PreviewScheduleRow[]) ?? [];
    const byDay = new Map<string, any>();

    for (const r of rows) {
      const dayId = String((r as any).day_id ?? "");
      if (!dayId) continue;

      let day = byDay.get(dayId);
      if (!day) {
        day = {
          id: dayId,
          title: (r as any).day_title ?? null,
          day_number: (r as any).day_number === null || (r as any).day_number === undefined ? null : Number((r as any).day_number),
          videos: [] as any[],
        };
        byDay.set(dayId, day);
      }

      const videoId = (r as any).video_id ? String((r as any).video_id) : "";
      if (videoId) {
        day.videos.push({
          id: videoId,
          title: (r as any).video_title ?? null,
          video_url: (r as any).video_url ?? null,
          thumbnail_url: (r as any).thumbnail_url ?? null,
          details: (r as any).details ?? null,
          duration_sec:
            (r as any).duration_sec === null || (r as any).duration_sec === undefined ? null : Number((r as any).duration_sec),
          is_free_preview: Boolean((r as any).is_free_preview),
        });
      }
    }

    const previewDays = Array.from(byDay.values());

    return (
      <ProgramMonthViewer
        courseTitle={course.title}
        courseSlug={course.slug}
        ageGroupId={effectiveAgeGroupId}
        pkgSlug={pkg ? pkg.slug : pkgSlug}
        monthNumber={monthNumber}
        monthTitle={month?.title ?? `الشهر رقم ${monthNumber}`}
        days={previewDays}
        locked
        subscribeHref={subscribeHref}
      />
    );
  }

  const agRes = await supabase
    .from("age_groups")
    .select("id,sort_order,created_at")
    .eq("course_id", course.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (agRes.error) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6" dir="rtl">
        <div className="w-full max-w-xl rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
          <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">خطأ</div>
          <div className="mt-3 text-right text-sm text-white/70" dir="ltr">
            {agRes.error.message}
          </div>
          <div className="mt-5">
            <Link
              href={pkg ? `/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}` : `/programs/${course.slug}`}
              className="text-xs text-white/70 hover:text-white transition"
            >
              رجوع
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ageGroups = (agRes.data as AgeGroupRow[]) ?? [];
  let agIds = ageGroups.map((a) => String(a.id)).filter(Boolean);

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

  if (!agIds.includes(requestedAgeGroupId)) {
    redirect(pkg ? `/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}` : `/programs/${course.slug}`);
  }

  const effectiveAgeGroupId = requestedAgeGroupId;

  const monthRes = agIds.length
    ? effectiveAgeGroupId
      ? await supabase
          .from("months")
          .select("id,age_group_id,title,month_number,sort_order,created_at")
          .eq("age_group_id", effectiveAgeGroupId)
          .eq("month_number", monthNumber)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : await supabase
          .from("months")
          .select("id,age_group_id,title,month_number,sort_order,created_at")
          .in("age_group_id", agIds)
          .eq("month_number", monthNumber)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()
    : { data: null, error: null };

  if ((monthRes as any).error) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6" dir="rtl">
        <div className="w-full max-w-xl rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
          <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">خطأ</div>
          <div className="mt-3 text-right text-sm text-white/70" dir="ltr">
            {(monthRes as any).error.message}
          </div>
          <div className="mt-5">
            <Link
              href={pkg ? `/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}` : `/programs/${course.slug}`}
              className="text-xs text-white/70 hover:text-white transition"
            >
              رجوع
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const month = (monthRes as any).data ? ((monthRes as any).data as MonthRow) : null;

  if (!month) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6" dir="rtl">
        <div className="w-full max-w-xl rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
          <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">الشهر غير متاح</div>
          <div className="mt-3 text-right text-sm text-white/70">
            لو لسه ما فعلتش الشهر ده، ادخل الكود من صفحة الكورس.
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Link
              href={pkg ? `/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}` : `/programs/${course.slug}`}
              className="text-xs text-white/70 hover:text-white transition"
            >
              رجوع لصفحة الكورس
            </Link>
            <Link href="/activate" className="text-xs text-white/70 hover:text-white transition">
              صفحة التفعيل
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const daysRes = await supabase
    .from("days")
    .select("id,month_id,title,day_number,sort_order,created_at")
    .eq("month_id", month.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (daysRes.error) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6" dir="rtl">
        <div className="w-full max-w-xl rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
          <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">خطأ</div>
          <div className="mt-3 text-right text-sm text-white/70" dir="ltr">
            {daysRes.error.message}
          </div>
          <div className="mt-5">
            <Link
              href={pkg ? `/programs/${course.slug}?pkg=${encodeURIComponent(pkg.slug)}` : `/programs/${course.slug}`}
              className="text-xs text-white/70 hover:text-white transition"
            >
              رجوع
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const days = ((daysRes.data as DayRow[]) ?? []).map((d) => ({
    id: String(d.id),
    title: d.title ?? null,
    day_number: d.day_number ?? null,
    videos: [] as Array<{
      id: string;
      title: string | null;
      video_url: string | null;
      thumbnail_url: string | null;
      details: string | null;
      duration_sec: number | null;
      is_free_preview: boolean;
    }>,
  }));

  const dayIds = days.map((d) => d.id);

  if (dayIds.length) {
    const vRes = await supabase
      .from("videos")
      .select("id,day_id,title,video_url,thumbnail_url,details,duration_sec,is_free_preview,sort_order,created_at")
      .in("day_id", dayIds)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!vRes.error) {
      const videos = (vRes.data as VideoRow[]) ?? [];
      const byDay = new Map<string, VideoRow[]>();
      for (const v of videos) {
        const k = String(v.day_id);
        const list = byDay.get(k);
        if (list) list.push(v);
        else byDay.set(k, [v]);
      }

      for (const d of days) {
        const list = byDay.get(d.id) ?? [];
        d.videos = list.map((v) => ({
          id: String(v.id),
          title: v.title ?? null,
          video_url: v.video_url ?? null,
          thumbnail_url: v.thumbnail_url ?? null,
          details: v.details ?? null,
          duration_sec: v.duration_sec ?? null,
          is_free_preview: Boolean(v.is_free_preview),
        }));
      }
    }
  }

  return (
    <ProgramMonthViewer
      courseTitle={course.title}
      courseSlug={course.slug}
      monthNumber={monthNumber}
      monthTitle={month.title ?? null}
      days={days}
    />
  );
}
