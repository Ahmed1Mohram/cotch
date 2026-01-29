"use client";



import { useMemo, useState } from "react";



import Link from "next/link";



import { cn } from "@/lib/cn";

import {

  getAdminCourseBySlug,

  type Course,

  type Video,

} from "@/features/admin/mock";

import { AdminCard } from "@/features/admin/ui/AdminCard";

import { Accordion } from "@/features/admin/ui/Accordion";

import { Lockable } from "@/features/admin/ui/Lockable";

import { Tabs, type TabItem } from "@/features/admin/ui/Tabs";

import { IconLock, IconSpark } from "@/features/admin/ui/icons";

import { WatermarkOverlay } from "@/features/video/WatermarkOverlay";



type TabKey = "ages" | "cards" | "calendar" | "videos";



const tabItems: Array<TabItem<TabKey>> = [

  { key: "ages", label: "مجموعات الأعمار" },

  { key: "cards", label: "كروت اللاعبين" },

  { key: "calendar", label: "الشهور والأيام" },

  { key: "videos", label: "الفيديوهات" },

];



function themeGlow(theme: Course["theme"]) {

  if (theme === "green") return "green";

  if (theme === "blue") return "blue";

  return "orange";

}



function providerBadge(provider: Video["provider"]) {

  if (provider === "gdrive") return "bg-slate-100 text-slate-800 border border-slate-200";

  return "bg-slate-100 text-slate-700 border border-slate-200";

}



export function AdminCourseDetailsScreen({ slug }: { slug: string }) {

  const course = getAdminCourseBySlug(slug);

  const [tab, setTab] = useState<TabKey>("ages");

  const [previewLocked, setPreviewLocked] = useState(false);



  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<string | null>(

    course?.ageGroups[0]?.id ?? null,

  );



  const selectedAgeGroup = useMemo(() => {

    if (!course) return null;

    return course.ageGroups.find((ag) => ag.id === selectedAgeGroupId) ?? null;

  }, [course, selectedAgeGroupId]);



  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(

    selectedAgeGroup?.months[0]?.id ?? null,

  );



  const selectedMonth = useMemo(() => {

    if (!selectedAgeGroup) return null;

    return selectedAgeGroup.months.find((m) => m.id === selectedMonthId) ?? null;

  }, [selectedAgeGroup, selectedMonthId]);



  const [selectedDay, setSelectedDay] = useState<number>(1);



  const dayVideos = useMemo(() => {

    if (!selectedMonth) return [];

    const day = selectedMonth.days.find((d) => d.dayIndex === selectedDay);

    return (day?.videos ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);

  }, [selectedMonth, selectedDay]);



  const [videoOrder, setVideoOrder] = useState<string[]>([]);



  const orderedVideos = useMemo(() => {

    if (videoOrder.length === 0) return dayVideos;

    const byId = new Map(dayVideos.map((v) => [v.id, v] as const));

    const ordered = videoOrder.map((id) => byId.get(id)).filter(Boolean) as Video[];

    const rest = dayVideos.filter((v) => !videoOrder.includes(v.id));

    return [...ordered, ...rest];

  }, [dayVideos, videoOrder]);



  const [activeVideoId, setActiveVideoId] = useState<string | null>(

    orderedVideos[0]?.id ?? null,

  );



  const activeVideo = useMemo(() => {

    return orderedVideos.find((v) => v.id === activeVideoId) ?? null;

  }, [orderedVideos, activeVideoId]);



  if (!course) {

    return (

      <AdminCard>

        <div className="font-heading text-xl tracking-[0.12em] text-slate-900" dir="rtl">

          الكورس غير موجود

        </div>

        <div className="mt-2 text-sm text-slate-600" dir="rtl">المعرّف (slug) غير صحيح: {slug}</div>

        <div className="mt-6">

          <Link

            href="/admin/courses"

            className="inline-flex rounded-2xl bg-slate-100 px-5 py-3 text-xs font-heading tracking-[0.12em] text-slate-900 border border-slate-200 hover:bg-slate-200"

          >

            رجوع للكورسات

          </Link>

        </div>

      </AdminCard>

    );

  }



  return (

    <div className="space-y-6" dir="rtl">

      <AdminCard glow={themeGlow(course.theme)}>

        <div className="flex flex-wrap items-start justify-between gap-5">

          <div className="min-w-0">

            <div className="text-xs font-heading tracking-[0.14em] text-slate-600">

              الكورس

            </div>

            <div className="mt-2 font-heading text-3xl tracking-[0.10em] text-slate-900">

              {course.title}

            </div>

            <div className="mt-2 max-w-2xl text-sm text-slate-600">

              {course.description}

            </div>

          </div>



          <div className="flex flex-col items-end gap-3">

            <label className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-xs text-slate-700 border border-slate-200">

              <input

                type="checkbox"

                checked={previewLocked}

                onChange={(e) => setPreviewLocked(e.target.checked)}

                className="h-4 w-4 accent-[#FF8A00]"

              />

              معاينة مقفولة

            </label>

            <Link

              href="/admin/courses"

              className="text-xs font-heading tracking-[0.12em] text-slate-600 hover:text-slate-900"

            >

              رجوع

            </Link>

          </div>

        </div>



        <div className="mt-6 flex flex-wrap items-center gap-4">

          <Tabs items={tabItems} value={tab} onChange={setTab} />

          <div className="text-xs text-slate-500">بيانات تجريبية</div>

        </div>

      </AdminCard>



      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">

        <div className="space-y-6">

          <AdminCard>

            <div className="font-heading text-sm tracking-[0.12em] text-slate-900">

              مجموعات الأعمار

            </div>

            <div className="mt-4 space-y-2">

              {course.ageGroups.map((ag) => {

                const active = ag.id === selectedAgeGroupId;

                return (

                  <button

                    key={ag.id}

                    type="button"

                    onClick={() => {

                      setSelectedAgeGroupId(ag.id);

                      setSelectedMonthId(ag.months[0]?.id ?? null);

                      setSelectedDay(1);

                      setVideoOrder([]);

                    }}

                    className={cn(

                      "w-full rounded-2xl px-4 py-3 text-right transition border",

                      active

                        ? "bg-slate-50 text-slate-900 border-slate-300"

                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100",

                    )}

                  >

                    <div className="font-heading text-xs tracking-[0.12em]">

                      {ag.name}

                    </div>

                    <div className="mt-1 text-xs text-slate-500">

                      {ag.minAge}–{ag.maxAge} سنة

                    </div>

                  </button>

                );

              })}

            </div>

          </AdminCard>



          {selectedAgeGroup ? (

            <AdminCard>

              <div className="font-heading text-sm tracking-[0.12em] text-slate-900">

                إحصائيات سريعة

              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-600">

                <div className="rounded-2xl bg-slate-50 px-3 py-3 border border-slate-200">

                  كروت

                  <div className="mt-1 font-heading text-sm text-slate-900">

                    {selectedAgeGroup.playerCards.length}

                  </div>

                </div>

                <div className="rounded-2xl bg-slate-50 px-3 py-3 border border-slate-200">

                  شهور

                  <div className="mt-1 font-heading text-sm text-slate-900">

                    {selectedAgeGroup.months.length}

                  </div>

                </div>

                <div className="rounded-2xl bg-slate-50 px-3 py-3 border border-slate-200">

                  أيام

                  <div className="mt-1 font-heading text-sm text-slate-900">30</div>

                </div>

              </div>

            </AdminCard>

          ) : null}

        </div>



        <div className="space-y-6">

          {tab === "ages" ? (

            <AdminCard>

              <div className="font-heading text-xl tracking-[0.12em] text-slate-900">

                مجموعات الأعمار

              </div>

              <div className="mt-2 text-sm text-slate-600">

                كل كورس منفصل: مجموعات الأعمار تخص هذا الكورس فقط.

              </div>



              <div className="mt-6 grid gap-4 md:grid-cols-2">

                {course.ageGroups.map((ag) => (

                  <div

                    key={ag.id}

                    className="rounded-2xl bg-slate-50 p-5 border border-slate-200"

                  >

                    <div className="flex items-center justify-between gap-3">

                      <div className="min-w-0">

                        <div className="truncate font-heading text-sm tracking-[0.12em] text-slate-900">

                          {ag.name}

                        </div>

                        <div className="mt-1 text-xs text-slate-500">

                          {ag.minAge}–{ag.maxAge} سنة

                        </div>

                      </div>

                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-heading tracking-[0.12em] text-slate-700 border border-slate-200">

                        {ag.playerCards.length} كارت

                      </span>

                    </div>

                  </div>

                ))}

              </div>

            </AdminCard>

          ) : null}



          {tab === "cards" ? (

            <AdminCard>

              <div className="flex items-center justify-between gap-4">

                <div>

                  <div className="font-heading text-xl tracking-[0.12em] text-slate-900">

                    كروت اللاعبين

                  </div>

                  <div className="mt-2 text-sm text-slate-600">

                    الكروت مقفولة افتراضيًا وبتتفتح بالاشتراك.

                  </div>

                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-heading tracking-[0.12em] text-slate-700 border border-slate-200">

                  <IconLock className="h-4 w-4" />

                  مقفولة افتراضيًا

                </div>

              </div>



              {selectedAgeGroup ? (

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                  {selectedAgeGroup.playerCards.map((pc) => (

                    <Lockable

                      key={pc.id}

                      locked={previewLocked || pc.lockedByDefault}

                      label="محتاج تفعيل"

                      className="rounded-2xl"

                    >

                      <div className="rounded-2xl bg-white p-5 border border-slate-200">

                        <div>

                          <div className="font-heading text-xs tracking-[0.12em] text-slate-600">

                            {pc.label}

                          </div>

                          <div className="mt-3 font-heading text-2xl tracking-[0.10em] text-slate-900">

                            {pc.age} سنة

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">

                            <div className="rounded-xl bg-slate-50 px-3 py-2 border border-slate-200">

                              الطول

                              <div className="mt-1 font-heading text-sm text-slate-900">

                                {pc.heightCm} سم

                              </div>

                            </div>

                            <div className="rounded-xl bg-slate-50 px-3 py-2 border border-slate-200">

                              الوزن

                              <div className="mt-1 font-heading text-sm text-slate-900">

                                {pc.weightKg} كجم

                              </div>

                            </div>

                          </div>

                        </div>

                      </div>

                    </Lockable>

                  ))}

                </div>

              ) : (

                <div className="mt-6 text-sm text-slate-600">اختار مجموعة عمر.</div>

              )}

            </AdminCard>

          ) : null}



          {tab === "calendar" ? (

            <AdminCard>

              <div className="font-heading text-xl tracking-[0.12em] text-slate-900">

                الشهور والأيام

              </div>

              <div className="mt-2 text-sm text-slate-600">

                الشهور غير محدودة. كل شهر فيه أيام، واختيار يوم بيظهر الفيديوهات.

              </div>



              {selectedAgeGroup ? (

                <div className="mt-6 space-y-4">

                  {selectedAgeGroup.months.map((m) => (

                    <Accordion

                      key={m.id}

                      title={m.title}

                      subtitle={`شهر ${m.monthIndex} • ${m.daysCount} يوم`}

                      defaultOpen={m.id === selectedMonthId}

                    >

                      <div className="flex flex-wrap items-center gap-2">

                        {Array.from({ length: m.daysCount }).map((_, idx) => {

                          const dayIndex = idx + 1;

                          const active = m.id === selectedMonthId && dayIndex === selectedDay;

                          const hasVideos = (m.days.find((d) => d.dayIndex === dayIndex)?.videos.length ?? 0) > 0;



                          return (

                            <button

                              key={dayIndex}

                              type="button"

                              onClick={() => {

                                setSelectedMonthId(m.id);

                                setSelectedDay(dayIndex);

                                setVideoOrder([]);

                              }}

                              className={cn(

                                "relative h-10 w-10 rounded-2xl text-xs font-heading tracking-[0.10em] transition border",

                                active

                                  ? "bg-slate-50 text-slate-900 border-slate-300"

                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100",

                              )}

                            >

                              {dayIndex}

                              {hasVideos ? (

                                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-slate-900 text-[10px] text-white shadow-sm">

                                  <IconSpark className="h-3 w-3" />

                                </span>

                              ) : null}

                            </button>

                          );

                        })}

                      </div>

                    </Accordion>

                  ))}

                </div>

              ) : (

                <div className="mt-6 text-sm text-slate-600">اختار مجموعة عمر.</div>

              )}

            </AdminCard>

          ) : null}



          {tab === "videos" ? (

            <AdminCard>

              <div className="flex flex-wrap items-center justify-between gap-4">

                <div>

                  <div className="font-heading text-xl tracking-[0.12em] text-slate-900">

                    الفيديوهات

                  </div>

                  <div className="mt-2 text-sm text-slate-600">

                    تقدر ترتب بالسحب والإفلات. فيديوهات درايف عليها علامة قفل.

                  </div>

                </div>

                <div className="text-xs text-slate-500">

                  اليوم {selectedDay}

                </div>

              </div>



              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">

                <div className="space-y-3">

                  {orderedVideos.length === 0 ? (

                    <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 border border-slate-200">

                      لا توجد فيديوهات لهذا اليوم.

                    </div>

                  ) : (

                    orderedVideos.map((v, index) => {

                      const active = v.id === activeVideoId;

                      return (

                        <div

                          key={v.id}

                          draggable

                          onDragStart={(e) => {

                            e.dataTransfer.setData("text/plain", v.id);

                          }}

                          onDragOver={(e) => {

                            e.preventDefault();

                          }}

                          onDrop={(e) => {

                            e.preventDefault();

                            const draggedId = e.dataTransfer.getData("text/plain");

                            if (!draggedId || draggedId === v.id) return;



                            setVideoOrder((prev) => {

                              const base = prev.length ? prev.slice() : orderedVideos.map((x) => x.id);

                              const from = base.indexOf(draggedId);

                              const to = base.indexOf(v.id);

                              if (from === -1 || to === -1) return base;

                              base.splice(from, 1);

                              base.splice(to, 0, draggedId);

                              return base;

                            });

                          }}

                          className={cn(

                            "group cursor-grab rounded-2xl bg-white p-4 border border-slate-200 transition active:cursor-grabbing",

                            active ? "border-slate-300 bg-slate-50" : "hover:bg-slate-50",

                          )}

                        >

                          <button

                            type="button"

                            onClick={() => setActiveVideoId(v.id)}

                            className="flex w-full items-start justify-between gap-4 text-right"

                          >

                            <span className="min-w-0">

                              <span className="block truncate font-heading text-xs tracking-[0.12em] text-slate-900">

                                {index + 1}. {v.title}

                              </span>

                              <span className="mt-1 block truncate text-xs text-slate-500">

                                {v.description}

                              </span>

                              <span className="mt-3 inline-flex items-center gap-2">

                                <span

                                  className={cn(

                                    "rounded-full px-3 py-1 text-[11px] font-heading tracking-[0.12em]",

                                    providerBadge(v.provider),

                                  )}

                                >

                                  {v.provider}

                                </span>

                                {v.provider === "gdrive" ? (

                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-heading tracking-[0.12em] text-slate-700 border border-slate-200">

                                    <IconLock className="h-4 w-4" />

                                    مقفول

                                  </span>

                                ) : null}

                              </span>

                            </span>

                            <span className="text-[11px] text-slate-500">

                              {Math.round(v.durationSeconds / 60)} د

                            </span>

                          </button>

                        </div>

                      );

                    })

                  )}

                </div>



                <Lockable

                  locked={previewLocked}

                  label="لازم فتح المعاينة"

                  className="rounded-2xl"

                >

                  <div className="relative overflow-hidden rounded-2xl bg-white p-4 border border-slate-200">

                    <div className="font-heading text-xs tracking-[0.12em] text-slate-600">

                      معاينة

                    </div>



                    {activeVideo ? (

                      <div className="mt-4 space-y-3">

                        <div className="font-heading text-sm tracking-[0.12em] text-slate-900">

                          {activeVideo.title}

                        </div>

                        <div className="text-xs text-slate-500">

                          {activeVideo.description}

                        </div>



                        <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-sm">

                          <iframe

                            className="absolute inset-0 h-full w-full"

                            src={activeVideo.embedUrl}

                            title={activeVideo.title}

                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"

                            allowFullScreen

                          />

                          <WatermarkOverlay name="مستخدم" phone="+20xxxxxxxxxx" />

                          {activeVideo.provider === "gdrive" ? (

                            <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-[11px] font-heading tracking-[0.12em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">

                              <IconLock className="h-4 w-4" />

                              درايف

                            </div>

                          ) : null}

                        </div>



                        <div className="text-[11px] text-slate-500">

                          رابط الـ Embed ظاهر هنا للتجربة. في الإنتاج هيكون محمي بـ RLS.

                        </div>

                      </div>

                    ) : (

                      <div className="mt-4 text-sm text-slate-600">اختار فيديو.</div>

                    )}

                  </div>

                </Lockable>

              </div>

            </AdminCard>

          ) : null}

        </div>

      </div>

    </div>

  );

}

