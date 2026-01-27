"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminCard } from "@/features/admin/ui/AdminCard";
import { IconBook, IconSpark, IconUsers } from "@/features/admin/ui/icons";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type CourseRow = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
  theme: string | null;
  is_published: boolean;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
};

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  start_at: string;
  end_at: string | null;
  created_at: string;
};

type ContactRequestRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  package_title: string | null;
  course_title: string | null;
  created_at: string;
};

type EnrollmentView = {
  id: string;
  userId: string;
  label: string;
  phone: string | null;
  courseTitle: string;
  status: string;
  createdAt: string;
};

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function fmtDate(v: string | null | undefined) {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  try {
    return d.toLocaleString("ar-EG", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return s;
  }
}

function StatTile({
  label,
  value,
  color,
  Icon,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "purple" | "orange";
  Icon: (props: { className?: string }) => JSX.Element;
}) {
  const colorCls: Record<typeof color, string> = {
    blue: "bg-gradient-to-br from-sky-500 to-sky-700",
    green: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    purple: "bg-gradient-to-br from-slate-600 to-slate-800",
    orange: "bg-gradient-to-br from-orange-500 to-orange-700",
  };

  return (
    <div className={"rounded-2xl p-4 text-white shadow-[0_18px_60px_-42px_rgba(2,6,23,0.8)] " + colorCls[color]}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold opacity-90">{label}</div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight">{value}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardScreen() {
  const [courseCount, setCourseCount] = useState<number>(0);
  const [packageCount, setPackageCount] = useState<number>(0);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [ageGroupsCount, setAgeGroupsCount] = useState<number>(0);
  const [monthsCount, setMonthsCount] = useState<number>(0);
  const [subsCount, setSubsCount] = useState<number>(0);
  const [requestsCount, setRequestsCount] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);

  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [subsByCourseId, setSubsByCourseId] = useState<Record<string, number>>({});
  const [recentEnrollments, setRecentEnrollments] = useState<EnrollmentView[]>([]);
  const [recentRequests, setRecentRequests] = useState<ContactRequestRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const run = async () => {
      setLoadError(null);

      const [c, p, prof, ag, m, subs, req] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("packages").select("id", { count: "exact", head: true }),
        supabase.from("user_profiles").select("user_id", { count: "exact", head: true }),
        supabase.from("age_groups").select("id", { count: "exact", head: true }),
        supabase.from("months").select("id", { count: "exact", head: true }),
        supabase.from("enrollments").select("id", { count: "exact", head: true }),
        supabase.from("contact_requests").select("id", { count: "exact", head: true }),
      ]);

      setCourseCount(c.count ?? 0);
      setPackageCount(p.count ?? 0);
      setUsersCount(prof.count ?? 0);
      setAgeGroupsCount(ag.count ?? 0);
      setMonthsCount(m.count ?? 0);
      setSubsCount(subs.count ?? 0);
      setRequestsCount(req.count ?? 0);

      const [coursesRes, enrRes, reqRes] = await Promise.all([
        supabase
          .from("courses")
          .select("id,slug,title_ar,title_en,theme,is_published,created_at")
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .from("enrollments")
          .select("id,user_id,course_id,status,start_at,end_at,created_at")
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("contact_requests")
          .select("id,full_name,phone,package_title,course_title,created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (coursesRes.error) throw new Error(coursesRes.error.message);
      if (enrRes.error) throw new Error(enrRes.error.message);
      if (reqRes.error) throw new Error(reqRes.error.message);

      const list = ((coursesRes.data ?? []) as any[]).map((r) => ({
        id: String(r.id),
        slug: String(r.slug),
        title_ar: r.title_ar ?? null,
        title_en: r.title_en ?? null,
        theme: r.theme ?? null,
        is_published: Boolean(r.is_published),
        created_at: String(r.created_at ?? ""),
      })) as CourseRow[];

      setCourses(list);

      const courseIds = list.map((x) => x.id).filter(Boolean);
      if (courseIds.length) {
        const [enrSmall, monthSmall, ageSmall] = await Promise.all([
          supabase.from("enrollments").select("course_id,user_id").in("course_id", courseIds),
          supabase.from("course_month_access").select("course_id,user_id").in("course_id", courseIds),
          supabase.from("course_age_group_access").select("course_id,user_id").in("course_id", courseIds),
        ]);

        if (!enrSmall.error && !monthSmall.error && !ageSmall.error) {
          const byCourse = new Map<string, Set<string>>();
          const add = (courseId: unknown, userId: unknown) => {
            const cId = String(courseId ?? "").trim();
            const uId = String(userId ?? "").trim();
            if (!cId || !uId) return;
            const set = byCourse.get(cId);
            if (set) set.add(uId);
            else byCourse.set(cId, new Set([uId]));
          };

          for (const row of (enrSmall.data ?? []) as Array<{ course_id: string; user_id: string }>) {
            add(row.course_id, row.user_id);
          }
          for (const row of (monthSmall.data ?? []) as Array<{ course_id: string; user_id: string }>) {
            add(row.course_id, row.user_id);
          }
          for (const row of (ageSmall.data ?? []) as Array<{ course_id: string; user_id: string }>) {
            add(row.course_id, row.user_id);
          }

          const map: Record<string, number> = {};
          for (const [courseId, set] of byCourse.entries()) map[courseId] = set.size;
          setSubsByCourseId(map);
        } else {
          setSubsByCourseId({});
        }
      } else {
        setSubsByCourseId({});
      }

      const enrollRows = ((enrRes.data ?? []) as any[]).map((r) => ({
        id: String(r.id),
        user_id: String(r.user_id),
        course_id: String(r.course_id),
        status: String(r.status ?? ""),
        start_at: String(r.start_at ?? ""),
        end_at: r.end_at ? String(r.end_at) : null,
        created_at: String(r.created_at ?? ""),
      })) as EnrollmentRow[];

      const recentCourseIds = Array.from(new Set(enrollRows.map((x) => x.course_id).filter(Boolean)));
      const recentUserIds = Array.from(new Set(enrollRows.map((x) => x.user_id).filter(Boolean)));

      const courseById = new Map<string, CourseRow>();
      if (recentCourseIds.length) {
        const cRows: CourseRow[] = [];
        for (const ids of chunk(recentCourseIds, 200)) {
          const r = await supabase.from("courses").select("id,slug,title_ar,title_en").in("id", ids);
          if (r.error) throw new Error(r.error.message);
          for (const it of (r.data ?? []) as any[]) {
            cRows.push({
              id: String(it.id),
              slug: String(it.slug),
              title_ar: it.title_ar ?? null,
              title_en: it.title_en ?? null,
              theme: null,
              is_published: true,
              created_at: "",
            });
          }
        }
        for (const c0 of cRows) courseById.set(String(c0.id), c0);
      }

      const profileByUser = new Map<string, ProfileRow>();
      if (recentUserIds.length) {
        for (const ids of chunk(recentUserIds, 200)) {
          const r = await supabase.from("user_profiles").select("user_id,full_name,phone").in("user_id", ids);
          if (r.error) throw new Error(r.error.message);
          for (const it of (r.data ?? []) as ProfileRow[]) profileByUser.set(String(it.user_id), it);
        }
      }

      const enrollmentViews: EnrollmentView[] = enrollRows.map((e) => {
        const prof0 = profileByUser.get(String(e.user_id)) ?? null;
        const c0 = courseById.get(String(e.course_id)) ?? null;
        const courseTitle = String(c0?.title_ar ?? c0?.title_en ?? c0?.slug ?? "—");
        const label = String(prof0?.full_name ?? prof0?.phone ?? e.user_id);
        return {
          id: String(e.id),
          userId: String(e.user_id),
          label,
          phone: prof0?.phone ?? null,
          courseTitle,
          status: String(e.status ?? ""),
          createdAt: String(e.created_at ?? ""),
        };
      });
      setRecentEnrollments(enrollmentViews);

      setRecentRequests((reqRes.data ?? []) as ContactRequestRow[]);
      setLoaded(true);
    };

    void run().catch((err) => {
      setLoadError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      setLoaded(true);
    });
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="الكورسات" value={courseCount} color="blue" Icon={IconBook} />
        <StatTile label="الباقات" value={packageCount} color="orange" Icon={IconSpark} />
        <StatTile label="المستخدمين" value={usersCount} color="green" Icon={IconUsers} />
        <StatTile label="اشتراكات" value={subsCount} color="purple" Icon={IconUsers} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="الأعمار" value={ageGroupsCount} color="blue" Icon={IconUsers} />
        <StatTile label="الشهور" value={monthsCount} color="orange" Icon={IconSpark} />
        <StatTile label="الطلبات" value={requestsCount} color="purple" Icon={IconUsers} />
        <StatTile label="مباشر" value={loaded ? 1 : 0} color="green" Icon={IconSpark} />
      </div>

      {loadError ? (
        <AdminCard>
          <div className="text-sm font-semibold text-slate-900">حدث خطأ</div>
          <div className="mt-2 text-sm text-slate-700" dir="ltr">
            {loadError}
          </div>
        </AdminCard>
      ) : null}

      <AdminCard className="p-0 overflow-hidden">
        <div className="bg-white px-5 py-4">
          <div className="text-base font-extrabold text-slate-900">إدارة الكورسات</div>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-slate-700">إضافة وتعديل الكورسات والمحتوى</div>
            <Link
              href="/admin/courses"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              فتح
            </Link>
          </div>
          <div className="mt-3 text-xs text-slate-500">{loaded ? "بيانات مباشرة" : "تحميل..."}</div>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-slate-900">الكورسات (سريع)</div>
            <div className="mt-1 text-xs text-slate-600">فتح إدارة الكورس أو مشاهدة المشتركين.</div>
          </div>
          <Link
            href="/admin/courses"
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
          >
            كل الكورسات
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 border border-slate-200">
            {loaded ? "لا توجد كورسات." : "تحميل..."}
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {courses.map((c0) => {
              const title = String(c0.title_ar ?? c0.title_en ?? c0.slug);
              const subs = subsByCourseId[c0.id] ?? 0;
              return (
                <div
                  key={c0.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 border border-slate-200"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
                        {c0.slug}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
                        مشتركين: {subs}
                      </span>
                      <span
                        className={
                          "rounded-full px-3 py-1 text-[11px] font-semibold " +
                          (c0.is_published
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200")
                        }
                      >
                        {c0.is_published ? "منشور" : "غير منشور"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/courses/${c0.slug}/subscribers`}
                      className="inline-flex h-9 items-center justify-center rounded-2xl bg-white px-4 text-xs font-semibold text-slate-700 border border-slate-200 transition hover:bg-slate-50"
                    >
                      مشتركين
                    </Link>
                    <Link
                      href={`/admin/courses/${c0.slug}`}
                      className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      إدارة
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>

      <div className="grid gap-3 lg:grid-cols-2">
        <AdminCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold text-slate-900">آخر الاشتراكات</div>
              <div className="mt-1 text-xs text-slate-600">آخر {recentEnrollments.length} عملية.</div>
            </div>
            <Link
              href="/admin/subscribers"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
            >
              إدارة
            </Link>
          </div>

          {recentEnrollments.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 border border-slate-200">
              {loaded ? "لا توجد بيانات." : "تحميل..."}
            </div>
          ) : (
            <div className="mt-4 grid gap-2">
              {recentEnrollments.map((e) => (
                <div key={e.id} className="rounded-2xl bg-white p-4 border border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{e.label}</div>
                      {e.phone ? <div className="mt-1 text-xs text-slate-500" dir="ltr">{e.phone}</div> : null}
                      <div className="mt-2 text-xs text-slate-600">{e.courseTitle}</div>
                    </div>
                    <div className="text-[11px] text-slate-500" dir="ltr">
                      {fmtDate(e.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold text-slate-900">آخر الطلبات</div>
              <div className="mt-1 text-xs text-slate-600">طلبات تواصل/اشتراك.</div>
            </div>
            <Link
              href="/admin/subscribers"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
            >
              متابعة
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 border border-slate-200">
              {loaded ? "لا توجد بيانات." : "تحميل..."}
            </div>
          ) : (
            <div className="mt-4 grid gap-2">
              {recentRequests.map((r) => {
                const title = String(r.full_name ?? r.phone ?? "طلب");
                const ref = String(r.package_title ?? r.course_title ?? "—");
                return (
                  <div key={String(r.id)} className="rounded-2xl bg-white p-4 border border-slate-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
                        {r.phone ? <div className="mt-1 text-xs text-slate-500" dir="ltr">{r.phone}</div> : null}
                        <div className="mt-2 text-xs text-slate-600">{ref}</div>
                      </div>
                      <div className="text-[11px] text-slate-500" dir="ltr">
                        {fmtDate(r.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AdminCard>
      </div>

      <div className="grid gap-3">
        <AdminCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">متابعة المستخدمين</div>
              <div className="mt-1 text-xs text-slate-600">المشتركين + الطلبات + منح اشتراك</div>
            </div>
            <Link
              href="/admin/subscribers"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
            >
              فتح
            </Link>
          </div>
        </AdminCard>

        <AdminCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">أكواد الكروت</div>
              <div className="mt-1 text-xs text-slate-600">توليد الأكواد ومتابعة الاستخدام</div>
            </div>
            <Link
              href="/admin/card-codes"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
            >
              فتح
            </Link>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
