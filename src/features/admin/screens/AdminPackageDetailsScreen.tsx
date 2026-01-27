"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AdminCard } from "@/features/admin/ui/AdminCard";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type PackageRow = {
  id: string;
  slug: string;
  title: string;
  theme: string;
};

type CourseRow = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
};

type PackageCourseRow = {
  course_id: string;
  sort_order: number;
  created_at: string;
  courses: CourseRow | CourseRow[] | null;
};

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_/]/g, "")
    .replace(/\/+/g, "-")
    .replace(/-+$/, "")
    .replace(/^-+/, "");
}

function courseLabel(c: CourseRow) {
  return String(c.title_ar ?? c.title_en ?? c.slug ?? "—");
}

export function AdminPackageDetailsScreen({ slug }: { slug: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);

  const [pkg, setPkg] = useState<PackageRow | null>(null);
  const [allCourses, setAllCourses] = useState<CourseRow[]>([]);
  const [linkedCourses, setLinkedCourses] = useState<CourseRow[]>([]);

  const [linkCourseId, setLinkCourseId] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTitleAr, setNewTitleAr] = useState("");
  const [newTitleEn, setNewTitleEn] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [newTheme, setNewTheme] = useState<"orange" | "blue" | "vip">("orange");

  const pushNotice = (kind: "success" | "error" | "info", text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => {
      setNotice((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  const fetchAllCourses = async () => {
    const res = await supabase
      .from("courses")
      .select("id,slug,title_ar,title_en")
      .order("created_at", { ascending: false })
      .limit(500);

    if (res.error) throw new Error(res.error.message);

    const list: CourseRow[] = ((res.data as any[]) ?? []).map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      title_ar: (r as any).title_ar ?? null,
      title_en: (r as any).title_en ?? null,
    }));

    setAllCourses(list);
  };

  const fetchPackageAndLinked = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    const pkgRes = await supabase
      .from("packages")
      .select("id,slug,title,theme")
      .eq("slug", slug)
      .maybeSingle();

    if (pkgRes.error) {
      setPkg(null);
      setLinkedCourses([]);
      setLoading(false);
      setError(pkgRes.error.message);
      return;
    }

    if (!pkgRes.data) {
      setPkg(null);
      setLinkedCourses([]);
      setLoading(false);
      setError("الباقة غير موجودة");
      return;
    }

    const p: PackageRow = {
      id: String((pkgRes.data as any).id),
      slug: String((pkgRes.data as any).slug),
      title: String((pkgRes.data as any).title ?? ""),
      theme: String((pkgRes.data as any).theme ?? "orange"),
    };
    setPkg(p);

    const pcRes = await supabase
      .from("package_courses")
      .select("course_id,sort_order,created_at,courses(id,slug,title_ar,title_en)")
      .eq("package_id", p.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (pcRes.error) {
      setLinkedCourses([]);
      setLoading(false);
      setError(pcRes.error.message);
      return;
    }

    const rows = (pcRes.data ?? []) as PackageCourseRow[];
    const courses = rows
      .flatMap((r) => (Array.isArray(r.courses) ? r.courses : r.courses ? [r.courses] : []))
      .filter(Boolean) as CourseRow[];

    setLinkedCourses(courses);
    setLoading(false);
  };

  useEffect(() => {
    const run = async () => {
      await Promise.all([fetchAllCourses(), fetchPackageAndLinked()]);
    };

    void run().catch((e) => {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    });
  }, [slug]);

  const courseIdsInPackage = useMemo(() => new Set(linkedCourses.map((c) => c.id)), [linkedCourses]);

  const linkExistingCourse = async () => {
    if (!pkg) return;
    const cid = linkCourseId.trim();
    if (!cid) return;
    if (courseIdsInPackage.has(cid)) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    const nextSort = linkedCourses.length;

    const res = await supabase.from("package_courses").insert({
      package_id: pkg.id,
      course_id: cid,
      sort_order: nextSort,
    });

    if (res.error) {
      setError(res.error.message);
      setSaving(false);
      return;
    }

    setLinkCourseId("");
    await fetchPackageAndLinked();
    setSaving(false);
    pushNotice("success", "تم إضافة الكورس للباقة.");
  };

  const createCourseInPackage = async () => {
    if (!pkg) return;

    const slugValue = normalizeSlug(newSlug);
    if (!slugValue) {
      setError("اكتب slug للكورس.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const res = await supabase.rpc("admin_create_course_in_package", {
      p_package_id: pkg.id,
      p_slug: slugValue,
      p_title_ar: newTitleAr.trim() || null,
      p_title_en: newTitleEn.trim() || null,
      p_description: newDesc.trim() || null,
      p_cover_image_url: newCoverUrl.trim() || null,
      p_theme: newTheme,
    });

    if (res.error) {
      setError(res.error.message);
      setSaving(false);
      return;
    }

    setNewSlug("");
    setNewTitleAr("");
    setNewTitleEn("");
    setNewDesc("");
    setNewCoverUrl("");
    setNewTheme("orange");
    setCreateOpen(false);

    await Promise.all([fetchAllCourses(), fetchPackageAndLinked()]);
    setSaving(false);
    pushNotice("success", "تم إنشاء الكورس داخل الباقة.");
  };

  return (
    <div className="space-y-5" dir="rtl">
      <AdminCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-extrabold text-slate-900">تفاصيل الباقة</div>
            <div className="mt-1 text-sm text-slate-600">إدارة الكورسات داخل هذه الباقة.</div>
          </div>
          <Link
            href="/admin/packages"
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 border border-slate-200 shadow-sm transition hover:bg-slate-200"
          >
            رجوع
          </Link>
        </div>

        <div
          className={
            "mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs " +
            (error || notice?.kind === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : loading || saving || notice?.kind === "info"
                ? "border-slate-200 bg-slate-50 text-slate-700"
                : notice?.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600")
          }
        >
          {loading
            ? "تحميل..."
            : error
              ? error
              : saving
                ? "جاري الحفظ..."
                : notice
                  ? notice.text
                  : "بيانات مباشرة"}
        </div>

        {pkg ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_12px_40px_-28px_rgba(2,6,23,0.45)] backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{pkg.title}</div>
                <div className="mt-1 text-xs text-slate-500" dir="ltr">
                  {pkg.slug}
                </div>
              </div>
              <div className="text-xs text-slate-500">{linkedCourses.length} كورس</div>
            </div>
          </div>
        ) : null}
      </AdminCard>

      <AdminCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-base font-extrabold text-slate-900">كورسات الباقة</div>
            <div className="mt-1 text-sm text-slate-600">أضف كورس جديد أو اربط كورس موجود.</div>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen((v) => !v)}
            disabled={!pkg || saving}
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-slate-800 disabled:opacity-50"
          >
            {createOpen ? "إغلاق" : "إضافة كورس جديد"}
          </button>
        </div>

        {createOpen ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="text-sm font-semibold text-slate-900">كورس جديد داخل الباقة</div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">Slug</div>
                <input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="football-small"
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  dir="ltr"
                />
              </label>

              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">Theme</div>
                <select
                  value={newTheme}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "orange" || v === "blue" || v === "vip") setNewTheme(v);
                  }}
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="orange">Orange</option>
                  <option value="blue">Blue</option>
                  <option value="vip">VIP</option>
                </select>
              </label>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">الاسم عربي</div>
                <input
                  value={newTitleAr}
                  onChange={(e) => setNewTitleAr(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="block">
                <div className="mb-2 text-right text-xs font-medium text-slate-600">الاسم إنجليزي</div>
                <input
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  dir="ltr"
                />
              </label>
            </div>

            <label className="mt-3 block">
              <div className="mb-2 text-right text-xs font-medium text-slate-600">Cover image URL (اختياري)</div>
              <input
                value={newCoverUrl}
                onChange={(e) => setNewCoverUrl(e.target.value)}
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                dir="ltr"
              />
            </label>

            <label className="mt-3 block">
              <div className="mb-2 text-right text-xs font-medium text-slate-600">وصف (اختياري)</div>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void createCourseInPackage()}
                disabled={saving || !pkg}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-slate-800 disabled:opacity-50"
              >
                إنشاء
              </button>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_12px_40px_-28px_rgba(2,6,23,0.45)] backdrop-blur">
          <div className="text-sm font-semibold text-slate-900">ربط كورس موجود</div>
          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_140px]">
            <select
              value={linkCourseId}
              onChange={(e) => setLinkCourseId(e.target.value)}
              disabled={!pkg || saving}
              className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">اختر كورس…</option>
              {allCourses
                .filter((c) => !courseIdsInPackage.has(c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {courseLabel(c)} ({c.slug})
                  </option>
                ))}
            </select>

            <button
              type="button"
              onClick={() => void linkExistingCourse()}
              disabled={!pkg || saving || !linkCourseId}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-200 disabled:opacity-50"
            >
              إضافة
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 border border-slate-200">تحميل...</div>
          ) : linkedCourses.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 border border-slate-200">لا يوجد كورسات في هذه الباقة.</div>
          ) : (
            linkedCourses.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{courseLabel(c)}</div>
                    <div className="mt-1 truncate text-xs text-slate-500" dir="ltr">
                      {c.slug}
                    </div>
                  </div>
                  <Link
                    href={
                      pkg?.slug
                        ? `/admin/courses/${encodeURIComponent(c.slug)}?pkg=${encodeURIComponent(String(pkg?.slug))}`
                        : `/admin/courses/${encodeURIComponent(c.slug)}`
                    }
                    className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    فتح المحتوى
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </AdminCard>
    </div>
  );
}
