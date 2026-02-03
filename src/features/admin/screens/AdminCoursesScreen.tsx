"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { AdminCard } from "@/features/admin/ui/AdminCard";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

function themeRing(theme: "green" | "blue" | "orange") {
  if (theme === "green") return "bg-emerald-50 text-emerald-800 border border-emerald-200";
  if (theme === "blue") return "bg-sky-50 text-sky-800 border border-sky-200";
  return "bg-slate-100 text-slate-800 border border-slate-200";
}

type CourseRow = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
  description: string | null;
  cover_image_url: string | null;
  theme: string | null;
};

function normalizeCourseSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_/]/g, "")
    .replace(/\/+$/, "")
    .replace(/\.html$/, "");
}

export function AdminCoursesScreen() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [ageCountByCourseId, setAgeCountByCourseId] = useState<Record<string, number>>({});
  const [subsCountByCourseId, setSubsCountByCourseId] = useState<Record<string, number>>({});

  const [query, setQuery] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newSlug, setNewSlug] = useState("");
  const [newTitleAr, setNewTitleAr] = useState("");
  const [newTitleEn, setNewTitleEn] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTheme, setNewTheme] = useState<"green" | "blue" | "orange">("orange");
  const [newCoverUrl, setNewCoverUrl] = useState("");

  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const pushNotice = (kind: "success" | "error" | "info", text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => {
      setNotice((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  const getSupabase = () => {
    try {
      return createSupabaseBrowserClient();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الاتصال بقاعدة البيانات");
      return null;
    }
  };

  const fetchCourses = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const res = await supabase
      .from("courses")
      .select("id,slug,title_ar,title_en,description,cover_image_url,theme")
      .order("created_at", { ascending: true });

    if (res.error) {
      setError(res.error.message);
      setCourses([]);
    } else {
      setError(null);
      const list = (((res.data as any[]) ?? []) as any[]).map((r) => ({
        id: String(r.id),
        slug: String(r.slug),
        title_ar: r.title_ar ?? null,
        title_en: r.title_en ?? null,
        description: r.description ?? null,
        cover_image_url: r.cover_image_url ?? null,
        theme: r.theme ?? null,
      }));
      setCourses(list);

      const ids = list.map((c) => c.id).filter(Boolean);
      if (ids.length === 0) {
        setAgeCountByCourseId({});
        setSubsCountByCourseId({});
        return;
      }

      const [agesRes, enrRes, monthRes, ageAccRes] = await Promise.all([
        supabase.from("age_groups").select("course_id").in("course_id", ids),
        supabase.from("enrollments").select("course_id,user_id").in("course_id", ids),
        supabase.from("course_month_access").select("course_id,user_id").in("course_id", ids),
        supabase.from("course_age_group_access").select("course_id,user_id").in("course_id", ids),
      ]);

      if (agesRes.error) {
        setAgeCountByCourseId({});
      } else {
        const counts: Record<string, number> = {};
        for (const row of (agesRes.data ?? []) as Array<{ course_id: string }>) {
          const k = String(row.course_id);
          counts[k] = (counts[k] ?? 0) + 1;
        }
        setAgeCountByCourseId(counts);
      }

      if (enrRes.error || monthRes.error || ageAccRes.error) {
        setSubsCountByCourseId({});
        return;
      }

      const byCourse = new Map<string, Set<string>>();
      const add = (courseId: unknown, userId: unknown) => {
        const cId = String(courseId ?? "").trim();
        const uId = String(userId ?? "").trim();
        if (!cId || !uId) return;
        const set = byCourse.get(cId);
        if (set) set.add(uId);
        else byCourse.set(cId, new Set([uId]));
      };

      for (const row of (enrRes.data ?? []) as Array<{ course_id: string; user_id: string }>) {
        add(row.course_id, row.user_id);
      }
      for (const row of (monthRes.data ?? []) as Array<{ course_id: string; user_id: string }>) {
        add(row.course_id, row.user_id);
      }
      for (const row of (ageAccRes.data ?? []) as Array<{ course_id: string; user_id: string }>) {
        add(row.course_id, row.user_id);
      }

      const subsCounts: Record<string, number> = {};
      for (const [courseId, set] of byCourse.entries()) {
        subsCounts[courseId] = set.size;
      }
      setSubsCountByCourseId(subsCounts);
    }
  };

  useEffect(() => {
    const run = async () => {
      await fetchCourses();
      setLoaded(true);
    };

    void run();
  }, []);

  const uploadCover = async (file: File) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const basis = newSlug || newTitleAr || "course";
    const slug = normalizeCourseSlug(basis) || "course";
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/g, "") || "png";
    const now = Date.parse(new Date().toISOString());
    const path = `courses/${slug}-${now}.${safeExt}`;

    setUploading(true);
    setError(null);
    setNotice(null);

    const up = await supabase.storage.from("course-covers").upload(path, file, { upsert: true });
    if (up.error) {
      setError(
        `رفع الصورة فشل: ${up.error.message} — لو عايز الرفع اشتغل: أنشئ Bucket باسم course-covers (Public) أو فعّل صلاحيات الرفع.`,
      );
      setUploading(false);
      return;
    }

    const pub = supabase.storage.from("course-covers").getPublicUrl(path);
    const url = pub.data.publicUrl;
    if (url) setNewCoverUrl(url);
    setUploading(false);
    pushNotice("success", "تم رفع الصورة.");
  };

  const createCourse = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    const slug = normalizeCourseSlug(newSlug);
    if (!slug) {
      setError("اكتب slug للكورس.");
      return;
    }

    setCreating(true);
    setError(null);
    setNotice(null);

    const res = await supabase
      .from("courses")
      .insert({
        slug,
        title_ar: newTitleAr.trim() || null,
        title_en: newTitleEn.trim() || null,
        description: newDesc.trim() || null,
        cover_image_url: newCoverUrl.trim() || null,
        theme: newTheme,
      })
      .select("id")
      .maybeSingle();

    if (res.error) {
      setError(res.error.message);
      setCreating(false);
      return;
    }

    setNewSlug("");
    setNewTitleAr("");
    setNewTitleEn("");
    setNewDesc("");
    setNewTheme("orange");
    setNewCoverUrl("");
    setCreateOpen(false);
    setCreating(false);
    await fetchCourses();
    pushNotice("success", "تم إنشاء الكورس.");
  };

  const deleteCourse = async (course: CourseRow) => {
    if (deletingCourseId) return;
    const label = course.title_ar ?? course.title_en ?? course.slug;
    const ok = window.confirm(`حذف الكورس نهائيًا؟\n\n${label}\n\nسيتم حذف المحتوى المرتبط به تلقائيًا.`);
    if (!ok) return;

    const supabase = getSupabase();
    if (!supabase) return;

    setDeletingCourseId(course.id);
    setError(null);
    setNotice(null);

    const res = await supabase.from("courses").delete().eq("id", course.id);
    if (res.error) {
      setError(res.error.message);
      setDeletingCourseId(null);
      return;
    }

    setCourses((prev) => prev.filter((c) => c.id !== course.id));
    setDeletingCourseId(null);
    pushNotice("success", "تم حذف الكورس.");
  };

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const slug = (c.slug ?? "").toLowerCase();
      const title = (c.title_ar ?? "").toLowerCase();
      const titleEn = (c.title_en ?? "").toLowerCase();
      const desc = (c.description ?? "").toLowerCase();
      return slug.includes(q) || title.includes(q) || titleEn.includes(q) || desc.includes(q);
    });
  }, [courses, query]);

  return (
    <div className="space-y-5">
      <AdminCard>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-extrabold text-slate-900">الكورسات</div>
              <div className="mt-1 text-sm text-slate-600">إدارة الكورسات والدخول لتفاصيل الكورس لإضافة الباقات والمحتوى.</div>
            </div>
            <div className="text-xs text-slate-500 whitespace-nowrap">{loaded ? `${filteredCourses.length} كورس` : "تحميل..."}</div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث عن كورس..."
              className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
            <button
              type="button"
              onClick={() => setCreateOpen((v) => !v)}
              disabled={creating || uploading}
              className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-slate-800 disabled:opacity-50"
            >
              {createOpen ? "إغلاق" : "إضافة كورس"}
            </button>
          </div>
        </div>

        <div
          className={
            "mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs " +
            (error || notice?.kind === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : !loaded || creating || uploading || notice?.kind === "info"
                ? "border-slate-200 bg-slate-50 text-slate-700"
                : notice?.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600")
          }
        >
          {!loaded
            ? "تحميل..."
            : error
              ? error
              : uploading
                ? "جاري رفع الصورة..."
                : creating
                  ? "جاري الحفظ..."
                  : notice
                    ? notice.text
                    : "بيانات مباشرة"}
        </div>

        {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}

        {createOpen ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">إضافة كورس</div>
                <div className="mt-1 text-sm text-slate-600">املأ البيانات الأساسية ثم احفظ.</div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">slug</div>
                <input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="مثال: football"
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">اسم الكورس</div>
                <input
                  value={newTitleAr}
                  onChange={(e) => setNewTitleAr(e.target.value)}
                  placeholder="عنوان عربي"
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>

            <label className="mt-3 block">
              <div className="mb-2 text-right text-xs font-medium text-slate-600">اسم الكورس (English)</div>
              <input
                value={newTitleEn}
                onChange={(e) => setNewTitleEn(e.target.value)}
                placeholder="English title"
                dir="ltr"
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="mt-3 block">
              <div className="mb-2 text-right text-xs font-medium text-slate-600">وصف</div>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="وصف مختصر"
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_200px]">
              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">لينك الصورة (اختياري)</div>
                <input
                  value={newCoverUrl}
                  onChange={(e) => setNewCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">لون الثيم</div>
                <select
                  value={newTheme}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "orange" || v === "blue" || v === "green") setNewTheme(v);
                  }}
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="orange">برتقالي</option>
                  <option value="blue">أزرق</option>
                  <option value="green">أخضر</option>
                </select>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-600">صورة الكورس (اختياري)</span>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  disabled={uploading || creating}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadCover(f);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading || creating}
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-4 text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 disabled:opacity-50"
                >
                  اختيار صورة من المعرض
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={createCourse}
                  disabled={creating || uploading}
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-slate-800 disabled:opacity-50"
                >
                  {creating ? "جاري الحفظ..." : "حفظ الكورس"}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  disabled={creating || uploading}
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </div>

            {newCoverUrl.trim() ? (
              <div className="mt-4">
                <div className="mb-2 text-right text-xs text-slate-600">معاينة الصورة</div>
                <div
                  className="h-40 w-full rounded-2xl bg-slate-100"
                  style={{
                    backgroundImage: `url(${newCoverUrl.trim()})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminCard>

      <div className="grid gap-3">
        {filteredCourses.map((course) => (
          <div key={course.id}>
            <Link
              href={`/admin/courses/${course.slug}`}
              className="group relative block overflow-hidden rounded-2xl bg-white/90 p-5 shadow-[0_12px_40px_-28px_rgba(2,6,23,0.45)] border border-slate-200/70 backdrop-blur transition"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void deleteCourse(course);
                }}
                disabled={deletingCourseId === course.id}
                className="absolute left-4 top-4 z-10 inline-flex h-9 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
              >
                {deletingCourseId === course.id ? "جاري..." : "حذف"}
              </button>

              <div
                className="mb-4 h-36 w-full rounded-2xl bg-slate-100"
                style={{
                  backgroundImage: course.cover_image_url ? `url(${course.cover_image_url})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${themeRing(
                  (course.theme === "green" || course.theme === "blue" || course.theme === "orange"
                    ? course.theme
                    : "orange") as "green" | "blue" | "orange",
                )}`}
              >
                <span className="h-2 w-2 rounded-full bg-current/30" />
                {course.slug}
              </div>

              <div className="mt-4 text-lg font-semibold text-slate-900">
                {course.title_ar ?? course.title_en ?? course.slug}
              </div>

              {course.title_ar && course.title_en ? (
                <div className="mt-1 text-xs text-slate-500" dir="ltr">
                  {course.title_en}
                </div>
              ) : null}
              <div className="mt-2 text-sm text-slate-600">
                {course.description ?? ""}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 px-3 py-3 border border-slate-200">
                  الأعمار
                  <div className="mt-1 text-sm font-semibold text-slate-900">{ageCountByCourseId[course.id] ?? 0}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3 border border-slate-200">
                  المشتركين
                  <div className="mt-1 text-sm font-semibold text-slate-900">{subsCountByCourseId[course.id] ?? 0}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3 border border-slate-200">
                  الكروت
                  <div className="mt-1 text-sm font-semibold text-slate-900">—</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3 border border-slate-200">
                  الشهور
                  <div className="mt-1 text-sm font-semibold text-slate-900">—</div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-700">فتح</div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
