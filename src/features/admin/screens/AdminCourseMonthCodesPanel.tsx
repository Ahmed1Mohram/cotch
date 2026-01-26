"use client";

import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

import { AdminCard } from "@/features/admin/ui/AdminCard";

type MonthCodeRow = {
  id: string;
  code: string;
  course_id: string;
  month_number: number;
  duration_days: number;
  max_redemptions: number;
  active: boolean;
  note: string | null;
  created_at: string;
};

type RedemptionRow = {
  code_id: string;
};

function toIntOrNull(v: string) {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export function AdminCourseMonthCodesPanel({
  courseId,
  courseSlug,
  monthNumber: controlledMonthNumber,
  onMonthNumberChange,
}: {
  courseId: string | null;
  courseSlug: string;
  monthNumber?: string;
  onMonthNumberChange?: (value: string) => void;
}) {
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copyingAll, setCopyingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getSupabase = () => {
    try {
      return createSupabaseBrowserClient();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الاتصال بقاعدة البيانات");
      return null;
    }
  };

  const [monthNumberInternal, setMonthNumberInternal] = useState("1");
  const monthNumber = controlledMonthNumber ?? monthNumberInternal;
  const setMonthNumber = onMonthNumberChange ?? setMonthNumberInternal;
  const [count, setCount] = useState("10");
  const [durationDays, setDurationDays] = useState("40");
  const maxRedemptions = 1;

  const [showGenerator, setShowGenerator] = useState(false);

  const [codes, setCodes] = useState<MonthCodeRow[]>([]);
  const [redemptionsCountByCodeId, setRedemptionsCountByCodeId] = useState<Map<string, number>>(new Map());

  const removeCodesFromUi = (ids: string[]) => {
    if (!ids.length) return;
    const set = new Set(ids);
    setCodes((prev) => prev.filter((c) => !set.has(c.id)));
    setRedemptionsCountByCodeId((prev) => {
      const next = new Map(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  };

  const deleteCodesFromDb = async (ids: string[]) => {
    const list = ids.map((v) => String(v)).filter(Boolean);
    if (!list.length) return;
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("فشل الاتصال بقاعدة البيانات");
    }
    const res = await supabase.from("month_codes").delete().in("id", list);
    if (res.error) {
      throw new Error(res.error.message);
    }
  };

  const copyText = async (text: string) => {
    const t = String(text ?? "").trim();
    if (!t) return;
    if (!navigator?.clipboard?.writeText) {
      throw new Error("المتصفح لا يدعم النسخ");
    }
    await navigator.clipboard.writeText(t);
  };

  const copyOne = async (row: MonthCodeRow) => {
    setCopyingId(row.id);
    setError(null);
    try {
      await copyText(row.code);
      await deleteCodesFromDb([row.id]);
      removeCodesFromUi([row.id]);
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل النسخ");
    } finally {
      setCopyingId(null);
    }
  };

  const copyAllFiltered = async () => {
    if (!filteredCodes.length) return;
    const ids = filteredCodes.map((c) => c.id);
    const text = filteredCodes.map((c) => c.code).join("\n");
    setCopyingAll(true);
    setError(null);
    try {
      await copyText(text);
      await deleteCodesFromDb(ids);
      removeCodesFromUi(ids);
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل النسخ");
    } finally {
      setCopyingAll(false);
    }
  };

  const filteredCodes = useMemo(() => {
    if (!codes.length) return [];
    const mn = toIntOrNull(monthNumber);
    if (!mn) return codes;
    return codes.filter((c) => Number(c.month_number) === mn);
  }, [codes, monthNumber]);

  useEffect(() => {
    if (!courseId) return;

    const supabase = getSupabase();
    if (!supabase) return;
    const run = async () => {
      setError(null);

      const res = await supabase
        .from("month_codes")
        .select("id,code,course_id,month_number,duration_days,max_redemptions,active,note,created_at")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (res.error) {
        setCodes([]);
        setRedemptionsCountByCodeId(new Map());
        setError(res.error.message);
        return;
      }

      const list = (res.data as MonthCodeRow[]) ?? [];
      setCodes(list);

      const ids = list.map((c) => c.id);
      if (ids.length === 0) {
        setRedemptionsCountByCodeId(new Map());
        return;
      }

      const redRes = await supabase
        .from("month_code_redemptions")
        .select("code_id")
        .in("code_id", ids);

      if (redRes.error) {
        setRedemptionsCountByCodeId(new Map());
        return;
      }

      const rows = (redRes.data as RedemptionRow[]) ?? [];
      const map = new Map<string, number>();
      for (const r of rows) {
        const key = String(r.code_id);
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      setRedemptionsCountByCodeId(map);
    };

    void run().catch((err) => {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    });
  }, [courseId, reloadKey]);

  const generate = async () => {
    const mn = toIntOrNull(monthNumber);
    const c = toIntOrNull(count);
    const d = toIntOrNull(durationDays);
    const max = 1;

    if (!mn || mn <= 0) return;
    if (!c || c <= 0) return;
    if (!d || d <= 0) return;
    if (max <= 0) return;

    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase.rpc("generate_month_codes", {
      p_course_slug: courseSlug,
      p_month_number: mn,
      p_count: c,
      p_duration_days: d,
      p_max_redemptions: max,
    });

    if (res.error) {
      setError(res.error.message);
      setSaving(false);
      return;
    }

    setReloadKey((k) => k + 1);
    setShowGenerator(false);
    setSaving(false);
  };

  const deleteCode = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    setDeletingId(id);
    setError(null);

    const res = await supabase.from("month_codes").delete().eq("id", id);
    if (res.error) {
      setError(res.error.message);
      setDeletingId(null);
      return;
    }

    removeCodesFromUi([id]);
    setConfirmDeleteId(null);
    setDeletingId(null);
  };

  const toggleActive = async (id: string, active: boolean) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase.from("month_codes").update({ active }).eq("id", id);

    if (res.error) setError(res.error.message);
    else setReloadKey((k) => k + 1);

    setSaving(false);
  };

  if (!courseId) {
    return (
      <AdminCard>
        <div className="font-heading text-xl tracking-[0.12em] text-slate-900">أكواد الشهور</div>
        <div className="mt-2 text-sm text-slate-600">تحميل بيانات الكورس...</div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <AdminCard className="border border-rose-200 bg-rose-50">
          <div className="text-sm font-semibold text-rose-700">حدث خطأ</div>
          <div className="mt-1 text-sm text-rose-700" dir="ltr">
            {error}
          </div>
        </AdminCard>
      ) : null}

      <AdminCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-heading text-xl tracking-[0.12em] text-slate-900">أكواد الشهور</div>
            <div className="mt-2 text-sm text-slate-600">توليد أكواد للشهور مع مدة صلاحية.</div>
          </div>

          <button
            type="button"
            onClick={() => setShowGenerator((v) => !v)}
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 px-5 text-sm font-medium text-slate-900 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
          >
            {showGenerator ? "إخفاء" : "توليد أكواد"}
          </button>
        </div>

        {showGenerator ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-slate-700">رقم الشهر</div>
                <input
                  value={monthNumber}
                  onChange={(e) => setMonthNumber(e.target.value)}
                  placeholder="مثال: 1"
                  inputMode="numeric"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-700">عدد الأكواد</div>
                <input
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="مثال: 10"
                  inputMode="numeric"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-700">مدة الصلاحية (يوم)</div>
                <input
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="مثال: 40"
                  inputMode="numeric"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-700">عدد مرات استخدام الكود</div>
                <input
                  value={String(maxRedemptions)}
                  placeholder="1"
                  inputMode="numeric"
                  disabled
                  readOnly
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={generate}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                {saving ? "جاري التوليد..." : "توليد"}
              </button>
              <button
                type="button"
                onClick={() => setShowGenerator(false)}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : null}
      </AdminCard>

      <AdminCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-heading text-sm tracking-[0.12em] text-slate-900">الأكواد</div>
            <div className="mt-1 text-xs text-slate-500">{filteredCodes.length} كود</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-medium text-slate-700">فلترة الشهر</div>
            <input
              value={monthNumber}
              onChange={(e) => setMonthNumber(e.target.value)}
              placeholder="مثال: 1"
              inputMode="numeric"
              className="h-9 w-[120px] rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
            <button
              type="button"
              onClick={() => void copyAllFiltered()}
              disabled={saving || copyingAll || filteredCodes.length === 0}
              className="h-9 rounded-xl bg-slate-100 px-4 text-[12px] font-medium text-slate-900 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-200 disabled:opacity-50"
            >
              {copyingAll ? "جاري النسخ..." : "نسخ الكل"}
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredCodes.map((c) => {
            const used = redemptionsCountByCodeId.get(c.id) ?? 0;
            const exhausted = used >= c.max_redemptions;
            const isConfirmingDelete = confirmDeleteId === c.id;
            const isDeleting = deletingId === c.id;
            return (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm" dir="ltr">
                      <span className="font-mono text-slate-900">{c.code}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500" dir="rtl">
                      شهر {c.month_number} • {c.duration_days} يوم
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span
                      className={
                        "rounded-full px-3 py-1 text-[11px] font-medium border " +
                        (exhausted
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200")
                      }
                    >
                      {used}/{c.max_redemptions}
                    </span>

                    {isConfirmingDelete ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void deleteCode(c.id)}
                          disabled={saving || copyingAll || isDeleting}
                          className="h-9 rounded-xl bg-rose-600 px-4 text-xs font-medium text-white shadow-sm transition enabled:hover:bg-rose-700 disabled:opacity-50"
                        >
                          {isDeleting ? "حذف..." : "تأكيد الحذف"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={saving || copyingAll || isDeleting}
                          className="h-9 rounded-xl bg-white px-4 text-xs font-medium text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 disabled:opacity-50"
                        >
                          إلغاء
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(c.id)}
                        disabled={saving || copyingAll || copyingId === c.id || isDeleting}
                        className="h-9 rounded-xl bg-rose-50 px-4 text-xs font-medium text-rose-700 border border-rose-200 shadow-sm transition enabled:hover:bg-rose-100 disabled:opacity-50"
                      >
                        حذف
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => void copyOne(c)}
                      disabled={saving || copyingAll || copyingId === c.id || isConfirmingDelete || isDeleting}
                      className="h-9 rounded-xl bg-violet-50 px-4 text-xs font-medium text-violet-700 border border-violet-200 shadow-sm transition enabled:hover:bg-violet-100 disabled:opacity-50"
                    >
                      {copyingId === c.id ? "نسخ..." : "نسخ"}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleActive(c.id, !c.active)}
                      disabled={saving || isConfirmingDelete || isDeleting}
                      className={
                        "h-9 rounded-xl px-4 text-xs font-medium border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 " +
                        (c.active
                          ? "bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200"
                          : "bg-white text-violet-700 border-violet-200 hover:bg-violet-50")
                      }
                    >
                      {c.active ? "تعطيل" : "تفعيل"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCodes.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600 border border-slate-200">
              مفيش أكواد (أو مفيش أكواد للشهر ده).
            </div>
          ) : null}
        </div>
      </AdminCard>
    </div>
  );
}
