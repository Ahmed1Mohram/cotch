"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AdminCard } from "@/features/admin/ui/AdminCard";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type CourseRow = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
};

type AgeGroupRow = {
  id: string;
  title: string | null;
  sort_order: number;
  created_at: string;
};

type PlayerCardRow = {
  id: string;
  age_group_id: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  note: string | null;
  sort_order: number;
  created_at: string;
  age_group_title: string | null;
};

function toIntOrNull(v: string) {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export function AdminCardCodesScreen() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const selectedCourse = useMemo(
    () => courses.find((c) => String(c.id) === String(selectedCourseId)) ?? null,
    [courses, selectedCourseId],
  );

  const [cards, setCards] = useState<PlayerCardRow[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string>("");

  const selectedCard = useMemo(
    () => cards.find((c) => String(c.id) === String(selectedCardId)) ?? null,
    [cards, selectedCardId],
  );

  const [count, setCount] = useState("1");
  const [durationDays, setDurationDays] = useState("30");
  const [maxRedemptions, setMaxRedemptions] = useState("1");

  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copying, setCopying] = useState(false);
  const [deletingCodes, setDeletingCodes] = useState(false);
  const [confirmDeleteCodes, setConfirmDeleteCodes] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const copyText = async (text: string) => {
    const t = String(text ?? "").trim();
    if (!t) return;
    if (!navigator?.clipboard?.writeText) {
      throw new Error("المتصفح لا يدعم النسخ");
    }
    await navigator.clipboard.writeText(t);
  };

  const deleteGenerated = async () => {
    if (!generatedCodes.length) return;
    const supabase = createSupabaseBrowserClient();
    setDeletingCodes(true);
    setError(null);
    setNotice(null);
    try {
      const res = await supabase.from("age_group_codes").delete().in("code", generatedCodes);
      if (res.error) {
        throw new Error(res.error.message);
      }
      setGeneratedCodes([]);
      setConfirmDeleteCodes(false);
      setNotice("تم حذف الأكواد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الحذف");
    } finally {
      setDeletingCodes(false);
    }
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const run = async () => {
      setCoursesLoading(true);
      setError(null);

      const res = await supabase
        .from("courses")
        .select("id,slug,title_ar,title_en")
        .order("created_at", { ascending: true });

      if (res.error) {
        setCourses([]);
        setSelectedCourseId("");
        setError(res.error.message);
        setCoursesLoading(false);
        return;
      }

      const list = ((res.data as any[]) ?? []).map((r) => ({
        id: String(r.id),
        slug: String(r.slug ?? ""),
        title_ar: (r.title_ar ?? null) as any,
        title_en: (r.title_en ?? null) as any,
      })) as CourseRow[];

      setCourses(list);
      setSelectedCourseId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev;
        return list[0]?.id ?? "";
      });
      setCoursesLoading(false);
    };

    void run().catch((err) => {
      setCourses([]);
      setSelectedCourseId("");
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      setCoursesLoading(false);
    });
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const run = async () => {
      const courseId = selectedCourseId.trim();
      if (!courseId) {
        setCards([]);
        setSelectedCardId("");
        return;
      }

      setCardsLoading(true);
      setError(null);
      setGeneratedCodes([]);

      const agRes = await supabase
        .from("age_groups")
        .select("id,title,sort_order,created_at")
        .eq("course_id", courseId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (agRes.error) {
        setCards([]);
        setSelectedCardId("");
        setCardsLoading(false);
        setError(agRes.error.message);
        return;
      }

      const ageGroups = ((agRes.data as any[]) ?? []).map((r) => ({
        id: String(r.id),
        title: (r.title ?? null) as any,
        sort_order: Number(r.sort_order ?? 0),
        created_at: String(r.created_at ?? ""),
      })) as AgeGroupRow[];

      const agIds = ageGroups.map((a) => a.id).filter(Boolean);
      if (!agIds.length) {
        setCards([]);
        setSelectedCardId("");
        setCardsLoading(false);
        return;
      }

      const titleByAgId = new Map(ageGroups.map((a) => [a.id, a.title] as const));

      const pcRes = await supabase
        .from("player_cards")
        .select("id,age_group_id,age,height_cm,weight_kg,note,sort_order,created_at")
        .in("age_group_id", agIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (pcRes.error) {
        setCards([]);
        setSelectedCardId("");
        setCardsLoading(false);
        setError(pcRes.error.message);
        return;
      }

      const list: PlayerCardRow[] = ((pcRes.data as any[]) ?? []).map((r) => ({
        id: String(r.id),
        age_group_id: String(r.age_group_id),
        age: r.age === null || r.age === undefined ? null : Number(r.age),
        height_cm: r.height_cm === null || r.height_cm === undefined ? null : Number(r.height_cm),
        weight_kg: r.weight_kg === null || r.weight_kg === undefined ? null : Number(r.weight_kg),
        note: r.note ?? null,
        sort_order: Number(r.sort_order ?? 0),
        created_at: String(r.created_at ?? ""),
        age_group_title: titleByAgId.get(String(r.age_group_id)) ?? null,
      }));

      setCards(list);
      setSelectedCardId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev;
        return list[0]?.id ?? "";
      });
      setCardsLoading(false);
    };

    void run().catch((err) => {
      setCards([]);
      setSelectedCardId("");
      setCardsLoading(false);
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    });
  }, [selectedCourseId]);

  const generate = async () => {
    if (!selectedCourse?.slug) return;
    if (!selectedCardId.trim()) return;

    const c = toIntOrNull(count);
    const d = toIntOrNull(durationDays);
    const m = toIntOrNull(maxRedemptions);

    if (!c || c <= 0) return;
    if (!d || d <= 0) return;
    if (!m || m <= 0) return;

    const supabase = createSupabaseBrowserClient();

    setGenerating(true);
    setError(null);
    setNotice(null);

    const res = await supabase.rpc("generate_age_group_codes", {
      p_course_slug: selectedCourse.slug,
      p_player_card_id: selectedCardId,
      p_count: c,
      p_duration_days: d,
      p_max_redemptions: m,
    });

    if (res.error) {
      setGenerating(false);
      setError(res.error.message);
      return;
    }

    const codes = (((res.data as any[]) ?? []) as any[])
      .map((r) => String(r?.code ?? "").trim())
      .filter(Boolean);

    setGeneratedCodes(codes);
    setNotice(codes.length ? `تم توليد ${codes.length} كود.` : "تم التوليد.");
    setGenerating(false);
  };

  const copyAll = async () => {
    if (!generatedCodes.length) return;

    const supabase = createSupabaseBrowserClient();
    setCopying(true);
    setError(null);
    try {
      await copyText(generatedCodes.join("\n"));
      const res = await supabase.from("age_group_codes").delete().in("code", generatedCodes);
      if (res.error) {
        throw new Error(res.error.message);
      }
      setGeneratedCodes([]);
      setNotice("تم نسخ الأكواد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل النسخ");
    } finally {
      setCopying(false);
    }
  };

  const courseLabel = (c: CourseRow) => {
    return c.title_ar ?? c.title_en ?? c.slug;
  };

  const cardLabel = (c: PlayerCardRow) => {
    const parts: string[] = [];
    parts.push(`عمر: ${c.age ?? "—"}`);
    parts.push(`طول: ${c.height_cm ?? "—"}`);
    parts.push(`وزن: ${c.weight_kg ?? "—"}`);
    const agTitle = (c.age_group_title ?? "").trim();
    const note = (c.note ?? "").trim();
    const tail = [agTitle, note].filter(Boolean).join(" • ");
    return `${parts.join(" | ")}${tail ? ` — ${tail}` : ""}`;
  };

  return (
    <div className="space-y-5" dir="rtl">
      <AdminCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-base font-extrabold text-slate-900">أكواد الكروت</div>
            <div className="mt-1 text-sm text-slate-600">اختار كورس ثم اختار كارت وولّد الأكواد.</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedCourse?.slug ? (
              <Link
                href={`/admin/courses/${encodeURIComponent(selectedCourse.slug)}?tab=cards`}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                فتح صفحة الكورس
              </Link>
            ) : null}
          </div>
        </div>

        <div
          className={
            "mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs " +
            (error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : coursesLoading || cardsLoading || generating
                ? "border-slate-200 bg-slate-50 text-slate-700"
                : "border-slate-200 bg-slate-50 text-slate-600")
          }
        >
          {error
            ? error
            : coursesLoading
              ? "تحميل الكورسات..."
              : cardsLoading
                ? "تحميل الكروت..."
                : generating
                  ? "جاري توليد الأكواد..."
                  : notice
                    ? notice
                    : "جاهز"}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <div className="mb-2 text-right text-xs font-medium text-slate-600">الكورس</div>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              disabled={coursesLoading}
            >
              {courses.length === 0 ? <option value="">لا يوجد كورسات</option> : null}
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {courseLabel(c)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="mb-2 text-right text-xs font-medium text-slate-600">الكارت</div>
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              disabled={cardsLoading || !selectedCourseId}
            >
              {cards.length === 0 ? <option value="">لا يوجد كروت</option> : null}
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {cardLabel(c)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-4">
          <div className="text-sm font-semibold text-slate-900">إعدادات التوليد</div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="عدد الأكواد"
              inputMode="numeric"
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
            <input
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder="مدة التفعيل (بالأيام)"
              inputMode="numeric"
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
            <input
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="عدد مرات استخدام الكود"
              inputMode="numeric"
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              {selectedCard ? `الكارت المحدد: ${cardLabel(selectedCard)}` : "اختر كارت"}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyAll}
                disabled={copying || deletingCodes || !generatedCodes.length}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-800 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 disabled:opacity-50"
              >
                {copying ? "جاري النسخ..." : "نسخ الأكواد"}
              </button>

              {confirmDeleteCodes ? (
                <>
                  <button
                    type="button"
                    onClick={deleteGenerated}
                    disabled={deletingCodes || copying || !generatedCodes.length}
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-rose-700 disabled:opacity-50"
                  >
                    {deletingCodes ? "حذف..." : "تأكيد حذف الأكواد"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteCodes(false)}
                    disabled={deletingCodes}
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteCodes(true)}
                  disabled={deletingCodes || copying || !generatedCodes.length}
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-50 px-4 text-sm font-semibold text-rose-700 border border-rose-200 shadow-sm transition enabled:hover:bg-rose-100 disabled:opacity-50"
                >
                  حذف الأكواد
                </button>
              )}

              <button
                type="button"
                onClick={generate}
                disabled={
                  generating ||
                  copying ||
                  deletingCodes ||
                  !selectedCourse?.slug ||
                  !selectedCardId
                }
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-slate-800 disabled:opacity-50"
              >
                {generating ? "جاري التوليد..." : "توليد الأكواد"}
              </button>
            </div>
          </div>
        </div>

        {generatedCodes.length ? (
          <div className="mt-4 rounded-2xl bg-white px-4 py-4 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">الأكواد</div>
              <div className="text-xs text-slate-500">{generatedCodes.length}</div>
            </div>

            <div className="mt-3 space-y-1">
              {generatedCodes.map((code) => (
                <div key={code} className="font-mono text-sm text-slate-700" dir="ltr">
                  {code}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </AdminCard>
    </div>
  );
}
