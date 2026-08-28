"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { RedeemMonthCodeInline } from "@/features/activation/RedeemMonthCodeInline";
import { WatermarkOverlay } from "@/features/video/WatermarkOverlay";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { getCachedUser } from "@/lib/sessionCache";

import { UniversalVideoPlayer, parseVideoUrl } from "@/features/video/UniversalVideoPlayer";

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

export function ProgramMonthViewer({
  courseTitle,
  courseSlug,
  ageGroupId,
  pkgSlug,
  monthNumber,
  monthTitle,
  days,
  locked,
  subscribeHref,
}: {
  courseTitle: string;
  courseSlug: string;
  ageGroupId?: string;
  pkgSlug?: string;
  monthNumber: number;
  monthTitle: string | null;
  days: Day[];
  locked?: boolean;
  subscribeHref?: string;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [watermark, setWatermark] = useState<{ name: string; phone: string } | null>(null);

  const isLocked = Boolean(locked);
  const subscribeTo = typeof subscribeHref === "string" && subscribeHref.trim() ? subscribeHref.trim() : "/?chat=1#contact";

  const displayDays = useMemo(() => {
    return days;
  }, [days]);

  const [activeDayId, setActiveDayId] = useState<string | null>(displayDays[0]?.id ?? null);

  const activeDay = useMemo(() => {
    return displayDays.find((d) => d.id === activeDayId) ?? displayDays[0] ?? null;
  }, [displayDays, activeDayId]);

  const [activeVideoId, setActiveVideoId] = useState<string | null>(activeDay?.videos[0]?.id ?? null);

  useEffect(() => {
    const firstDayId = displayDays[0]?.id ?? null;
    setActiveDayId(firstDayId);
    const firstVideoId = displayDays[0]?.videos[0]?.id ?? null;
    setActiveVideoId(firstVideoId);
  }, [displayDays]);

  const activeVideo = useMemo(() => {
    if (!activeDay) return null;
    return activeDay.videos.find((v) => v.id === activeVideoId) ?? activeDay.videos[0] ?? null;
  }, [activeDay, activeVideoId]);

  const parsedActiveVideo = useMemo(() => parseVideoUrl(activeVideo?.video_url), [activeVideo?.video_url]);
  const canPlay = parsedActiveVideo.type !== "invalid";
  const canPlayPreview = Boolean(isLocked && monthNumber !== 1 && activeVideo?.video_url && activeVideo.is_free_preview);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const { user } = await getCachedUser(supabase);
        if (!user) {
          if (mounted) setWatermark(null);
          return;
        }


        const profRes = await supabase
          .from("user_profiles")
          .select("full_name,phone")
          .eq("user_id", user.id)
          .maybeSingle();

        const name = String((profRes.data as any)?.full_name ?? "").trim() || String((user as any).email ?? "مستخدم");
        const phone = String((profRes.data as any)?.phone ?? "").trim() || String((user as any).phone ?? user.id);

        if (mounted) setWatermark({ name, phone });
      } catch {
        if (mounted) setWatermark(null);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] px-6 py-16" dir="rtl">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
          <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">
            {courseTitle}
          </div>
          <div className="mt-3 text-right text-sm text-white/70">
            {monthTitle ? monthTitle : `الشهر رقم ${monthNumber}`}
            <span className="mx-2 text-white/35">•</span>
            <span dir="ltr" className="text-white/55">{courseSlug}</span>
          </div>

          {isLocked ? (
            <div className="mt-5 rounded-3xl bg-white/5 px-6 py-5 text-right text-sm text-white/70 border border-white/10">
              يتم ظهور الجدول التدريبي الخاص بيك بعد الاشتراك.
              <div className="mt-1 text-right text-xs text-white/45">شخلل علشان تعدي 😂</div>
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <Link
                  href={subscribeTo}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#25D366]/90 px-6 text-xs font-extrabold tracking-[0.12em] text-white shadow-[0_14px_60px_-36px_rgba(37,211,102,0.55)] transition hover:bg-[#25D366]"
                >
                  اشترك
                </Link>
              </div>

              {ageGroupId ? (
                <div className="mt-6">
                  <RedeemMonthCodeInline
                    initialCourseSlug={courseSlug}
                    initialCourseTitle={courseTitle}
                    ageGroupId={ageGroupId}
                    pkgSlug={pkgSlug}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
            <div>
              <div className="text-right font-heading text-xs tracking-[0.22em] text-white/70">الأيام</div>
              {displayDays.length ? (
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {displayDays.map((d, idx) => {
                    const active = d.id === (activeDay?.id ?? null);
                    const num = d.day_number ?? idx + 1;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setActiveDayId(d.id);
                          setActiveVideoId(d.videos[0]?.id ?? null);
                        }}
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
              ) : (
                <div className="mt-4 rounded-2xl bg-white/5 px-4 py-4 text-sm text-white/70 border border-white/10">
                  مفيش أيام في الشهر ده.
                </div>
              )}

              <div className="mt-8 text-right font-heading text-xs tracking-[0.22em] text-white/70">فيديوهات اليوم</div>
              <div className="mt-4 space-y-2">
                {(activeDay?.videos ?? []).map((v) => {
                  const active = v.id === (activeVideo?.id ?? null);
                  const details = v.details?.trim() ?? "";
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveVideoId(v.id)}
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
                })}

                {(!activeDay || activeDay.videos.length === 0) ? (
                  <div className="rounded-2xl bg-white/5 px-4 py-4 text-sm text-white/70 border border-white/10">
                    مفيش فيديوهات لليوم ده.
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <div className="text-right font-heading text-xs tracking-[0.22em] text-white/70">المشغل</div>
              <div className="mt-4">
                {isLocked && !canPlayPreview ? (
                  <div className="grid h-[340px] sm:h-[440px] min-h-[340px] place-items-center rounded-3xl bg-black px-6 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]" dir="rtl">
                    <div className="w-full max-w-md text-right">
                      <div className="text-right font-heading text-lg tracking-[0.10em] text-white">الفيديو مقفول</div>
                      <div className="mt-2 text-right text-sm text-white/70">
                        يتم ظهور الجدول التدريبي الخاص بيك بعد الاشتراك.
                        <div className="mt-1 text-right text-xs text-white/45">شخلل علشان تعدي 😂</div>
                      </div>
                      <div className="mt-5 flex flex-wrap justify-end gap-3">
                        <Link
                          href={subscribeTo}
                          className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#25D366]/90 px-6 text-xs font-extrabold tracking-[0.12em] text-white shadow-[0_14px_60px_-36px_rgba(37,211,102,0.55)] transition hover:bg-[#25D366]"
                        >
                          اشترك
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : activeVideo?.video_url ? (
                  !canPlay ? (
                    <div className="grid h-[340px] sm:h-[440px] min-h-[340px] place-items-center rounded-3xl bg-black text-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                      رابط الفيديو غير صحيح
                    </div>
                  ) : (
                    <UniversalVideoPlayer
                      videoUrl={activeVideo.video_url}
                      title={activeVideo.title}
                      watermark={watermark && (!isLocked || canPlayPreview) ? watermark : null}
                      className="h-[340px] sm:h-[440px] min-h-[340px] w-full"
                    />
                  )
                ) : (
                  <div className="relative h-[340px] sm:h-[440px] min-h-[340px] w-full overflow-hidden rounded-3xl bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                    <img
                      src="/خلفيه%20ملعب.jpeg"
                      alt="background"
                      className="absolute inset-0 h-full w-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-black/55" />
                    <div className="relative z-10 grid h-full place-items-center px-6 text-white/80" dir="rtl">
                      <div className="text-right text-sm">لا يوجد فيديو لهذا اليوم، اتبع التعليمات المكتوبة</div>
                    </div>
                  </div>
                )}
              </div>

              {activeVideo?.details?.trim() ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 via-white/5 to-white/0 px-4 py-4 text-white/85 shadow-[0_18px_70px_-54px_rgba(0,0,0,0.95)]">
                  <div className="flex items-center justify-end gap-3" dir="rtl">
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/12 to-transparent" />
                    <div className="text-right font-heading text-xs tracking-[0.22em] text-white/70">تفاصيل الفيديو</div>
                  </div>
                  <div className="mt-3 space-y-2 text-right text-sm leading-6">
                    {String(activeVideo.details ?? "")
                      .split(/\r?\n/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((line, idx) => (
                        <div key={idx} className="flex flex-row-reverse items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFB35A]/80" />
                          <span className="whitespace-pre-wrap">{line}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
