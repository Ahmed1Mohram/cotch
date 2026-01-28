"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AdminCard } from "@/features/admin/ui/AdminCard";
import { Tabs, type TabItem } from "@/features/admin/ui/Tabs";
import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type CourseRow = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
};

type PackageRow = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  sort_order: number;
};

type PackageCourseRow = {
  package_id: string;
  packages:
    | { id: string; slug: string; title: string; theme: string; sort_order: number }
    | { id: string; slug: string; title: string; theme: string; sort_order: number }[]
    | null;
};

type ContactRequestRow = {
  user_id: string | null;
  course_id: string | null;
  package_id: string | null;
  package_title: string | null;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  age_years: number | null;
  height_cm: number | null;
  weight_kg: number | null;
};

type AuthUserRow = {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  profile: ProfileRow | null;
};

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  package_id: string | null;
  status: string;
  start_at: string;
  end_at: string | null;
  created_at: string;
};

type MonthAccessRow = {
  id: string;
  user_id: string;
  course_id: string;
  month_number: number;
  status: string;
  start_at: string;
  end_at: string | null;
  created_at: string;
};

type AgeAccessRow = {
  id: string;
  user_id: string;
  course_id: string;
  age_group_id: string;
  status: string;
  start_at: string;
  end_at: string | null;
  created_at: string;
};

type AccessSummary = {
  userId: string;
  profile: ProfileRow | null;
  enrollments: EnrollmentRow[];
  months: MonthAccessRow[];
  ages: AgeAccessRow[];
};

type TabKey = "subscribers" | "non";

const tabItems: Array<TabItem<TabKey>> = [
  { key: "subscribers", label: "المشتركين" },
  { key: "non", label: "غير مشتركين" },
];

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

function isActive(status: string | null | undefined, endAt: string | null | undefined) {
  const st = String(status ?? "").toLowerCase();
  if (st && st !== "active") return false;
  const e = String(endAt ?? "").trim();
  if (!e) return true;
  const d = new Date(e);
  if (Number.isNaN(d.getTime())) return true;
  return d.getTime() > Date.now();
}

function badgeCls(active: boolean) {
  return active
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : "bg-slate-100 text-slate-700 border border-slate-200";
}

export function AdminCourseSubscribersScreen({ slug }: { slug: string }) {
  const params = useParams<{ slug?: string | string[] }>();

  const effectiveSlug = useMemo(() => {
    if (slug) return slug;
    const p = params?.slug;
    if (Array.isArray(p)) return p[0] ?? "";
    return p ?? "";
  }, [params?.slug, slug]);

  const normalizedSlug = useMemo(() => String(effectiveSlug ?? "").trim().replace(/\/+$/, ""), [effectiveSlug]);

  const [tab, setTab] = useState<TabKey>("subscribers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [course, setCourse] = useState<CourseRow | null>(null);

  const [coursePackages, setCoursePackages] = useState<PackageRow[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequestRow[]>([]);
  const [packageFilter, setPackageFilter] = useState<string>("all");

  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [monthAccess, setMonthAccess] = useState<MonthAccessRow[]>([]);
  const [ageAccess, setAgeAccess] = useState<AgeAccessRow[]>([]);

  const [profilesByUser, setProfilesByUser] = useState<Map<string, ProfileRow>>(new Map());
  const [allProfiles, setAllProfiles] = useState<ProfileRow[]>([]);

  const [authUsers, setAuthUsers] = useState<AuthUserRow[]>([]);
  const [authUsersError, setAuthUsersError] = useState<string | null>(null);

  const [subQuery, setSubQuery] = useState("");
  const [nonQuery, setNonQuery] = useState("");

  useEffect(() => {
    if (!normalizedSlug) {
      setError("لم يتم إرسال معرّف الكورس (slug).");
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    const run = async () => {
      setLoading(true);
      setError(null);
      setAuthUsersError(null);

      const courseRes = await supabase
        .from("courses")
        .select("id,slug,title_ar,title_en")
        .eq("slug", normalizedSlug)
        .maybeSingle();

      if (courseRes.error || !courseRes.data) {
        setCourse(null);
        setEnrollments([]);
        setMonthAccess([]);
        setAgeAccess([]);
        setProfilesByUser(new Map());
        setAllProfiles([]);
        setError(courseRes.error?.message ?? "الكورس غير موجود");
        setLoading(false);
        return;
      }

      const c = courseRes.data as CourseRow;
      setCourse(c);

      const [enrRes, monRes, ageRes, profilesRes, directPkgsRes, pcRes, reqRes] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id,user_id,course_id,package_id,status,start_at,end_at,created_at")
          .eq("course_id", c.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("course_month_access")
          .select("id,user_id,course_id,month_number,status,start_at,end_at,created_at")
          .eq("course_id", c.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("course_age_group_access")
          .select("id,user_id,course_id,age_group_id,status,start_at,end_at,created_at")
          .eq("course_id", c.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_profiles")
          .select("user_id,full_name,phone,age_years,height_cm,weight_kg")
          .order("updated_at", { ascending: false })
          .limit(250),
        supabase
          .from("packages")
          .select("id,slug,title,theme,sort_order")
          .eq("course_id", c.id)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("package_courses")
          .select("package_id,packages(id,slug,title,theme,sort_order)")
          .eq("course_id", c.id),
        supabase
          .from("contact_requests")
          .select("user_id,course_id,package_id,package_title,created_at")
          .eq("course_id", c.id)
          .order("created_at", { ascending: false })
          .limit(5000),
      ]);

      if (enrRes.error) throw new Error(enrRes.error.message);
      if (monRes.error) throw new Error(monRes.error.message);
      if (ageRes.error) throw new Error(ageRes.error.message);
      if (profilesRes.error) throw new Error(profilesRes.error.message);
      if (directPkgsRes.error && pcRes.error) throw new Error(directPkgsRes.error?.message ?? pcRes.error?.message ?? "فشل تحميل الباقات");
      if (reqRes.error) throw new Error(reqRes.error.message);

      const enr = ((enrRes.data ?? []) as EnrollmentRow[]).map((r) => ({
        ...r,
        id: String((r as any).id),
        user_id: String((r as any).user_id),
        course_id: String((r as any).course_id),
        package_id: (r as any).package_id ? String((r as any).package_id) : null,
        status: String((r as any).status ?? ""),
        start_at: String((r as any).start_at ?? ""),
        end_at: (r as any).end_at ? String((r as any).end_at) : null,
        created_at: String((r as any).created_at ?? ""),
      }));

      const mon = ((monRes.data ?? []) as MonthAccessRow[]).map((r) => ({
        ...r,
        id: String((r as any).id),
        user_id: String((r as any).user_id),
        course_id: String((r as any).course_id),
        month_number: Number((r as any).month_number ?? 0),
        status: String((r as any).status ?? ""),
        start_at: String((r as any).start_at ?? ""),
        end_at: (r as any).end_at ? String((r as any).end_at) : null,
        created_at: String((r as any).created_at ?? ""),
      }));

      const ages = ((ageRes.data ?? []) as AgeAccessRow[]).map((r) => ({
        ...r,
        id: String((r as any).id),
        user_id: String((r as any).user_id),
        course_id: String((r as any).course_id),
        age_group_id: String((r as any).age_group_id ?? ""),
        status: String((r as any).status ?? ""),
        start_at: String((r as any).start_at ?? ""),
        end_at: (r as any).end_at ? String((r as any).end_at) : null,
        created_at: String((r as any).created_at ?? ""),
      }));

      const directPkgs = ((directPkgsRes.data ?? []) as any[])
        .map((p) => ({
          id: String(p.id),
          slug: String(p.slug),
          title: String(p.title ?? p.slug ?? "—"),
          theme: String(p.theme ?? "orange"),
          sort_order: Number(p.sort_order ?? 0),
        }))
        .filter((p) => Boolean(p.id) && Boolean(p.slug));

      const pcs = ((pcRes.data ?? []) as PackageCourseRow[])
        .flatMap((r) => (Array.isArray((r as any).packages) ? (r as any).packages : (r as any).packages ? [(r as any).packages] : []))
        .filter(Boolean)
        .map((p: any) => ({
          id: String(p.id),
          slug: String(p.slug),
          title: String(p.title ?? p.slug ?? "—"),
          theme: String(p.theme ?? "orange"),
          sort_order: Number(p.sort_order ?? 0),
        }))
        .filter((p) => Boolean(p.id) && Boolean(p.slug));

      const mergedPackages: PackageRow[] = [];
      const seen = new Set<string>();
      for (const p of [...directPkgs, ...pcs]) {
        if (!p.id || seen.has(p.id)) continue;
        seen.add(p.id);
        mergedPackages.push(p);
      }
      mergedPackages.sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
      setCoursePackages(mergedPackages);

      const reqs = ((reqRes.data ?? []) as any[]).map((r) => ({
        user_id: (r as any).user_id ? String((r as any).user_id) : null,
        course_id: (r as any).course_id ? String((r as any).course_id) : null,
        package_id: (r as any).package_id ? String((r as any).package_id) : null,
        package_title: (r as any).package_title ? String((r as any).package_title) : null,
        created_at: String((r as any).created_at ?? ""),
      })) as ContactRequestRow[];
      setContactRequests(reqs);

      const all = (profilesRes.data ?? []) as ProfileRow[];
      setAllProfiles(all);

      try {
        const res = await fetch(`/api/admin/users?limit=5000&includeProfiles=1`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          setAuthUsers([]);
          setAuthUsersError(txt || `HTTP ${res.status}`);
        } else {
          const json = (await res.json()) as { users?: AuthUserRow[] };
          setAuthUsers(Array.isArray(json.users) ? json.users : []);
        }
      } catch (e) {
        setAuthUsers([]);
        setAuthUsersError(e instanceof Error ? e.message : "تعذر تحميل المستخدمين");
      }

      const userIds = Array.from(
        new Set([
          ...enr.map((x) => x.user_id),
          ...mon.map((x) => x.user_id),
          ...ages.map((x) => x.user_id),
        ].filter(Boolean)),
      );

      const profiles: ProfileRow[] = [];
      if (userIds.length) {
        for (let i = 0; i < userIds.length; i += 200) {
          const ids = userIds.slice(i, i + 200);
          const res = await supabase
            .from("user_profiles")
            .select("user_id,full_name,phone,age_years,height_cm,weight_kg")
            .in("user_id", ids);
          if (res.error) throw new Error(res.error.message);
          profiles.push(...((res.data ?? []) as ProfileRow[]));
        }
      }

      const byUser = new Map<string, ProfileRow>();
      for (const p of profiles) byUser.set(String(p.user_id), p);
      setProfilesByUser(byUser);

      setEnrollments(enr);
      setMonthAccess(mon);
      setAgeAccess(ages);

      setPackageFilter((prev) => {
        if (prev === "all" || prev === "unknown") return prev;
        return mergedPackages.some((p) => p.id === prev) ? prev : "all";
      });

      setLoading(false);
    };

    void run().catch((err) => {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      setLoading(false);
    });
  }, [normalizedSlug]);

  const packageById = useMemo(() => new Map(coursePackages.map((p) => [p.id, p] as const)), [coursePackages]);

  const userPackageId = useMemo(() => {
    const map = new Map<string, { packageId: string | null; packageTitle: string | null }>();

    // Primary source of truth: enrollments.package_id (ordered by created_at desc)
    for (const e of enrollments) {
      const uid = String(e.user_id ?? "").trim();
      if (!uid) continue;
      if (map.has(uid)) continue;
      const pid = e.package_id ? String(e.package_id) : null;
      map.set(uid, { packageId: pid, packageTitle: null });
    }

    // Fallback: latest contact request per user
    // contactRequests is ordered by created_at desc from DB, so the first per user is the latest
    for (const r of contactRequests) {
      const uid = String(r.user_id ?? "").trim();
      if (!uid) continue;
      const existing = map.get(uid);
      if (existing?.packageId) continue;
      map.set(uid, { packageId: r.package_id ?? null, packageTitle: r.package_title ?? null });
    }

    return map;
  }, [contactRequests, enrollments]);

  const summaries = useMemo<AccessSummary[]>(() => {
    const map = new Map<string, AccessSummary>();

    const ensure = (userId: string) => {
      const k = String(userId);
      const existing = map.get(k);
      if (existing) return existing;
      const next: AccessSummary = {
        userId: k,
        profile: profilesByUser.get(k) ?? null,
        enrollments: [],
        months: [],
        ages: [],
      };
      map.set(k, next);
      return next;
    };

    for (const e of enrollments) ensure(e.user_id).enrollments.push(e);
    for (const m of monthAccess) ensure(m.user_id).months.push(m);
    for (const a of ageAccess) ensure(a.user_id).ages.push(a);

    const list = Array.from(map.values());
    list.sort((a, b) => {
      const aAt = a.enrollments[0]?.created_at ?? a.months[0]?.created_at ?? a.ages[0]?.created_at ?? "";
      const bAt = b.enrollments[0]?.created_at ?? b.months[0]?.created_at ?? b.ages[0]?.created_at ?? "";
      return String(bAt).localeCompare(String(aAt));
    });
    return list;
  }, [ageAccess, enrollments, monthAccess, profilesByUser]);

  const subscriberUserIds = useMemo(() => new Set(summaries.map((s) => s.userId)), [summaries]);

  const nonSubscribers = useMemo(() => {
    const q = nonQuery.trim().toLowerCase();
    const hasAuth = authUsers.length > 0;

    if (hasAuth) {
      const base = authUsers.filter((u) => !subscriberUserIds.has(String(u.id)));
      if (!q) return base;
      return base.filter((u) => {
        const name = (u.profile?.full_name ?? "").toLowerCase();
        const pPhone = (u.profile?.phone ?? "").toLowerCase();
        const email = (u.email ?? "").toLowerCase();
        const phone = (u.phone ?? "").toLowerCase();
        const id = String(u.id).toLowerCase();
        return name.includes(q) || pPhone.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
      });
    }

    const baseProfiles = allProfiles.filter((p) => !subscriberUserIds.has(String(p.user_id)));
    if (!q) return baseProfiles;
    return baseProfiles.filter((p) => {
      const name = (p.full_name ?? "").toLowerCase();
      const phone = (p.phone ?? "").toLowerCase();
      return name.includes(q) || phone.includes(q) || String(p.user_id).toLowerCase().includes(q);
    });
  }, [allProfiles, authUsers, nonQuery, subscriberUserIds]);

  const filteredSubscribers = useMemo(() => {
    const q = subQuery.trim().toLowerCase();
    if (!q) return summaries;
    return summaries.filter((s) => {
      const name = (s.profile?.full_name ?? "").toLowerCase();
      const phone = (s.profile?.phone ?? "").toLowerCase();
      return name.includes(q) || phone.includes(q) || s.userId.toLowerCase().includes(q);
    });
  }, [subQuery, summaries]);

  const packageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let unknown = 0;
    for (const s of filteredSubscribers) {
      const pid = userPackageId.get(s.userId)?.packageId ?? null;
      if (!pid) {
        unknown += 1;
        continue;
      }
      counts.set(pid, (counts.get(pid) ?? 0) + 1);
    }
    return { counts, unknown };
  }, [filteredSubscribers, userPackageId]);

  const visibleSubscribers = useMemo(() => {
    if (packageFilter === "all") return filteredSubscribers;
    if (packageFilter === "unknown") {
      return filteredSubscribers.filter((s) => !(userPackageId.get(s.userId)?.packageId ?? null));
    }
    return filteredSubscribers.filter((s) => (userPackageId.get(s.userId)?.packageId ?? null) === packageFilter);
  }, [filteredSubscribers, packageFilter, userPackageId]);

  const headerTitle = course?.title_ar ?? course?.title_en ?? course?.slug ?? normalizedSlug;

  const activeCount = useMemo(() => {
    let n = 0;
    for (const s of summaries) {
      const active =
        s.enrollments.some((x) => isActive(x.status, x.end_at)) ||
        s.months.some((x) => isActive(x.status, x.end_at)) ||
        s.ages.some((x) => isActive(x.status, x.end_at));
      if (active) n += 1;
    }
    return n;
  }, [summaries]);

  return (
    <div className="space-y-6" dir="rtl">
      <AdminCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-600">الكورس</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900 truncate">{headerTitle}</div>
            {course?.title_en ? (
              <div className="mt-1 text-xs text-slate-500" dir="ltr">
                {course.title_en}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Link href={`/admin/courses/${course?.slug ?? normalizedSlug}`} className="text-xs font-medium text-slate-600 hover:text-slate-900">
              رجوع لتفاصيل الكورس
            </Link>
            <Link href="/admin/courses" className="text-xs font-medium text-slate-600 hover:text-slate-900">
              رجوع للكورسات
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 px-3 py-3 border border-slate-200">
            مشتركين
            <div className="mt-1 text-sm font-semibold text-slate-900">{summaries.length}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-3 border border-slate-200">
            نشط
            <div className="mt-1 text-sm font-semibold text-slate-900">{activeCount}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-3 border border-slate-200">
            اشتراكات
            <div className="mt-1 text-sm font-semibold text-slate-900">{enrollments.length}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-3 border border-slate-200">
            شهور + كروت
            <div className="mt-1 text-sm font-semibold text-slate-900">{monthAccess.length + ageAccess.length}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <Tabs items={tabItems} value={tab} onChange={setTab} />
          {error ? <div className="text-xs text-rose-700">{error}</div> : null}
        </div>
      </AdminCard>

      {tab === "subscribers" ? (
        <AdminCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">المشتركين في الكورس</div>
            <input
              value={subQuery}
              onChange={(e) => setSubQuery(e.target.value)}
              placeholder="بحث بالاسم/الموبايل"
              className="h-10 w-full max-w-[260px] rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPackageFilter("all")}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-2xl border px-3 text-xs font-semibold transition",
                packageFilter === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
              )}
            >
              الكل
              <span className={cn("rounded-full px-2 py-0.5 text-[11px]", packageFilter === "all" ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700")}>{filteredSubscribers.length}</span>
            </button>

            {coursePackages.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPackageFilter(p.id)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-2xl border px-3 text-xs font-semibold transition",
                  packageFilter === p.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                )}
              >
                {p.title}
                <span className={cn("rounded-full px-2 py-0.5 text-[11px]", packageFilter === p.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700")}>{packageCounts.counts.get(p.id) ?? 0}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPackageFilter("unknown")}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-2xl border px-3 text-xs font-semibold transition",
                packageFilter === "unknown" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
              )}
            >
              غير محدد
              <span className={cn("rounded-full px-2 py-0.5 text-[11px]", packageFilter === "unknown" ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700")}>{packageCounts.unknown}</span>
            </button>
          </div>

          {loading ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 border border-slate-200">تحميل...</div>
          ) : visibleSubscribers.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 border border-slate-200">لا يوجد مشتركين.</div>
          ) : (
            <div className="mt-4 grid gap-3">
              {visibleSubscribers.map((s) => {
                const anyActive =
                  s.enrollments.some((x) => isActive(x.status, x.end_at)) ||
                  s.months.some((x) => isActive(x.status, x.end_at)) ||
                  s.ages.some((x) => isActive(x.status, x.end_at));

                const title =
                  s.profile?.full_name?.trim() || s.profile?.phone?.trim() || s.userId;

                const pkgInfo = userPackageId.get(s.userId) ?? null;
                const pkgLabel = pkgInfo?.packageId ? packageById.get(pkgInfo.packageId)?.title ?? pkgInfo.packageTitle : pkgInfo?.packageTitle;

                return (
                  <div
                    key={s.userId}
                    className="rounded-2xl bg-white p-4 border border-slate-200"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{title}</div>
                        {s.profile?.phone ? <div className="mt-1 text-xs text-slate-500" dir="ltr">{s.profile.phone}</div> : null}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", badgeCls(anyActive))}>
                            {anyActive ? "نشط" : "غير نشط"}
                          </span>
                          {pkgLabel ? (
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
                              {pkgLabel}
                            </span>
                          ) : null}
                          {s.enrollments.length ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
                              اشتراك كورس ({s.enrollments.length})
                            </span>
                          ) : null}
                          {s.months.length ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
                              شهور ({s.months.length})
                            </span>
                          ) : null}
                          {s.ages.length ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
                              كروت ({s.ages.length})
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        آخر تحديث: {fmtDate(s.enrollments[0]?.created_at ?? s.months[0]?.created_at ?? s.ages[0]?.created_at)}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-[11px] text-slate-600 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-3 py-3 border border-slate-200">
                        بداية
                        <div className="mt-1 text-xs font-semibold text-slate-900">{fmtDate(s.enrollments[0]?.start_at ?? s.months[0]?.start_at ?? s.ages[0]?.start_at)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-3 border border-slate-200">
                        نهاية
                        <div className="mt-1 text-xs font-semibold text-slate-900">{fmtDate(s.enrollments[0]?.end_at ?? s.months[0]?.end_at ?? s.ages[0]?.end_at)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AdminCard>
      ) : (
        <AdminCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">غير مشتركين</div>
              <div className="mt-1 text-xs text-slate-600">
                {authUsers.length
                  ? `قائمة مبنية على ${authUsers.length} حساب (من auth).`
                  : `قائمة مبنية على آخر ${allProfiles.length} حساب (من user_profiles).`}
              </div>
              {authUsersError ? <div className="mt-1 text-xs text-rose-700">{authUsersError}</div> : null}
            </div>
            <input
              value={nonQuery}
              onChange={(e) => setNonQuery(e.target.value)}
              placeholder="بحث بالاسم/الموبايل"
              className="h-10 w-full max-w-[260px] rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          {loading ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 border border-slate-200">تحميل...</div>
          ) : nonSubscribers.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 border border-slate-200">لا يوجد.</div>
          ) : (
            <div className="mt-4 grid gap-2">
              {(nonSubscribers as any[]).slice(0, 120).map((row) => {
                const isAuth = Boolean((row as AuthUserRow).id && (row as any).user_id === undefined);
                const u = isAuth ? (row as AuthUserRow) : null;
                const p = !isAuth ? (row as ProfileRow) : null;

                const id = String(isAuth ? u?.id : p?.user_id);
                const title =
                  (u?.profile?.full_name?.trim() || p?.full_name?.trim()) ||
                  (u?.profile?.phone?.trim() || p?.phone?.trim()) ||
                  u?.email?.trim() ||
                  u?.phone?.trim() ||
                  id;

                const phone = u?.profile?.phone ?? p?.phone ?? u?.phone ?? null;
                const secondary = u?.email ?? null;
                return (
                  <div key={id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 border border-slate-200">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
                      {phone ? <div className="mt-1 text-xs text-slate-500" dir="ltr">{phone}</div> : null}
                      {secondary ? <div className="mt-1 text-xs text-slate-500" dir="ltr">{secondary}</div> : null}
                    </div>
                    <Link
                      href="/admin/subscribers"
                      className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-100 px-4 text-xs font-semibold text-slate-800 transition hover:bg-slate-200"
                    >
                      إدارة الاشتراكات
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </AdminCard>
      )}
    </div>
  );
}
