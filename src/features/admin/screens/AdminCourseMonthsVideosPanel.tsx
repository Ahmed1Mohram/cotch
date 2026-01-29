"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

import { AdminCard } from "@/features/admin/ui/AdminCard";

type MonthRow = {
  id: string;
  age_group_id: string;
  package_id?: string | null;
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

function safeFileName(name: string) {
  const base = name.trim().toLowerCase();
  return base.replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, "").slice(0, 80) || "file";
}

function randomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function AdminCourseMonthsVideosPanel({
  ageGroupId,
  packageId,
  onMonthNumberChange,
}: {
  ageGroupId: string | null;
  packageId?: string | null;
  onMonthNumberChange?: (monthNumber: string) => void;
}) {
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbUploading, setThumbUploading] = useState(false);

  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  const getSupabase = () => {
    if (supabaseRef.current) return supabaseRef.current;
    try {
      supabaseRef.current = createSupabaseBrowserClient();
      return supabaseRef.current;
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
  const [newVideoThumbnailUrl, setNewVideoThumbnailUrl] = useState<string>("");

  const newVideoThumbInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMonths([]);
    setSelectedMonthId(null);
    setDays([]);
    setSelectedDayId(null);
    setVideos([]);
    setShowAddMonth(false);
    setShowAddDay(false);
    setShowAddVideo(false);
  }, [ageGroupId, packageId]);

  useEffect(() => {
    if (!ageGroupId) return;

    const effectivePackageId = packageId?.trim() ? packageId.trim() : null;

    const supabase = getSupabase();
    if (!supabase) return;
    const run = async () => {
      setError(null);

      const res = effectivePackageId
        ? await supabase
            .from("months")
            .select("id,age_group_id,package_id,title,month_number,sort_order,created_at")
            .eq("age_group_id", ageGroupId)
            .eq("package_id", effectivePackageId)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true })
        : await supabase
            .from("months")
            .select("id,age_group_id,package_id,title,month_number,sort_order,created_at")
            .eq("age_group_id", ageGroupId)
            .is("package_id", null)
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
  }, [ageGroupId, packageId, reloadKey]);

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
    setNewVideoThumbnailUrl("");
  }, [selectedDayId]);

  const uploadVideoThumbnail = async (file: File, prefix: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const sessionRes = await supabase.auth.getSession();
    const session = sessionRes.data.session;
    if (sessionRes.error || !session) {
      setError("لازم تكون مسجّل دخول قبل رفع الصورة. اعمل تسجيل خروج/دخول وجرب تاني.");
      return null;
    }

    const ext = safeFileName(file.name).split(".").pop() || "png";
    const path = `${prefix}/${randomId()}.${ext}`;

    setThumbUploading(true);
    setError(null);

    const up = await supabase.storage.from("video-thumbnails").upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });

    if (up.error) {
      setThumbUploading(false);
      setError(
        `رفع صورة الفيديو فشل: ${up.error.message} — أنشئ Bucket باسم video-thumbnails (Public) أو فعّل صلاحيات الرفع.`,
      );
      return null;
    }

    const pub = supabase.storage.from("video-thumbnails").getPublicUrl(path);
    const url = pub.data.publicUrl || "";
    setThumbUploading(false);
    return url || null;
  };

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
    const effectivePackageId = packageId?.trim() ? packageId.trim() : null;
    const title = newMonthTitle.trim() || null;
    const monthNumber = toNumOrNull(newMonthNumber);

    const nextSort = Math.max(-1, ...months.map((m) => m.sort_order ?? 0)) + 1;

    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase.from("months").insert({
      age_group_id: ageGroupId,
      package_id: effectivePackageId,
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
    const thumbnailUrl = newVideoThumbnailUrl.trim() || null;
    const nextSort = Math.max(-1, ...videos.map((v) => v.sort_order ?? 0)) + 1;

    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase.from("videos").insert({
      day_id: selectedDayId,
      title,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
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
      setNewVideoThumbnailUrl("");
      setShowAddVideo(false);
      setReloadKey((k) => k + 1);
    }

    setSaving(false);
  };

  const updateVideo = async (
    videoId: string,
    title: string,
    url: string,
    isFree: boolean,
    details: string,
    thumbnailUrl: string | null,
  ) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);

    const res = await supabase
      .from("videos")
      .update({
        title: title.trim() || null,
        video_url: url.trim() || null,
        thumbnail_url: thumbnailUrl && thumbnailUrl.trim() ? thumbnailUrl.trim() : null,
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
        <div className="text-xl font-semibold text-slate-900">الشهور والأيام والفيديوهات</div>
        <div className="mt-2 text-sm leading-relaxed text-slate-700">اختر مجموعة عمر أولاً.</div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-4">
      <AdminCard>
        <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-lg sm:text-xl font-semibold text-slate-900">الشهور</div>
            <div className="mt-2 text-sm leading-relaxed text-slate-700 break-words">أضف شهر للمجموعة المختارة ثم أضف أيام وفيديوهات.</div>
          </div>
          {error ? <div className="text-sm text-rose-700 break-words">{error}</div> : null}
        </div>

        <div className="mt-3 sm:mt-5">
          {!showAddMonth ? (
            <button
              type="button"
              onClick={() => setShowAddMonth(true)}
              disabled={saving}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-base font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 sm:h-10 sm:w-auto sm:text-sm"
            >
              إضافة شهر
            </button>
          ) : (
            <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_140px_220px]">
              <input
                value={newMonthTitle}
                onChange={(e) => setNewMonthTitle(e.target.value)}
                placeholder="عنوان الشهر"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 sm:h-10 sm:text-sm"
              />
              <input
                value={newMonthNumber}
                onChange={(e) => setNewMonthNumber(e.target.value)}
                placeholder="رقم الشهر"
                inputMode="numeric"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 sm:h-10 sm:text-sm"
              />
              <div className="flex flex-col gap-1.5 sm:gap-2 sm:flex-row sm:items-center col-span-1 sm:col-span-2 md:col-span-1">
                <button
                  type="button"
                  onClick={addMonth}
                  disabled={saving}
                  className="inline-flex h-11 w-full flex-1 items-center justify-center rounded-2xl bg-slate-900 px-5 text-base font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 sm:h-10 sm:w-auto sm:text-sm"
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
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-white px-4 text-base font-medium text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 sm:h-10 sm:w-auto sm:text-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 sm:mt-5">
          {months.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-3 py-3 sm:px-4 sm:py-4 text-sm leading-relaxed text-slate-700 border border-slate-200">مفيش شهور لسه.</div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 sm:gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="text-sm font-medium text-slate-700">اختيار الشهر</div>
                <select
                  value={selectedMonthId ?? ""}
                  onChange={(e) => setSelectedMonthId(e.target.value || null)}
                  disabled={saving}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100 text-right sm:h-10 sm:w-auto sm:min-w-[220px] sm:text-sm"
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
                <div className="mt-2 sm:mt-4">
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
                <div className="mt-3 sm:mt-6 grid gap-3 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-2 sm:p-3 md:p-4 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-3 md:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold text-slate-900">الأيام</div>
                        <div className="mt-1 text-sm leading-relaxed text-slate-700 break-words">{`داخل: ${selectedMonth.title ?? "—"}`}</div>
                      </div>
                      <div className="text-sm text-slate-500 sm:text-xs shrink-0">{selectedMonth.month_number ? `#${selectedMonth.month_number}` : ""}</div>
                    </div>

                    <div className="mt-2 sm:mt-4">
                      {!showAddDay ? (
                        <button
                          type="button"
                          onClick={() => setShowAddDay(true)}
                          disabled={saving || !selectedMonthId}
                          className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-base font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 sm:h-10 sm:w-auto sm:text-sm"
                        >
                          إضافة يوم
                        </button>
                      ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:p-3 md:p-4">
                          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_140px]">
                            <input
                              value={newDayTitle}
                              onChange={(e) => setNewDayTitle(e.target.value)}
                              placeholder="عنوان اليوم"
                              disabled={!selectedMonthId}
                              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100 sm:h-10 sm:text-sm"
                            />
                            <input
                              value={newDayNumber}
                              onChange={(e) => setNewDayNumber(e.target.value)}
                              placeholder="رقم اليوم"
                              inputMode="numeric"
                              disabled={!selectedMonthId}
                              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100 sm:h-10 sm:text-sm"
                            />
                          </div>

                          <div className="mt-2 sm:mt-3 flex flex-col gap-1.5 sm:gap-2 sm:flex-row sm:items-center">
                            <button
                              type="button"
                              onClick={addDay}
                              disabled={saving || !selectedMonthId}
                              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-base font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 sm:h-10 sm:w-auto sm:text-sm"
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
                              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-white px-4 text-base font-medium text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 sm:h-10 sm:w-auto sm:text-sm"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 sm:mt-4">
                      {days.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 px-3 py-3 sm:px-4 sm:py-4 text-sm leading-relaxed text-slate-700 border border-slate-200">مفيش أيام لسه.</div>
                      ) : (
                        <>
                          <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm font-medium text-slate-700">قائمة الأيام ({days.length})</div>
                          </div>
                          
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {days.map((d, idx) => {
                              const isSelected = d.id === selectedDayId;
                              return (
                                <DayRowItem
                                  key={d.id}
                                  day={d}
                                  active={isSelected}
                                  onSelect={() => setSelectedDayId(d.id)}
                                  onUpdate={(title, num) => updateDay(d.id, title, num)}
                                  onDelete={() => deleteDay(d.id)}
                                  disabled={saving}
                                />
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-2 sm:p-3 md:p-4 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-3 md:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold text-slate-900">الفيديوهات</div>
                        <div className="mt-1 text-sm leading-relaxed text-slate-700 break-words">
                          {selectedDay ? `اليوم الحالي: ${selectedDay.title ?? "—"}` : "اختر يوم أولاً"}
                        </div>
                      </div>
                      <div className="text-sm text-slate-500 sm:text-xs shrink-0">{selectedDay?.day_number ? `#${selectedDay.day_number}` : ""}</div>
                    </div>

                    {!selectedDayId ? (
                      <div className="mt-2 sm:mt-4 rounded-2xl bg-slate-50 px-3 py-3 sm:px-4 sm:py-4 text-sm leading-relaxed text-slate-700 border border-slate-200">
                        اختر يوم علشان تضيف/تعدّل فيديوهات.
                      </div>
                    ) : (
                      <>
                        <div className="mt-2 sm:mt-4">
                          {!showAddVideo ? (
                            <button
                              type="button"
                              onClick={() => setShowAddVideo(true)}
                              disabled={saving || thumbUploading || !selectedDayId}
                              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-base font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 sm:h-10 sm:w-auto sm:text-sm"
                            >
                              إضافة فيديو
                            </button>
                          ) : (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:p-3 md:p-4">
                              <div className="grid gap-2 sm:gap-3">
                                <input
                                  value={newVideoTitle}
                                  onChange={(e) => setNewVideoTitle(e.target.value)}
                                  placeholder="عنوان الفيديو"
                                  disabled={!selectedDayId}
                                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100 sm:h-10 sm:text-sm"
                                />
                                <input
                                  value={newVideoUrl}
                                  onChange={(e) => setNewVideoUrl(e.target.value)}
                                  placeholder="رابط الفيديو"
                                  disabled={!selectedDayId}
                                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100 sm:h-10 sm:text-sm"
                                />

                                <div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2">
                                  <div>
                                    <div className="text-sm font-medium text-slate-700">صورة الفيديو (Thumbnail)</div>
                                    <input
                                      ref={newVideoThumbInputRef}
                                      type="file"
                                      accept="image/*"
                                      disabled={!selectedDayId || saving || thumbUploading}
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        if (!file) return;
                                        const url = await uploadVideoThumbnail(file, `draft/${selectedDayId}`);
                                        if (url) setNewVideoThumbnailUrl(url);
                                      }}
                                      className="hidden"
                                    />

                                    <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                                      <button
                                        type="button"
                                        onClick={() => newVideoThumbInputRef.current?.click()}
                                        disabled={!selectedDayId || saving || thumbUploading}
                                        className="inline-flex h-9 items-center justify-center rounded-2xl bg-white px-4 text-xs font-semibold text-slate-700 border border-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
                                      >
                                        اختيار صورة من المعرض
                                      </button>
                                      {newVideoThumbnailUrl ? (
                                        <button
                                          type="button"
                                          onClick={() => setNewVideoThumbnailUrl("")}
                                          disabled={saving || thumbUploading}
                                          className="inline-flex h-9 items-center justify-center rounded-2xl bg-white px-4 text-xs font-semibold text-slate-700 border border-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
                                        >
                                          مسح الصورة
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="flex items-start justify-end">
                                    {newVideoThumbnailUrl ? (
                                      <img
                                        src={newVideoThumbnailUrl}
                                        alt="thumbnail"
                                        className="h-24 w-40 rounded-2xl border border-slate-200 object-cover"
                                      />
                                    ) : (
                                      <div className="grid h-24 w-40 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs text-slate-500">
                                        لا يوجد
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <textarea
                                  value={newVideoDetails}
                                  onChange={(e) => setNewVideoDetails(e.target.value)}
                                  placeholder="تفاصيل الفيديو (اختياري)"
                                  rows={3}
                                  disabled={!selectedDayId}
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100 sm:text-sm"
                                />

                                <label className="inline-flex items-center gap-3 text-sm text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={newVideoIsFree}
                                    onChange={(e) => setNewVideoIsFree(e.target.checked)}
                                    disabled={!selectedDayId}
                                    className="h-4 w-4 accent-slate-700"
                                  />
                                  معاينة مجانية
                                </label>

                                <div className="mt-1 flex flex-col gap-1.5 sm:gap-2 sm:flex-row sm:items-center">
                                  <button
                                    type="button"
                                    onClick={addVideo}
                                    disabled={saving || thumbUploading || !selectedDayId}
                                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-base font-medium text-white shadow-sm transition enabled:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 sm:h-10 sm:w-auto sm:text-sm"
                                  >
                                    حفظ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewVideoTitle("");
                                      setNewVideoUrl("");
                                      setNewVideoThumbnailUrl("");
                                      setNewVideoDetails("");
                                      setNewVideoIsFree(false);
                                      setShowAddVideo(false);
                                    }}
                                    disabled={saving || thumbUploading}
                                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-white px-4 text-base font-medium text-slate-700 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 sm:h-10 sm:w-auto sm:text-sm"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {selectedDayId && videos.length === 0 ? (
                          <div className="mt-2 sm:mt-4 rounded-2xl bg-slate-50 px-3 py-3 sm:px-4 sm:py-4 text-sm leading-relaxed text-slate-700 border border-slate-200">مفيش فيديوهات لسه.</div>
                        ) : videos.length > 0 ? (
                          <>
                            <div className="mt-3 mb-2 flex items-center justify-between">
                              <div className="text-sm font-medium text-slate-700">قائمة الفيديوهات ({videos.length})</div>
                            </div>
                            <div className="mt-2 sm:mt-4 space-y-2 max-h-[500px] overflow-y-auto pr-1">
                              {videos.map((v) => (
                                <VideoRowItem
                                  key={v.id}
                                  video={v}
                                  onUpdate={(title, url, isFree, details, thumbnailUrl) =>
                                    updateVideo(v.id, title, url, isFree, details, thumbnailUrl)
                                  }
                                  onDelete={() => deleteVideo(v.id)}
                                  disabled={saving}
                                />
                              ))}
                            </div>
                          </>
                        ) : null}
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
        "rounded-2xl border p-3 sm:p-4 " +
        (active ? "bg-slate-50 border-slate-300" : "bg-white border-slate-200")
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <button type="button" onClick={onSelect} disabled={disabled} className="min-w-0 text-right flex-1">
          <div className="truncate text-base font-semibold text-slate-900">{month.title ?? "شهر"}</div>
          <div className="mt-1 text-sm text-slate-500">الشهر #{month.month_number ?? "—"}</div>
        </button>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setConfirmDelete(false);
                }}
                disabled={disabled}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-600 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                تأكيد
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={disabled}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-3 text-sm font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
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
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-3 text-sm font-medium text-slate-900 border border-slate-200 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
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
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
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
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-3 text-sm font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
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
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-3 text-sm font-medium text-rose-700 border border-rose-200 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                حذف
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-2 sm:mt-3 grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_140px]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان الشهر"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 sm:h-10 sm:text-sm"
          />
          <input
            value={num}
            onChange={(e) => setNum(e.target.value)}
            placeholder="رقم الشهر"
            inputMode="numeric"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 sm:h-10 sm:text-sm"
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
        "rounded-2xl border p-2.5 sm:p-3 md:p-4 transition-colors " +
        (active ? "bg-slate-50 border-slate-300 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50/50")
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        <button 
          type="button" 
          onClick={onSelect} 
          disabled={disabled} 
          className="min-w-0 text-right flex-1 text-left sm:text-right"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs sm:text-sm font-bold text-slate-700">
              {day.day_number ?? "—"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm sm:text-base font-semibold text-slate-900">{day.title ?? "يوم"}</div>
              <div className="mt-0.5 text-xs sm:text-sm text-slate-500">اليوم #{day.day_number ?? "—"}</div>
            </div>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setConfirmDelete(false);
                }}
                disabled={disabled}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-600 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                تأكيد
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={disabled}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-3 text-sm font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
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
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-3 text-sm font-medium text-slate-900 border border-slate-200 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
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
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
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
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-3 text-sm font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
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
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-3 text-sm font-medium text-rose-700 border border-rose-200 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
          >
            حذف
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mt-2 sm:mt-3 grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_140px]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان اليوم"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 sm:h-10 sm:text-sm"
          />
          <input
            value={num}
            onChange={(e) => setNum(e.target.value)}
            placeholder="رقم اليوم"
            inputMode="numeric"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 sm:h-10 sm:text-sm"
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
  onUpdate: (title: string, url: string, isFree: boolean, details: string, thumbnailUrl: string | null) => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [title, setTitle] = useState(video.title ?? "");
  const [url, setUrl] = useState(video.video_url ?? "");
  const [details, setDetails] = useState(video.details ?? "");
  const [thumbUrl, setThumbUrl] = useState(video.thumbnail_url ?? "");
  const [thumbBusy, setThumbBusy] = useState(false);
  const [thumbError, setThumbError] = useState<string | null>(null);
  const [isFree, setIsFree] = useState(Boolean(video.is_free_preview));
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const thumbInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTitle(video.title ?? "");
    setUrl(video.video_url ?? "");
    setDetails(video.details ?? "");
    setThumbUrl(video.thumbnail_url ?? "");
    setThumbError(null);
    setIsFree(Boolean(video.is_free_preview));
    setEditing(false);
    setConfirmDelete(false);
  }, [video.details, video.id, video.is_free_preview, video.thumbnail_url, video.title, video.video_url]);

  const videoUrl = (video.video_url ?? "").trim();
  const canOpen = Boolean(videoUrl);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-3 md:p-4 hover:bg-slate-50/50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5 sm:gap-3">
        <div className="min-w-0 text-right flex-1">
          <div className="flex items-start gap-2 sm:gap-3">
            {video.thumbnail_url ? (
              <div className="flex-shrink-0">
                <img
                  src={video.thumbnail_url}
                  alt="thumbnail"
                  className="h-16 w-24 sm:h-20 sm:w-36 rounded-xl border border-slate-200 object-cover"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 h-16 w-24 sm:h-20 sm:w-36 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                <span className="text-xs text-slate-400">لا يوجد</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm sm:text-base font-semibold text-slate-900">{video.title ?? "فيديو"}</div>
              <div className="mt-1 truncate text-xs sm:text-sm text-slate-500 break-all" dir="ltr">
                {video.video_url ?? ""}
              </div>
              {video.is_free_preview ? (
                <div className="mt-1.5 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-emerald-700">
                  معاينة مجانية
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 justify-end">

          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setConfirmDelete(false);
                }}
                disabled={disabled}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-600 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                تأكيد
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={disabled}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-3 text-sm font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
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
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-3 text-sm font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              فتح الرابط
            </a>
          ) : null}

          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={disabled || confirmDelete}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-3 text-sm font-medium text-slate-900 border border-slate-200 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
            >
              تعديل
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onUpdate(title, url, isFree, details, thumbUrl.trim() ? thumbUrl.trim() : null);
                  setEditing(false);
                }}
                disabled={disabled || confirmDelete}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
              >
                حفظ
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle(video.title ?? "");
                  setUrl(video.video_url ?? "");
                  setDetails(video.details ?? "");
                  setThumbUrl(video.thumbnail_url ?? "");
                  setThumbError(null);
                  setIsFree(Boolean(video.is_free_preview));
                  setEditing(false);
                }}
                disabled={disabled || confirmDelete}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-3 text-sm font-medium text-slate-700 border border-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
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
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-3 text-sm font-medium text-rose-700 border border-rose-200 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
          >
            حذف
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mt-2 sm:mt-4">
          <div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان الفيديو"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 sm:h-10 sm:text-sm"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="رابط الفيديو"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 sm:h-10 sm:text-sm"
            />
          </div>

          <div className="mt-2 sm:mt-4 grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-slate-700">صورة الفيديو (Thumbnail)</div>
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                disabled={disabled || thumbBusy}
                onChange={async (e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) return;
                  setThumbError(null);
                  setThumbBusy(true);

                  try {
                    const supabase = createSupabaseBrowserClient();
                    const ext = safeFileName(file.name).split(".").pop() || "png";
                    const path = `videos/${video.id}/${randomId()}.${ext}`;
                    const up = await supabase.storage.from("video-thumbnails").upload(path, file, {
                      upsert: true,
                      contentType: file.type || undefined,
                    });
                    if (up.error) throw new Error(up.error.message);
                    const pub = supabase.storage.from("video-thumbnails").getPublicUrl(path);
                    const url = pub.data.publicUrl;
                    setThumbUrl(url || "");
                  } catch (err) {
                    setThumbError(err instanceof Error ? err.message : "فشل رفع الصورة");
                  }

                  setThumbBusy(false);
                }}
                className="hidden"
              />

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  disabled={disabled || thumbBusy}
                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-white px-4 text-xs font-semibold text-slate-700 border border-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  اختيار صورة من المعرض
                </button>
                <button
                  type="button"
                  onClick={() => setThumbUrl("")}
                  disabled={disabled || thumbBusy}
                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-white px-4 text-xs font-semibold text-slate-700 border border-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  مسح الصورة
                </button>
                {thumbBusy ? <div className="text-xs text-slate-500">رفع...</div> : null}
              </div>

              {thumbError ? <div className="mt-2 text-xs text-rose-700">{thumbError}</div> : null}
            </div>

            <div className="flex items-start justify-end">
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt="thumbnail"
                  className="h-24 w-40 rounded-2xl border border-slate-200 object-cover"
                />
              ) : (
                <div className="grid h-24 w-40 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs text-slate-500">
                  لا يوجد
                </div>
              )}
            </div>
          </div>

          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="تفاصيل الفيديو (اختياري)"
            rows={3}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 sm:text-sm"
          />

          <label className="mt-3 inline-flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="h-4 w-4 accent-slate-700"
            />
            معاينة مجانية
          </label>
        </div>
      ) : null}
    </div>
  );
}
