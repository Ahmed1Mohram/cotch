"use client";

import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

import { AdminCard } from "@/features/admin/ui/AdminCard";

type MonthRow = {
  id: string;
  age_group_id: string;
  title: string | null;
  month_number: number | null;
  sort_order: number;
};

type DayRow = {
  id: string;
  month_id: string;
  title: string | null;
  day_number: number | null;
  sort_order: number;
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
};

function toNumOrNull(v: string) {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return n;
}

export function AdminCourseMonthsVideosPanel({
  ageGroupId,
  onMonthNumberChange,
}: {
  ageGroupId: string | null;
  onMonthNumberChange?: (monthNumber: string) => void;
}) {
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSupabase = () => {
    try {
      return createSupabaseBrowserClient();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الاتصال بقاعدة البيانات");
      return null;
    }
  };

  const [months, setMonths] = useState<MonthRow[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);

  const [days, setDays] = useState<DayRow[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const [videos, setVideos] = useState<VideoRow[]>([]);

  const [showAddMonth, setShowAddMonth] = useState(false);
  const [newMonthTitle, setNewMonthTitle] = useState("");
  const [newMonthNumber, setNewMonthNumber] = useState("");

  const [showAddDay, setShowAddDay] = useState(false);

  const [newDayTitle, setNewDayTitle] = useState("");
  const [newDayNumber, setNewDayNumber] = useState("");

  const [showAddVideo, setShowAddVideo] = useState(false);

  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoDetails, setNewVideoDetails] = useState("");
  const [newVideoIsFree, setNewVideoIsFree] = useState(false);

  useEffect(() => {
    setMonths([]);
    setSelectedMonthId(null);
    setDays([]);
    setSelectedDayId(null);
    setVideos([]);
    setShowAddMonth(false);
    setShowAddDay(false);
    setShowAddVideo(false);
  }, [ageGroupId]);

  useEffect(() => {
    if (!ageGroupId) return;

    const supabase = getSupabase();
    if (!supabase) return;
    const run = async () => {
      setError(null);

      const res = await supabase
        .from("months")
        .select("id,age_group_id,title,month_number,sort_order,created_at")
        .eq("age_group_id", ageGroupId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (res.error) {
        setError(res.error.message);
        setMonths([]);
        return;
      }

      const list = (res.data as MonthRow[]) ?? [];
      setMonths(list);
      setSelectedMonthId((prev) => {
        if (prev && list.some((m) => m.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    };

    void run().catch((err) => {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    });
  }, [ageGroupId, reloadKey]);

  useEffect(() => {
    if (!selectedMonthId) {
      setDays([]);
      setSelectedDayId(null);
      setShowAddDay(false);
      setNewDayTitle("");
      setNewDayNumber("");
      setShowAddVideo(false);
      setNewVideoTitle("");
      setNewVideoUrl("");
      setNewVideoDetails("");
      setNewVideoIsFree(false);
      return;
    }

    setShowAddDay(false);
    setNewDayTitle("");
    setNewDayNumber("");
    setShowAddVideo(false);
    setNewVideoTitle("");
    setNewVideoUrl("");
    setNewVideoDetails("");
    setNewVideoIsFree(false);

    const supabase = getSupabase();
    if (!supabase) return;
    const run = async () => {
      setError(null);

      const res = await supabase
        .from("days")
        .select("id,month_id,title,day_number,sort_order,created_at")
        .eq("month_id", selectedMonthId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (res.error) {
        setError(res.error.message);
        setDays([]);
        return;
      }

      const list = (res.data as DayRow[]) ?? [];
      setDays(list);
      setSelectedDayId((prev) => {
        if (prev && list.some((d) => d.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    };

    void run().catch((err) => {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    });
  }, [selectedMonthId, reloadKey]);

  useEffect(() => {
    setShowAddVideo(false);
    setNewVideoTitle("");
    setNewVideoUrl("");
    setNewVideoDetails("");
    setNewVideoIsFree(false);
  }, [selectedDayId]);

  useEffect(() => {
    if (!selectedDayId) {
      setVideos([]);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;
    const run = async () => {
      setError(null);

      const res = await supabase
        .from("videos")
        .select(
          "id,day_id,title,video_url,thumbnail_url,details,duration_sec,is_free_preview,sort_order,created_at",
        )
        .eq("day_id", selectedDayId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (res.error) {
        setError(res.error.message);
        setVideos([]);
        return;
      }

      setVideos((res.data as VideoRow[]) ?? []);
    };

    void run().catch((err) => {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    });
  }, [selectedDayId, reloadKey]);

  const selectedMonth = useMemo(
    () => months.find((m) => m.id === selectedMonthId) ?? null,
    [months, selectedMonthId],
  );

  const selectedDay = useMemo(() => days.find((d) => d.id === selectedDayId) ?? null, [days, selectedDayId]);

  useEffect(() => {
    if (!onMonthNumberChange) return;
    const m = months.find((it) => it.id === selectedMonthId) ?? null;
    if (!m) return;
    if (m.month_number === null || m.month_number === undefined) return;
    onMonthNumberChange(String(m.month_number));
  }, [months, onMonthNumberChange, selectedMonthId]);

  const addMonth = async () => {
    if (!ageGroupId) return;
    const title = newMonthTitle.trim() || null;
    const monthNumber = toNumOrNull(newMonthNumber);

    const nextSort = Math.max(-1, ...months.map((m) => m.sort_order ?? 0)) + 1;

    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase.from("months").insert({
      age_group_id: ageGroupId,
      title,
      month_number: monthNumber,
      sort_order: nextSort,
    });

    if (res.error) setError(res.error.message);
    else {
      setNewMonthTitle("");
      setNewMonthNumber("");
      setShowAddMonth(false);
      setReloadKey((k) => k + 1);
    }

    setSaving(false);
  };

  const updateMonth = async (monthId: string, title: string, monthNumber: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase
      .from("months")
      .update({ title: title.trim() || null, month_number: toNumOrNull(monthNumber) })
      .eq("id", monthId);

    if (res.error) setError(res.error.message);
    else setReloadKey((k) => k + 1);

    setSaving(false);
  };

  const deleteMonth = async (monthId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase.from("months").delete().eq("id", monthId);

    if (res.error) setError(res.error.message);
    else setReloadKey((k) => k + 1);

    setSaving(false);
  };

  const addDay = async () => {
    if (!selectedMonthId) return;

    const title = newDayTitle.trim() || null;
    const dayNumber = toNumOrNull(newDayNumber);
    const nextSort = Math.max(-1, ...days.map((d) => d.sort_order ?? 0)) + 1;

    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase.from("days").insert({
      month_id: selectedMonthId,
      title,
      day_number: dayNumber,
      sort_order: nextSort,
    });

    if (res.error) setError(res.error.message);
    else {
      setNewDayTitle("");
      setNewDayNumber("");
      setShowAddDay(false);
      setReloadKey((k) => k + 1);
    }

    setSaving(false);
  };

  const updateDay = async (dayId: string, title: string, dayNumber: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase
      .from("days")
      .update({ title: title.trim() || null, day_number: toNumOrNull(dayNumber) })
      .eq("id", dayId);

    if (res.error) setError(res.error.message);
    else setReloadKey((k) => k + 1);

    setSaving(false);
  };

  const deleteDay = async (dayId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase.from("days").delete().eq("id", dayId);

    if (res.error) setError(res.error.message);
    else setReloadKey((k) => k + 1);

    setSaving(false);
  };

  const addVideo = async () => {
    if (!selectedDayId) return;

    const title = newVideoTitle.trim() || null;
    const videoUrl = newVideoUrl.trim() || null;
    const details = newVideoDetails.trim() || null;
    const nextSort = Math.max(-1, ...videos.map((v) => v.sort_order ?? 0)) + 1;

    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase.from("videos").insert({
      day_id: selectedDayId,
      title,
      video_url: videoUrl,
      details,
      is_free_preview: newVideoIsFree,
      sort_order: nextSort,
    });

    if (res.error) setError(res.error.message);
    else {
      setNewVideoTitle("");
      setNewVideoUrl("");
      setNewVideoDetails("");
      setNewVideoIsFree(false);
      setShowAddVideo(false);
      setReloadKey((k) => k + 1);
    }

    setSaving(false);
  };

  const updateVideo = async (videoId: string, title: string, url: string, isFree: boolean, details: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase
      .from("videos")
      .update({
        title: title.trim() || null,
        video_url: url.trim() || null,
        details: details.trim() || null,
        is_free_preview: isFree,
      })
      .eq("id", videoId);

    if (res.error) setError(res.error.message);
    else setReloadKey((k) => k + 1);

    setSaving(false);
  };

  const deleteVideo = async (videoId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase.from("videos").delete().eq("id", videoId);

    if (res.error) setError(res.error.message);
    else setReloadKey((k) => k + 1);

    setSaving(false);
  };

  if (!ageGroupId) {
    return (
      <AdminCard>
        <div className="text-lg font-semibold text-slate-900">الشهور والأيام والفيديوهات</div>
        <div className="mt-2 text-sm text-slate-600">اختر مجموعة عمر أولاً.</div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-4">
      <AdminCard>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">الشهور</div>
            <div className="mt-2 text-sm text-slate-600">أضف شهر للمجموعة المختارة ثم أضف أيام وفيديوهات.</div>
          </div>
          {error ? <div className="text-xs text-rose-700">{error}</div> : null}
        </div>

        <div className="mt-5">
          {!showAddMonth ? (
            <button
              type="button"
              onClick={() => setShowAddMonth(true)}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
            >
              إضافة شهر
            </button>
          ) : (
            <div className="grid gap-3 md:grid-cols-[1fr_140px_220px]">
              <input
                value={newMonthTitle}
                onChange={(e) => setNewMonthTitle(e.target.value)}
                placeholder="عنوان الشهر"
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              />
              <input
                value={newMonthNumber}
                onChange={(e) => setNewMonthNumber(e.target.value)}
                placeholder="رقم الشهر"
                inputMode="numeric"
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addMonth}
                  disabled={saving}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewMonthTitle("");
                    setNewMonthNumber("");
                    setShowAddMonth(false);
                  }}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5">
          {months.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600 border border-slate-200">مفيش شهور لسه.</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm font-medium text-slate-700">اختيار الشهر</div>
                <select
                  value={selectedMonthId ?? ""}
                  onChange={(e) => setSelectedMonthId(e.target.value || null)}
                  disabled={saving}
                  className="h-10 min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
                >
                  {months.map((m) => {
                    const label = m.title ? m.title : m.month_number ? `شهر ${m.month_number}` : "شهر";
                    return (
                      <option key={m.id} value={m.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedMonth ? (
                <div className="mt-4">
                  <MonthRowItem
                    month={selectedMonth}
                    active={true}
                    onSelect={() => setSelectedMonthId(selectedMonth.id)}
                    onUpdate={(title, num) => updateMonth(selectedMonth.id, title, num)}
                    onDelete={() => deleteMonth(selectedMonth.id)}
                    disabled={saving}
                  />
                </div>
              ) : null}

              {selectedMonth ? (
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-slate-900">الأيام</div>
                        <div className="mt-1 text-sm text-slate-600">{`داخل: ${selectedMonth.title ?? "—"}`}</div>
                      </div>
                      <div className="text-xs text-slate-500">{selectedMonth.month_number ? `#${selectedMonth.month_number}` : ""}</div>
                    </div>

                    <div className="mt-4">
                      {!showAddDay ? (
                        <button
                          type="button"
                          onClick={() => setShowAddDay(true)}
                          disabled={saving || !selectedMonthId}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                        >
                          إضافة يوم
                        </button>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="grid gap-3 md:grid-cols-[1fr_140px]">
                            <input
                              value={newDayTitle}
                              onChange={(e) => setNewDayTitle(e.target.value)}
                              placeholder="عنوان اليوم"
                              disabled={!selectedMonthId}
                              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
                            />
                            <input
                              value={newDayNumber}
                              onChange={(e) => setNewDayNumber(e.target.value)}
                              placeholder="رقم اليوم"
                              inputMode="numeric"
                              disabled={!selectedMonthId}
                              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
                            />
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={addDay}
                              disabled={saving || !selectedMonthId}
                              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                            >
                              حفظ
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewDayTitle("");
                                setNewDayNumber("");
                                setShowAddDay(false);
                              }}
                              disabled={saving}
                              className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      {days.length === 0 ? (
                        <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600 border border-slate-200">مفيش أيام لسه.</div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-xs font-medium text-slate-700">اختيار اليوم</div>
                              <select
                                value={selectedDayId ?? ""}
                                onChange={(e) => setSelectedDayId(e.target.value || null)}
                                disabled={saving || days.length === 0}
                                className="h-10 min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
                              >
                                <option value="">اختر يوم…</option>
                                {days.map((d, idx) => (
                                  <option key={d.id} value={d.id}>
                                    {`#${d.day_number ?? idx + 1} — ${d.title ?? "يوم"}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="text-xs text-slate-500">{days.length} يوم</div>
                          </div>

                          {selectedDay ? (
                            <div className="mt-3">
                              <DayRowItem
                                key={selectedDay.id}
                                day={selectedDay}
                                active={true}
                                onSelect={() => setSelectedDayId(selectedDay.id)}
                                onUpdate={(title, num) => updateDay(selectedDay.id, title, num)}
                                onDelete={() => deleteDay(selectedDay.id)}
                                disabled={saving}
                              />
                            </div>
                          ) : (
                            <div className="mt-3 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600 border border-slate-200">
                              اختر يوم علشان تعدّل بياناته.
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-slate-900">الفيديوهات</div>
                        <div className="mt-1 text-sm text-slate-600">
                          {selectedDay ? `اليوم الحالي: ${selectedDay.title ?? "—"}` : "اختر يوم أولاً"}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">{selectedDay?.day_number ? `#${selectedDay.day_number}` : ""}</div>
                    </div>

                    {!selectedDayId ? (
                      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600 border border-slate-200">
                        اختر يوم علشان تضيف/تعدّل فيديوهات.
                      </div>
                    ) : (
                      <>
                        <div className="mt-4">
                          {!showAddVideo ? (
                            <button
                              type="button"
                              onClick={() => setShowAddVideo(true)}
                              disabled={saving || !selectedDayId}
                              className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                            >
                              إضافة فيديو
                            </button>
                          ) : (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="grid gap-3">
                                <input
                                  value={newVideoTitle}
                                  onChange={(e) => setNewVideoTitle(e.target.value)}
                                  placeholder="عنوان الفيديو"
                                  disabled={!selectedDayId}
                                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
                                />
                                <input
                                  value={newVideoUrl}
                                  onChange={(e) => setNewVideoUrl(e.target.value)}
                                  placeholder="رابط الفيديو"
                                  disabled={!selectedDayId}
                                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
                                />
                                <textarea
                                  value={newVideoDetails}
                                  onChange={(e) => setNewVideoDetails(e.target.value)}
                                  placeholder="تفاصيل الفيديو (اختياري)"
                                  rows={3}
                                  disabled={!selectedDayId}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
                                />

                                <label className="inline-flex items-center gap-3 text-sm text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={newVideoIsFree}
                                    onChange={(e) => setNewVideoIsFree(e.target.checked)}
                                    disabled={!selectedDayId}
                                    className="h-4 w-4 accent-violet-500"
                                  />
                                  معاينة مجانية
                                </label>

                                <div className="mt-1 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={addVideo}
                                    disabled={saving || !selectedDayId}
                                    className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                                  >
                                    حفظ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewVideoTitle("");
                                      setNewVideoUrl("");
                                      setNewVideoDetails("");
                                      setNewVideoIsFree(false);
                                      setShowAddVideo(false);
                                    }}
                                    disabled={saving}
                                    className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 grid gap-3">
                          {videos.map((v) => (
                            <VideoRowItem
                              key={v.id}
                              video={v}
                              onUpdate={(title, url, isFree, details) => updateVideo(v.id, title, url, isFree, details)}
                              onDelete={() => deleteVideo(v.id)}
                              disabled={saving}
                            />
                          ))}
                          {selectedDayId && videos.length === 0 ? (
                            <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600 border border-slate-200">مفيش فيديوهات لسه.</div>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </AdminCard>
    </div>
  );
}

function MonthRowItem({
  month,
  active,
  onSelect,
  onUpdate,
  onDelete,
  disabled,
}: {
  month: MonthRow;
  active: boolean;
  onSelect: () => void;
  onUpdate: (title: string, monthNumber: string) => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [title, setTitle] = useState(month.title ?? "");
  const [num, setNum] = useState(month.month_number === null || month.month_number === undefined ? "" : String(month.month_number));
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setTitle(month.title ?? "");
    setNum(month.month_number === null || month.month_number === undefined ? "" : String(month.month_number));
    setEditing(false);
    setConfirmDelete(false);
  }, [month.id, month.month_number, month.title]);

  return (
    <div
      className={
        "rounded-xl border p-4 " +
        (active ? "bg-violet-50 border-violet-200" : "bg-white border-slate-200")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onSelect} disabled={disabled} className="min-w-0 text-right">
          <div className="truncate text-sm font-semibold text-slate-900">{month.title ?? "شهر"}</div>
          <div className="mt-1 text-xs text-slate-500">الشهر #{month.month_number ?? "—"}</div>
        </button>

        <div className="flex items-center gap-2">
          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setConfirmDelete(false);
                }}
                disabled={disabled}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-rose-600 px-3 text-xs font-medium text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                تأكيد
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={disabled}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                إلغاء
              </button>
            </>
          ) : (
            <>
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  disabled={disabled}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-medium text-slate-900 border border-slate-200 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                >
                  تعديل
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate(title, num);
                      setEditing(false);
                    }}
                    disabled={disabled}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-3 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTitle(month.title ?? "");
                      setNum(month.month_number === null || month.month_number === undefined ? "" : String(month.month_number));
                      setEditing(false);
                    }}
                    disabled={disabled}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setConfirmDelete(true);
                }}
                disabled={disabled}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-medium text-rose-700 border border-rose-200 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                حذف
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_140px]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان الشهر"
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
          <input
            value={num}
            onChange={(e) => setNum(e.target.value)}
            placeholder="رقم الشهر"
            inputMode="numeric"
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
        </div>
      ) : null}
    </div>
  );
}

function DayRowItem({
  day,
  active,
  onSelect,
  onUpdate,
  onDelete,
  disabled,
}: {
  day: DayRow;
  active: boolean;
  onSelect: () => void;
  onUpdate: (title: string, dayNumber: string) => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [title, setTitle] = useState(day.title ?? "");
  const [num, setNum] = useState(day.day_number === null || day.day_number === undefined ? "" : String(day.day_number));
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setTitle(day.title ?? "");
    setNum(day.day_number === null || day.day_number === undefined ? "" : String(day.day_number));
    setEditing(false);
    setConfirmDelete(false);
  }, [day.day_number, day.id, day.title]);

  return (
    <div
      className={
        "rounded-xl border p-4 " +
        (active ? "bg-violet-50 border-violet-200" : "bg-white border-slate-200")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onSelect} disabled={disabled} className="min-w-0 text-right">
          <div className="truncate text-sm font-semibold text-slate-900">{day.title ?? "يوم"}</div>
          <div className="mt-1 text-xs text-slate-500">اليوم #{day.day_number ?? "—"}</div>
        </button>

        <div className="flex items-center gap-2">
          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setConfirmDelete(false);
                }}
                disabled={disabled}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-rose-600 px-3 text-xs font-medium text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                تأكيد
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={disabled}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                إلغاء
              </button>
            </>
          ) : null}

          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={disabled || confirmDelete}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-medium text-slate-900 border border-slate-200 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
            >
              تعديل
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onUpdate(title, num);
                  setEditing(false);
                }}
                disabled={disabled || confirmDelete}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-3 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                حفظ
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle(day.title ?? "");
                  setNum(day.day_number === null || day.day_number === undefined ? "" : String(day.day_number));
                  setEditing(false);
                }}
                disabled={disabled || confirmDelete}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                إلغاء
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setConfirmDelete(true);
            }}
            disabled={disabled || confirmDelete}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-medium text-rose-700 border border-rose-200 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
          >
            حذف
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_140px]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان اليوم"
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
          <input
            value={num}
            onChange={(e) => setNum(e.target.value)}
            placeholder="رقم اليوم"
            inputMode="numeric"
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
        </div>
      ) : null}
    </div>
  );
}

function VideoRowItem({
  video,
  onUpdate,
  onDelete,
  disabled,
}: {
  video: VideoRow;
  onUpdate: (title: string, url: string, isFree: boolean, details: string) => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [title, setTitle] = useState(video.title ?? "");
  const [url, setUrl] = useState(video.video_url ?? "");
  const [details, setDetails] = useState(video.details ?? "");
  const [isFree, setIsFree] = useState(Boolean(video.is_free_preview));
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setTitle(video.title ?? "");
    setUrl(video.video_url ?? "");
    setDetails(video.details ?? "");
    setIsFree(Boolean(video.is_free_preview));
    setEditing(false);
    setConfirmDelete(false);
  }, [video.details, video.id, video.is_free_preview, video.title, video.video_url]);

  const videoUrl = (video.video_url ?? "").trim();
  const canOpen = Boolean(videoUrl);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 text-right">
          <div className="truncate text-sm font-semibold text-slate-900">{video.title ?? "فيديو"}</div>
          <div className="mt-1 truncate text-xs text-slate-500" dir="ltr">
            {video.video_url ?? ""}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {video.is_free_preview ? (
            <div className="inline-flex h-8 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700">
              معاينة مجانية
            </div>
          ) : null}

          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setConfirmDelete(false);
                }}
                disabled={disabled}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-rose-600 px-3 text-xs font-medium text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                تأكيد
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={disabled}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                إلغاء
              </button>
            </>
          ) : null}

          {canOpen && !confirmDelete ? (
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              فتح الرابط
            </a>
          ) : null}

          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={disabled || confirmDelete}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-medium text-slate-900 border border-slate-200 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
            >
              تعديل
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onUpdate(title, url, isFree, details);
                  setEditing(false);
                }}
                disabled={disabled || confirmDelete}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-violet-600 px-3 text-xs font-medium text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                حفظ
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle(video.title ?? "");
                  setUrl(video.video_url ?? "");
                  setDetails(video.details ?? "");
                  setIsFree(Boolean(video.is_free_preview));
                  setEditing(false);
                }}
                disabled={disabled || confirmDelete}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                إلغاء
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setConfirmDelete(true);
            }}
            disabled={disabled || confirmDelete}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-medium text-rose-700 border border-rose-200 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
          >
            حذف
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان الفيديو"
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="رابط الفيديو"
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="تفاصيل الفيديو (اختياري)"
            rows={3}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />

          <label className="mt-3 inline-flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="h-4 w-4 accent-violet-500"
            />
            معاينة مجانية
          </label>
        </div>
      ) : null}
    </div>
  );
}
