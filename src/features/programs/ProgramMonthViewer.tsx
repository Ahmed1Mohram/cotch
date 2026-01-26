"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { RedeemMonthCodeInline } from "@/features/activation/RedeemMonthCodeInline";

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

function isProbablyMp4(url: string) {
  const u = url.toLowerCase();
  return u.includes(".mp4");
}

function isHttpUrl(url: string) {
  return /^https?:\/\//i.test(url.trim());
}

function normalizeVideoUrl(rawUrl: string) {
  let url = rawUrl.trim();
  if (!url) return url;

  const looksLikeUrl = /^https?:\/\//i.test(url);

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

  const youtubeMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
  );
  if (youtubeMatch?.[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  if (!looksLikeUrl) {
    const idOnly = url.match(/^([A-Za-z0-9_-]{15,})(?:[/?].*)?$/);
    if (idOnly?.[1]) {
      return `https://drive.google.com/file/d/${idOnly[1]}/preview`;
    }
  }

  return url;
}

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

  const activeVideoUrl = activeVideo?.video_url ? normalizeVideoUrl(activeVideo.video_url) : "";
  const canPlay = Boolean(activeVideoUrl && isHttpUrl(activeVideoUrl));
  const canPlayPreview = Boolean(isLocked && monthNumber !== 1 && activeVideo?.video_url && activeVideo.is_free_preview);

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
                      <div className="text-right">
                        <div className="text-sm">{v.title ?? "فيديو"}</div>
                        {isLocked ? (
                          <div className="mt-1 text-xs text-[#FFB35A]">مقفول</div>
                        ) : details ? (
                          <div className="mt-1 max-h-10 overflow-hidden text-xs leading-5 text-white/65">
                            {details}
                          </div>
                        ) : null}
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
              <div className="relative mt-4 overflow-hidden rounded-3xl bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                {isLocked && !canPlayPreview ? (
                  <div className="grid h-[420px] place-items-center bg-black px-6" dir="rtl">
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
                    <div className="grid h-[420px] place-items-center text-white/60">رابط الفيديو غير صحيح</div>
                  ) : isProbablyMp4(activeVideoUrl) ? (
                    <video
                      controls
                      playsInline
                      className="h-[420px] w-full bg-black object-contain"
                      src={activeVideoUrl}
                    />
                  ) : (
                    <iframe
                      className="h-[420px] w-full"
                      src={activeVideoUrl}
                      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={activeVideo.title ?? "video"}
                    />
                  )
                ) : (
                  <div className="grid h-[420px] place-items-center text-white/60">اختر يوم ثم فيديو</div>
                )}

                {activeVideo?.video_url && canPlay ? (
                  <div className="pointer-events-none absolute right-2 top-2" dir="rtl">
                    <div className="rounded-2xl bg-black/55 px-3 py-2 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                      <img src="/s.png" alt="logo" className="h-9 w-auto opacity-90" />
                    </div>
                  </div>
                ) : null}
              </div>

              {activeVideo?.details?.trim() ? (
                <div className="mt-4 rounded-3xl bg-white/5 p-5 text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                  <div className="text-right font-heading text-xs tracking-[0.22em] text-white/70">تفاصيل الفيديو</div>
                  <div className="mt-3 whitespace-pre-wrap text-right text-sm leading-7">
                    {activeVideo.details}
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
