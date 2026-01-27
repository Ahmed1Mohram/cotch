"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatWidget } from "@/features/chat/ChatWidget";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type Month = {
  id: string;
  title: string | null;
  month_number: number | null;
  sort_order: number;
  created_at: string;
};

type Video = {
  id: string;
  title: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  details: string | null;
  duration_sec: number | null;
  is_free_preview: boolean;
};

type Day = {
  id: string;
  title: string | null;
  day_number: number | null;
  videos: Video[];
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

function isProbablyMp4(url: string) {
  const u = url.toLowerCase();
  return u.includes(".mp4");
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 11V8a5 5 0 0 1 10 0v3" />
      <rect x="5" y="11" width="14" height="10" rx="2" />
    </svg>
  );
}

function isHttpUrl(url: string) {
  return /^https?:\/\//i.test(url.trim());
}

function normalizeVideoUrl(rawUrl: string) {
  let url = rawUrl.trim();
  if (!url) return url;

  if (/^drive\.google\.com/i.test(url) || /^www\./i.test(url)) {
    url = `https://${url}`;
  }

  if (/drive\.google\.com/i.test(url)) {
    const m = url.match(/\/file\/d\/([^/]+)/i);
    if (m?.[1]) {
      return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
    return url.replace(/\/view(?:\?.*)?$/i, "/preview");
  }

  return url;
}

function normalizeEmbedUrl(input: string) {
  const raw = input.trim();
  if (!raw) return raw;

  const looksLikeUrl = /^https?:\/\//i.test(raw);

  const driveFileMatch = raw.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (driveFileMatch?.[1]) {
    return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
  }

  const driveOpenMatch = raw.match(/drive\.google\.com\/open\?id=([^&]+)/i);
  if (driveOpenMatch?.[1]) {
    return `https://drive.google.com/file/d/${driveOpenMatch[1]}/preview`;
  }

  const driveUcMatch = raw.match(/drive\.google\.com\/uc\?id=([^&]+)/i);
  if (driveUcMatch?.[1]) {
    return `https://drive.google.com/file/d/${driveUcMatch[1]}/preview`;
  }

  const youtubeMatch = raw.match(
    /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
  );
  if (youtubeMatch?.[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  if (!looksLikeUrl) {
    const idOnly = raw.match(/^([A-Za-z0-9_-]{15,})(?:[/?].*)?$/);
    if (idOnly?.[1]) {
      return `https://drive.google.com/file/d/${idOnly[1]}/preview`;
    }
  }

  return raw;
}

export function ProgramCardContentViewer({
  courseId,
  courseSlug,
  courseTitle,
  hasCourseAccess,
  initialMonths,
}: {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  hasCourseAccess: boolean;
  initialMonths: Month[];
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  const subscribeHref = `/?chat=1&course=${encodeURIComponent(courseSlug)}#contact`;

  const [months, setMonths] = useState<Month[]>(initialMonths);

  const [activeMonthId, setActiveMonthId] = useState<string | null>(null);

  const [days, setDays] = useState<Day[]>([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [daysError, setDaysError] = useState<string | null>(null);

  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const activeDay = useMemo(() => days.find((d) => d.id === activeDayId) ?? null, [days, activeDayId]);

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const activeVideo = useMemo(() => {
    if (!activeDay) return null;
    const selected = activeDay.videos.find((v) => v.id === activeVideoId) ?? null;
    if (selected) return selected;

    const firstPlayable =
      activeDay.videos.find((v) => {
        const raw = v.video_url?.trim() ?? "";
        if (!raw) return false;
        const normalized = normalizeVideoUrl(raw);
        return Boolean(normalized && isHttpUrl(normalized));
      }) ?? null;

    return firstPlayable ?? activeDay.videos[0] ?? null;
  }, [activeDay, activeVideoId]);

  const activeVideoUrl = activeVideo?.video_url ? normalizeVideoUrl(activeVideo.video_url) : "";
  const canPlay = Boolean(activeVideoUrl && isHttpUrl(activeVideoUrl));

  const daysSectionRef = useRef<HTMLDivElement | null>(null);
  const activateSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const sessionRes = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthed(Boolean(sessionRes.data.session));
    };

    void run();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session));
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const isAuthLoading = isAuthed === null;
  const isLocked = !hasCourseAccess;

  useEffect(() => {
    setMonths(initialMonths);
  }, [initialMonths]);

  useEffect(() => {
    setActiveMonthId((prev) => {
      if (!months.length) return null;
      if (prev && months.some((x) => x.id === prev)) return prev;
      const first =
        months.find((x) => Number.isFinite(x.month_number as any) && (x.month_number as any) > 0) ?? months[0] ?? null;
      return first?.id ?? null;
    });

    if (!months.length) {
      setDays([]);
      setActiveDayId(null);
      setActiveVideoId(null);
    }
  }, [months]);

  const loadMonthDaysAndVideos = useCallback(async (monthId: string) => {
    setDays([]);
    setDaysLoading(true);
    setDaysError(null);
    setActiveDayId(null);
    setActiveVideoId(null);

    if (!hasCourseAccess) {
      const scheduleRes = await supabase.rpc("preview_month_schedule", { p_month_id: monthId });

      if ((scheduleRes as any).error) {
        setDaysError((scheduleRes as any).error.message);
        setDaysLoading(false);
        return;
      }

      const rows = (((scheduleRes as any).data ?? []) as PreviewScheduleRow[]) ?? [];
      const byDay = new Map<string, Day>();

      for (const r of rows) {
        const dayId = String((r as any).day_id ?? "");
        if (!dayId) continue;

        let day = byDay.get(dayId);
        if (!day) {
          day = {
            id: dayId,
            title: (r as any).day_title ?? null,
            day_number: (r as any).day_number === null || (r as any).day_number === undefined ? null : Number((r as any).day_number),
            videos: [],
          };
          byDay.set(dayId, day);
        }

        const videoId = (r as any).video_id ? String((r as any).video_id) : "";
        if (videoId) {
          const rawUrl = (r as any).video_url ?? null;
          day.videos.push({
            id: videoId,
            title: (r as any).video_title ?? null,
            video_url: rawUrl ? normalizeEmbedUrl(String(rawUrl)) : null,
            thumbnail_url: (r as any).thumbnail_url ?? null,
            details: (r as any).details ?? null,
            duration_sec:
              (r as any).duration_sec === null || (r as any).duration_sec === undefined ? null : Number((r as any).duration_sec),
            is_free_preview: Boolean((r as any).is_free_preview),
          });
        }
      }

      const nextDays = Array.from(byDay.values());
      setDays(nextDays);
      setActiveDayId(nextDays[0]?.id ?? null);
      setActiveVideoId(
        nextDays[0]?.videos.find((v) => {
          const raw = v.video_url?.trim() ?? "";
          if (!raw) return false;
          const normalized = normalizeVideoUrl(raw);
          return Boolean(normalized && isHttpUrl(normalized));
        })?.id ??
          nextDays[0]?.videos[0]?.id ??
          null,
      );
      setDaysLoading(false);
      return;
    }

    const daysRes = await supabase
      .from("days")
      .select("id,month_id,title,day_number,sort_order,created_at")
      .eq("month_id", monthId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (daysRes.error) {
      setDaysError(daysRes.error.message);
      setDaysLoading(false);
      return;
    }

    const dayRows = (daysRes.data ?? []) as any[];
    const nextDays: Day[] = dayRows.map((d) => ({
      id: String(d.id),
      title: d.title ?? null,
      day_number: d.day_number ?? null,
      videos: [],
    }));

    const dayIds = nextDays.map((d) => d.id);
    if (dayIds.length) {
      const vRes = await supabase
        .from("videos")
        .select("id,day_id,title,video_url,thumbnail_url,details,duration_sec,is_free_preview,sort_order,created_at")
        .in("day_id", dayIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (vRes.error) {
        setDaysError(`فشل تحميل الفيديوهات: ${vRes.error.message}`);
      } else {
        const videos = (vRes.data ?? []) as any[];
        const byDay = new Map<string, any[]>();
        for (const v of videos) {
          const k = String(v.day_id);
          const list = byDay.get(k);
          if (list) list.push(v);
          else byDay.set(k, [v]);
        }

        for (const d of nextDays) {
          const list = byDay.get(d.id) ?? [];
          d.videos = list.map((v) => ({
            id: String(v.id),
            title: v.title ?? null,
            video_url: normalizeEmbedUrl(v.video_url ?? ""),
            thumbnail_url: v.thumbnail_url ?? null,
            details: v.details ?? null,
            duration_sec: v.duration_sec ?? null,
            is_free_preview: Boolean(v.is_free_preview),
          }));
        }
      }
    }

    setDays(nextDays);
    setActiveDayId(nextDays[0]?.id ?? null);
    setActiveVideoId(
      nextDays[0]?.videos.find((v) => {
        const raw = v.video_url?.trim() ?? "";
        if (!raw) return false;
        const normalized = normalizeVideoUrl(raw);
        return Boolean(normalized && isHttpUrl(normalized));
      })?.id ??
        nextDays[0]?.videos[0]?.id ??
        null,
    );
    setDaysLoading(false);
  }, [hasCourseAccess, supabase]);

  useEffect(() => {
    if (!activeMonthId) return;
    if (daysLoading) return;
    if (days.length) return;
    void loadMonthDaysAndVideos(activeMonthId);
  }, [activeMonthId, days.length, daysLoading, loadMonthDaysAndVideos]);

  useEffect(() => {
    if (!activeMonthId) return;

    const t = window.setTimeout(() => {
      daysSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    return () => window.clearTimeout(t);
  }, [activeMonthId]);

  return (
    <div className="mt-8">
      <div className="rounded-3xl bg-black/45 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
        <div ref={activateSectionRef}>
          {isAuthed === null ? (
            <div className="rounded-3xl bg-black/45 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
              <div className="text-right text-sm text-white/70">تحميل...</div>
            </div>
          ) : !hasCourseAccess ? (
            <div className="rounded-3xl bg-black/45 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
              <div className="flex flex-wrap items-center justify-between gap-3" dir="rtl">
                <div>
                  <div className="text-right font-heading text-xl tracking-[0.10em] text-white">الجدول التدريبي مقفول</div>
                  <div className="mt-2 text-right text-sm text-white/70">
                    يتم ظهور الجدول التدريبي الخاص بيك بعد الاشتراك.
                    <div className="mt-1 text-right text-xs text-white/45">شخلل علشان تعدي 😂</div>
                  </div>
                </div>
                <Link
                  href={subscribeHref}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#25D366]/90 px-6 text-xs font-extrabold tracking-[0.12em] text-white shadow-[0_14px_60px_-36px_rgba(37,211,102,0.55)] transition hover:bg-[#25D366]"
                >
                  اشترك
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          <div className="text-right font-heading text-xs tracking-[0.22em] text-white/70">الشهور</div>

          {months.length === 0 ? (
            <div className="mt-4 rounded-3xl bg-white/5 px-6 py-6 text-right text-sm text-white/70 border border-white/10">
              مفيش شهور متاحة دلوقتي.
            </div>
          ) : null}

          {months.length ? (
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {months.map((m, idx) => {
                const active = m.id === activeMonthId;
                const num = m.month_number ?? idx + 1;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setActiveMonthId(m.id);
                      void loadMonthDaysAndVideos(m.id);
                    }}
                    disabled={isAuthLoading}
                    className={
                      "h-11 rounded-2xl px-5 text-[13px] font-heading tracking-[0.12em] border transition " +
                      (active
                        ? "bg-[#FF6A00]/20 text-white border-[#FFB35A]/40"
                        : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10")
                    }
                  >
                    {m.title ? m.title : `الشهر ${num}`}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div ref={daysSectionRef} className="mt-10">
          {activeMonthId ? (
            <>
              <div className="text-right font-heading text-xs tracking-[0.22em] text-white/70">الأيام</div>

              {daysError ? (
                <div className="mt-4 rounded-3xl bg-white/5 px-6 py-6 text-right text-sm text-white/70 border border-white/10" dir="ltr">
                  {daysError}
                </div>
              ) : null}

              {daysLoading ? (
                <div className="mt-4 rounded-3xl bg-white/5 px-6 py-6 text-right text-sm text-white/70 border border-white/10">تحميل...</div>
              ) : null}

              {!daysLoading && days.length === 0 ? (
                <div className="mt-4 rounded-3xl bg-white/5 px-6 py-6 text-right text-sm text-white/70 border border-white/10">
                  مفيش أيام في الشهر ده.
                </div>
              ) : null}

              {days.length ? (
                <div className="mt-4 grid gap-6 lg:grid-cols-[320px_1fr]">
                  <div>
                    <div className="mt-0 flex flex-wrap justify-end gap-2">
                      {days.map((d, idx) => {
                        const active = d.id === (activeDay?.id ?? null);
                        const num = d.day_number ?? idx + 1;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setActiveDayId(d.id);
                              setActiveVideoId(
                                d.videos.find((v) => {
                                  const raw = v.video_url?.trim() ?? "";
                                  if (!raw) return false;
                                  const normalized = normalizeVideoUrl(raw);
                                  return Boolean(normalized && isHttpUrl(normalized));
                                })?.id ??
                                  d.videos[0]?.id ??
                                  null,
                              );
                            }}
                            disabled={isAuthLoading}
                            className={
                              "h-10 w-10 rounded-xl text-xs font-heading tracking-[0.10em] border transition " +
                              (active
                                ? "bg-[#FF6A00]/20 text-white border-[#FFB35A]/40"
                                : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10")
                            }
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-8 text-right font-heading text-xs tracking-[0.22em] text-white/70">فيديوهات اليوم</div>
                    <div className="mt-4 space-y-2">
                      {!activeDay ? (
                        <div className="rounded-2xl bg-white/5 px-4 py-4 text-sm text-white/70 border border-white/10">
                          اختار يوم علشان تظهر الفيديوهات.
                        </div>
                      ) : activeDay.videos.length === 0 ? (
                        <div className="rounded-2xl bg-white/5 px-4 py-4 text-sm text-white/70 border border-white/10">
                          مفيش فيديوهات لليوم ده.
                        </div>
                      ) : (
                        activeDay.videos.map((v) => {
                          const active = v.id === (activeVideo?.id ?? null);
                          const details = v.details?.trim() ?? "";
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setActiveVideoId(v.id)}
                              disabled={isAuthLoading}
                              className={
                                "w-full rounded-2xl px-4 py-3 text-right text-sm border transition " +
                                (active
                                  ? "bg-[#FF6A00]/15 text-white border-[#FFB35A]/35"
                                  : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10")
                              }
                            >
                              <div className="flex flex-row-reverse items-start gap-3">
                                {v.thumbnail_url ? (
                                  <img
                                    src={v.thumbnail_url}
                                    alt="thumbnail"
                                    className="h-14 w-20 shrink-0 rounded-xl border border-white/10 object-cover"
                                  />
                                ) : null}

                                <div className="min-w-0 text-right">
                                  <div className="text-sm">{v.title ?? "فيديو"}</div>
                                {isLocked ? (
                                  <div className="mt-1 text-xs text-[#FFB35A]">مقفول</div>
                                ) : details ? (
                                  <div className="mt-1 max-h-10 overflow-hidden text-xs leading-5 text-white/65">
                                    {details}
                                  </div>
                                ) : null}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-right font-heading text-xs tracking-[0.22em] text-white/70">المشغل</div>
                    <div className="relative mt-4 overflow-hidden rounded-3xl bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                      {(() => {
                        const canPlayPreview = Boolean(
                          isLocked &&
                            activeDay &&
                            activeVideo?.is_free_preview &&
                            activeVideo?.video_url &&
                            canPlay,
                        );

                        if (isLocked && !canPlayPreview) {
                          return (
                        <div className="grid h-[420px] place-items-center bg-black px-6">
                          <div className="w-full max-w-md" dir="rtl">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-[#FFB35A] shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                              <LockIcon className="h-7 w-7" />
                            </div>
                            <div className="mt-4 text-right font-heading text-lg tracking-[0.10em] text-white">الفيديو مقفول</div>
                            <div className="mt-2 text-right text-sm text-white/70">
                              {isAuthLoading ? (
                                "تحميل..."
                              ) : (
                                <>
                                  يتم ظهور الجدول التدريبي الخاص بيك بعد الاشتراك.
                                  <div className="mt-1 text-right text-xs text-white/45">شخلل علشان تعدي 😂</div>
                                </>
                              )}
                            </div>
                            <div className="mt-5 flex flex-wrap justify-end gap-3">
                              <Link
                                href={subscribeHref}
                                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#25D366]/90 px-6 text-xs font-extrabold tracking-[0.12em] text-white shadow-[0_14px_60px_-36px_rgba(37,211,102,0.55)] transition hover:bg-[#25D366]"
                              >
                                اشترك
                              </Link>
                            </div>
                          </div>
                        </div>
                          );
                        }

                        if (!isLocked && activeDay && activeDay.videos.length) {
                          const dayHasPlayableVideo = activeDay.videos.some((v) => {
                            const raw = v.video_url?.trim() ?? "";
                            if (!raw) return false;
                            const normalized = normalizeVideoUrl(raw);
                            return Boolean(normalized && isHttpUrl(normalized));
                          });

                          if (!dayHasPlayableVideo) {
                            return (
                              <div className="grid h-[420px] place-items-center bg-black px-6" dir="rtl">
                                <div className="text-right text-sm text-white/70">
                                  لا يوجد فيديو لهذا اليوم، اتبع التعليمات المكتوبة
                                </div>
                              </div>
                            );
                          }
                        }

                        if (activeDay && activeVideo?.video_url) {
                          if (!canPlay) {
                            return <div className="grid h-[420px] place-items-center text-white/60">رابط الفيديو غير صحيح</div>;
                          }

                          if (isProbablyMp4(activeVideoUrl)) {
                            return (
                              <video
                                controls
                                playsInline
                                className="h-[420px] w-full bg-black object-contain"
                                src={activeVideoUrl}
                              />
                            );
                          }

                          return (
                            <iframe
                              className="h-[420px] w-full"
                              src={activeVideoUrl}
                              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                              allowFullScreen
                              title={activeVideo.title ?? "video"}
                            />
                          );
                        }

                        return <div className="grid h-[420px] place-items-center text-white/60">اختر يوم ثم فيديو</div>;
                      })()}

                      {!isLocked && activeDay && activeVideo?.video_url && canPlay ? (
                        <div className="pointer-events-none absolute right-2 top-2" dir="rtl">
                          <div className="rounded-2xl bg-black/55 px-3 py-2 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                            <img src="/s.png" alt="logo" className="h-9 w-auto opacity-90" />
                          </div>
                        </div>
                      ) : null}

                    </div>

                    {!isLocked && activeDay && activeVideo?.details?.trim() ? (
                      <div className="mt-4 rounded-3xl bg-white/5 p-5 text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                        <div className="text-right font-heading text-xs tracking-[0.22em] text-white/70">تفاصيل الفيديو</div>
                        <div className="mt-3 whitespace-pre-wrap text-right text-sm leading-7">
                          {activeVideo.details}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-3xl bg-white/5 px-6 py-6 text-right text-sm text-white/70 border border-white/10">
              اختار شهر علشان يظهرلك الأيام والفيديوهات.
            </div>
          )}
        </div>
      </div>

      {hasCourseAccess ? <ChatWidget courseId={courseId} courseTitle={courseTitle} /> : null}
    </div>
  );
}
