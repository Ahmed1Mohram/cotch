"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminCard } from "@/features/admin/ui/AdminCard";
import { Accordion } from "@/features/admin/ui/Accordion";
import { Tabs, type TabItem } from "@/features/admin/ui/Tabs";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type CourseRow = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
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

type PackageRow = {
  id: string;
  slug: string;
  title: string;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  age_years: number | null;
  height_cm: number | null;
  weight_kg: number | null;
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

type DeviceRow = {
  device_id: string;
  user_id: string | null;
  last_seen: string;
};

type DeviceBanRow = {
  device_id: string;
  active: boolean;
  banned_until: string | null;
  reason: string | null;
};

type ContactRequestRow = {
  id: string;
  user_id: string | null;
  device_id: string | null;
  package_id: string | null;
  package_title: string | null;
  course_id: string | null;
  course_title: string | null;
  full_name: string | null;
  phone: string | null;
  age_years: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  club: string | null;
  message: string | null;
  created_at: string;
};

type EnrollmentView = {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  status: string;
  startAt: string;
  endAt: string | null;
  createdAt: string;
  profile?: ProfileRow;
  devices: DeviceRow[];
  bannedDevices: Set<string>;
};

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function normalizeNum(v: number | null | undefined) {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v;
}

function bucket(value: number | null, step: number) {
  if (value === null) return "—";
  const start = Math.floor(value / step) * step;
  const end = start + (step - 1);
  return `${start}-${end}`;
}

function groupBy<T>(items: T[], getKey: (it: T) => string) {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = getKey(it) || "—";
    const list = map.get(k);
    if (list) list.push(it);
    else map.set(k, [it]);
  }
  return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
}

function toIntOrNull(v: string) {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export function AdminSubscribersScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"subs" | "requests" | "grant">("subs");
  const [groupMode, setGroupMode] = useState<"course" | "similar">("course");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);

  const [enrollments, setEnrollments] = useState<EnrollmentView[]>([]);
  const [requests, setRequests] = useState<ContactRequestRow[]>([]);

  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [grantUsers, setGrantUsers] = useState<ProfileRow[]>([]);
  const [grantQuery, setGrantQuery] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantLoaded, setGrantLoaded] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [grantCourses, setGrantCourses] = useState<CourseRow[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const [grantCards, setGrantCards] = useState<PlayerCardRow[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [cardsLoading, setCardsLoading] = useState(false);

  const [grantNoExpiry, setGrantNoExpiry] = useState(false);
  const [grantDurationValue, setGrantDurationValue] = useState("30");
  const [grantDurationUnit, setGrantDurationUnit] = useState<"hour" | "day">("day");

  const pushNotice = (kind: "success" | "error" | "info", text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => {
      setNotice((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const run = async () => {
      const res = await supabase.from("packages").select("id,slug,title").order("created_at", { ascending: false });
      if (res.error) throw new Error(res.error.message);
      setPackages((res.data ?? []) as PackageRow[]);
    };

    void run().catch(() => {
      setPackages([]);
    });
  }, []);

  useEffect(() => {
    if (tab !== "grant") return;
    if (grantLoaded) return;

    const supabase = createSupabaseBrowserClient();
    const run = async () => {
      setGrantLoading(true);
      const res = await supabase
        .from("user_profiles")
        .select("user_id,full_name,phone,age_years,height_cm,weight_kg")
        .order("updated_at", { ascending: false })
        .limit(60);
      if (res.error) throw new Error(res.error.message);
      setGrantUsers((res.data ?? []) as ProfileRow[]);
      setGrantLoaded(true);
      setGrantLoading(false);
    };

    void run().catch(() => {
      setGrantUsers([]);
      setGrantLoaded(true);
      setGrantLoading(false);
    });
  }, [tab, grantLoaded]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const run = async () => {
      if (!selectedPackageId) {
        setGrantCourses([]);
        setSelectedCourseId("");
        return;
      }

      const res = await supabase
        .from("package_courses")
        .select("course_id,courses(id,slug,title_ar,title_en)")
        .eq("package_id", selectedPackageId);
      if (res.error) throw new Error(res.error.message);

      const rows = (res.data ?? []) as Array<{ course_id: string; courses: CourseRow | CourseRow[] | null }>;
      const courses = rows
        .flatMap((r) => (Array.isArray(r.courses) ? r.courses : r.courses ? [r.courses] : []))
        .filter(Boolean) as CourseRow[];
      setGrantCourses(courses);
      setSelectedCourseId("");
    };

    void run().catch(() => {
      setGrantCourses([]);
      setSelectedCourseId("");
    });
  }, [selectedPackageId]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const run = async () => {
      const courseId = selectedCourseId.trim();
      const packageId = selectedPackageId.trim();
      if (!courseId) {
        setGrantCards([]);
        setSelectedCardId("");
        return;
      }

      setCardsLoading(true);

      const agRes = await supabase
        .from("age_groups")
        .select("id,title,sort_order,created_at")
        .eq("course_id", courseId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (agRes.error) {
        setGrantCards([]);
        setSelectedCardId("");
        setCardsLoading(false);
        return;
      }

      let agIds = ((agRes.data as any[]) ?? []).map((r) => String(r.id)).filter(Boolean);

      if (packageId && agIds.length) {
        const allowRes = await supabase
          .from("package_course_age_groups")
          .select("age_group_id")
          .eq("package_id", packageId)
          .eq("course_id", courseId);

        if (allowRes.error) {
          setGrantCards([]);
          setSelectedCardId("");
          setCardsLoading(false);
          return;
        }

        const allowed = ((allowRes.data as any[]) ?? [])
          .map((r) => String(r.age_group_id ?? ""))
          .filter(Boolean);

        if (allowed.length) {
          const allowSet = new Set(allowed);
          agIds = agIds.filter((id) => allowSet.has(id));
        }
      }

      if (!agIds.length) {
        setGrantCards([]);
        setSelectedCardId("");
        setCardsLoading(false);
        return;
      }

      const agTitleById = new Map(
        ((agRes.data as any[]) ?? []).map((r) => [String(r.id), (r as any).title ?? null] as const),
      );

      const pcRes = await supabase
        .from("player_cards")
        .select("id,age_group_id,age,height_cm,weight_kg,note,sort_order,created_at")
        .in("age_group_id", agIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (pcRes.error) {
        setGrantCards([]);
        setSelectedCardId("");
        setCardsLoading(false);
        return;
      }

      const list: PlayerCardRow[] = ((pcRes.data as any[]) ?? []).map((r) => ({
        id: String(r.id),
        age_group_id: String(r.age_group_id),
        age: (r as any).age ?? null,
        height_cm: (r as any).height_cm ?? null,
        weight_kg: (r as any).weight_kg ?? null,
        note: (r as any).note ?? null,
        sort_order: Number((r as any).sort_order ?? 0),
        created_at: String((r as any).created_at ?? ""),
        age_group_title: agTitleById.get(String(r.age_group_id)) ?? null,
      }));

      setGrantCards(list);
      setSelectedCardId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev;
        return list[0]?.id ?? "";
      });
      setCardsLoading(false);
    };

    void run().catch(() => {
      setGrantCards([]);
      setSelectedCardId("");
      setCardsLoading(false);
    });
  }, [selectedCourseId, selectedPackageId]);

  async function searchUsers() {
    const q = grantQuery.trim();
    if (!q) return;

    const supabase = createSupabaseBrowserClient();
    setGrantLoading(true);
    setNotice(null);

    const res = await supabase
      .from("user_profiles")
      .select("user_id,full_name,phone,age_years,height_cm,weight_kg")
      .or(`phone.ilike.%${q}%,full_name.ilike.%${q}%`)
      .order("updated_at", { ascending: false })
      .limit(60);

    if (res.error) {
      pushNotice("error", res.error.message);
      setGrantLoading(false);
      return;
    }

    setGrantUsers((res.data ?? []) as ProfileRow[]);
    setGrantLoading(false);
  }

  async function grantAccessNow() {
    if (!selectedUserId) {
      pushNotice("error", "اختر مستخدم.");
      return;
    }
    if (!selectedPackageId) {
      pushNotice("error", "اختر باقة.");
      return;
    }
    if (!selectedCourseId) {
      pushNotice("error", "اختر كورس.");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    setActionBusy(true);
    setNotice(null);

    const nowMs = Date.parse(new Date().toISOString());
    const nowIso = new Date(nowMs).toISOString();

    let requestedEndAt: string | null = null;
    if (!grantNoExpiry) {
      const v = toIntOrNull(grantDurationValue);
      if (!v || v <= 0) {
        pushNotice("error", "حدد مدة صحيحة.");
        setActionBusy(false);
        return;
      }

      const unitMs = grantDurationUnit === "hour" ? 3_600_000 : 86_400_000;
      requestedEndAt = new Date(nowMs + v * unitMs).toISOString();
    }

    let adminId: string | null = null;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      adminId = user?.id ? String(user.id) : null;
    } catch {
      adminId = null;
    }

    const existingRes = await supabase
      .from("enrollments")
      .select("id,start_at,end_at")
      .eq("user_id", selectedUserId)
      .eq("course_id", selectedCourseId)
      .maybeSingle();

    const existingStartAt = existingRes.data?.start_at ? String(existingRes.data.start_at) : null;
    const existingEndAt = existingRes.data?.end_at ? String(existingRes.data.end_at) : null;

    const finalStartAt = existingStartAt
      ? new Date(Math.min(Date.parse(existingStartAt), nowMs)).toISOString()
      : nowIso;

    let finalEndAt = requestedEndAt;
    if (grantNoExpiry) {
      finalEndAt = null;
    } else if (existingEndAt && requestedEndAt) {
      finalEndAt = new Date(Math.max(Date.parse(existingEndAt), Date.parse(requestedEndAt))).toISOString();
    }

    const enrRes = await supabase
      .from("enrollments")
      .upsert(
        {
          user_id: selectedUserId,
          course_id: selectedCourseId,
          package_id: selectedPackageId,
          status: "active",
          start_at: finalStartAt,
          end_at: finalEndAt,
          source: "admin",
          created_by: adminId,
        },
        { onConflict: "user_id,course_id" },
      );

    if (enrRes.error) {
      pushNotice("error", enrRes.error.message);
      setActionBusy(false);
      return;
    }

    pushNotice("success", "تم فتح الكورس فورًا.");
    setActionBusy(false);
  }

  const openCards = () => {
    const pkg = packages.find((p) => p.id === selectedPackageId) ?? null;
    const course = grantCourses.find((c) => c.id === selectedCourseId) ?? null;

    if (!course?.slug) {
      pushNotice("error", "اختر كورس.");
      return;
    }

    const qs = new URLSearchParams();
    if (pkg?.slug) qs.set("pkg", pkg.slug);

    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    router.push(`/programs/${encodeURIComponent(course.slug)}${suffix}`);
  };

  const openSelectedCard = () => {
    const pkg = packages.find((p) => p.id === selectedPackageId) ?? null;
    const course = grantCourses.find((c) => c.id === selectedCourseId) ?? null;
    const cardId = selectedCardId.trim();

    if (!course?.slug) {
      pushNotice("error", "اختر كورس.");
      return;
    }

    if (!cardId) {
      pushNotice("error", "اختر كارت.");
      return;
    }

    const qs = new URLSearchParams();
    if (pkg?.slug) qs.set("pkg", pkg.slug);

    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    router.push(`/programs/${encodeURIComponent(course.slug)}/card/${encodeURIComponent(cardId)}${suffix}`);
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const run = async () => {
      setLoading(true);
      setError(null);

      const [enrRes, reqRes] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id,user_id,course_id,status,start_at,end_at,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("contact_requests")
          .select(
            "id,user_id,device_id,package_id,package_title,course_id,course_title,full_name,phone,age_years,height_cm,weight_kg,club,message,created_at",
          )
          .order("created_at", { ascending: false }),
      ]);

      if (enrRes.error) throw new Error(enrRes.error.message);
      if (reqRes.error) throw new Error(reqRes.error.message);

      const enrollRows = (enrRes.data ?? []) as EnrollmentRow[];
      const reqRows = (reqRes.data ?? []) as ContactRequestRow[];

      const userIds = Array.from(new Set(enrollRows.map((r) => r.user_id).filter(Boolean)));
      const courseIds = Array.from(new Set(enrollRows.map((r) => r.course_id).filter(Boolean)));

      const courses: CourseRow[] = [];
      for (const ids of chunk(courseIds, 200)) {
        const res = await supabase.from("courses").select("id,slug,title_ar,title_en").in("id", ids);
        if (res.error) throw new Error(res.error.message);
        courses.push(...((res.data ?? []) as CourseRow[]));
      }

      const profiles: ProfileRow[] = [];
      for (const ids of chunk(userIds, 200)) {
        const res = await supabase
          .from("user_profiles")
          .select("user_id,full_name,phone,age_years,height_cm,weight_kg")
          .in("user_id", ids);
        if (res.error) throw new Error(res.error.message);
        profiles.push(...((res.data ?? []) as ProfileRow[]));
      }

      const devices: DeviceRow[] = [];
      for (const ids of chunk(userIds, 200)) {
        const res = await supabase
          .from("user_devices")
          .select("device_id,user_id,last_seen")
          .in("user_id", ids)
          .order("last_seen", { ascending: false });
        if (res.error) throw new Error(res.error.message);
        devices.push(...((res.data ?? []) as DeviceRow[]));
      }

      const deviceIds = Array.from(new Set(devices.map((d) => d.device_id).filter(Boolean)));

      const bans: DeviceBanRow[] = [];
      for (const ids of chunk(deviceIds, 200)) {
        const res = await supabase
          .from("device_bans")
          .select("device_id,active,banned_until,reason")
          .in("device_id", ids)
          .eq("active", true);
        if (res.error) throw new Error(res.error.message);
        bans.push(...((res.data ?? []) as DeviceBanRow[]));
      }

      const courseById = new Map(courses.map((c) => [String(c.id), c] as const));
      const profileByUser = new Map(profiles.map((p) => [String(p.user_id), p] as const));
      const devicesByUser = new Map<string, DeviceRow[]>();
      for (const d of devices) {
        if (!d.user_id) continue;
        const key = String(d.user_id);
        const list = devicesByUser.get(key);
        if (list) list.push(d);
        else devicesByUser.set(key, [d]);
      }

      const bannedByDevice = new Set(bans.filter((b) => b.active).map((b) => String(b.device_id)));

      const views: EnrollmentView[] = enrollRows.map((r) => {
        const course = courseById.get(String(r.course_id));
        const profile = profileByUser.get(String(r.user_id));
        const userDevices = devicesByUser.get(String(r.user_id)) ?? [];
        const bannedDevices = new Set(userDevices.map((d) => d.device_id).filter((id) => bannedByDevice.has(id)));

        return {
          id: String(r.id),
          userId: String(r.user_id),
          courseId: String(r.course_id),
          courseTitle: String(course?.title_ar ?? course?.title_en ?? course?.slug ?? "—"),
          status: String(r.status ?? ""),
          startAt: String(r.start_at ?? ""),
          endAt: r.end_at ? String(r.end_at) : null,
          createdAt: String(r.created_at ?? ""),
          profile,
          devices: userDevices,
          bannedDevices,
        };
      });

      setEnrollments(views);
      setRequests(reqRows);
      setLoading(false);
    };

    void run().catch((err) => {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      setLoading(false);
    });
  }, []);

  const tabs: Array<TabItem<"subs" | "requests" | "grant">> = useMemo(
    () => [
      { key: "subs", label: "الاشتراكات" },
      { key: "requests", label: "الطلبات" },
      { key: "grant", label: "فتح كورس" },
    ],
    [],
  );

  const groupingTabs: Array<TabItem<"course" | "similar">> = useMemo(
    () => [
      { key: "course", label: "حسب الكورس" },
      { key: "similar", label: "متشابه" },
    ],
    [],
  );

  async function stopEnrollment(enrollmentId: string) {
    const supabase = createSupabaseBrowserClient();
    const ok = window.confirm("إيقاف الاشتراك لهذا المستخدم؟");
    if (!ok) return;

    setActionBusy(true);
    setNotice(null);

    const res = await supabase
      .from("enrollments")
      .update({ status: "inactive", end_at: new Date().toISOString() })
      .eq("id", enrollmentId);

    if (res.error) {
      pushNotice("error", res.error.message);
      setActionBusy(false);
      return;
    }

    setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? { ...e, status: "inactive" } : e)));
    pushNotice("success", "تم إيقاف الاشتراك.");
    setActionBusy(false);
  }

  async function banDevice(deviceId: string) {
    const supabase = createSupabaseBrowserClient();
    const reason = window.prompt("سبب الحظر؟ (اختياري)") ?? "";

    setActionBusy(true);
    setNotice(null);

    const insertRes = await supabase
      .from("device_bans")
      .insert({ device_id: deviceId, active: true, reason: reason.trim() || null });

    if (insertRes.error) {
      const updateRes = await supabase
        .from("device_bans")
        .update({ active: true, reason: reason.trim() || null })
        .eq("device_id", deviceId)
        .eq("active", true);

      if (updateRes.error) {
        pushNotice("error", insertRes.error.message);
        setActionBusy(false);
        return;
      }
    }

    setEnrollments((prev) =>
      prev.map((e) => {
        const hasDevice = e.devices.some((d) => d.device_id === deviceId);
        if (!hasDevice) return e;
        const next = new Set(Array.from(e.bannedDevices));
        next.add(deviceId);
        return { ...e, bannedDevices: next };
      }),
    );

    pushNotice("success", "تم تحديث حالة الجهاز.");
    setActionBusy(false);
  }

  async function unbanDevice(deviceId: string) {
    const supabase = createSupabaseBrowserClient();
    const ok = window.confirm("فك الحظر عن هذا الجهاز؟");
    if (!ok) return;

    setActionBusy(true);
    setNotice(null);

    const res = await supabase.from("device_bans").update({ active: false }).eq("device_id", deviceId).eq("active", true);

    if (res.error) {
      pushNotice("error", res.error.message);
      setActionBusy(false);
      return;
    }

    setEnrollments((prev) =>
      prev.map((e) => {
        const next = new Set(Array.from(e.bannedDevices));
        next.delete(deviceId);
        return { ...e, bannedDevices: next };
      }),
    );

    pushNotice("success", "تم فك الحظر عن الجهاز.");
    setActionBusy(false);
  }

  const groupedEnrollments = useMemo(() => {
    if (groupMode === "course") {
      return groupBy(enrollments, (e) => e.courseTitle);
    }

    return groupBy(enrollments, (e) => {
      const p = e.profile;
      const age = bucket(normalizeNum(p?.age_years ?? null), 2);
      const h = bucket(normalizeNum(p?.height_cm ?? null), 5);
      const w = bucket(normalizeNum(p?.weight_kg ?? null), 5);
      return `عمر ${age} • طول ${h} • وزن ${w}`;
    });
  }, [enrollments, groupMode]);

  const groupedRequests = useMemo(() => {
    if (groupMode === "course") {
      return groupBy(requests, (r) => String(r.course_title ?? r.package_title ?? "—"));
    }

    return groupBy(requests, (r) => {
      const age = bucket(normalizeNum(r.age_years ?? null), 2);
      const h = bucket(normalizeNum(r.height_cm ?? null), 5);
      const w = bucket(normalizeNum(r.weight_kg ?? null), 5);
      return `عمر ${age} • طول ${h} • وزن ${w}`;
    });
  }, [requests, groupMode]);

  return (
    <div className="space-y-5" dir="rtl">
      <AdminCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-base font-extrabold text-slate-900">المشتركين</div>
            <div className="mt-1 text-sm text-slate-600">الاشتراكات + طلبات التواصل + حظر الأجهزة.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs items={tabs} value={tab} onChange={setTab} />
            <Tabs items={groupingTabs} value={groupMode} onChange={setGroupMode} />
          </div>
        </div>
        <div
          className={
            "mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs " +
            (error || notice?.kind === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : loading || actionBusy || notice?.kind === "info"
                ? "border-slate-200 bg-slate-50 text-slate-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700")
          }
        >
          {loading
            ? "تحميل..."
            : error
              ? error
              : actionBusy
                ? "جاري تنفيذ..."
                : notice
                  ? notice.text
                  : "بيانات مباشرة"}
        </div>
      </AdminCard>

      {tab === "subs" ? (
        <div className="space-y-4">
          {!loading && !error && groupedEnrollments.length === 0 ? (
            <AdminCard className="bg-slate-50">
              <div className="text-sm font-semibold text-slate-900">لا توجد اشتراكات</div>
              <div className="mt-1 text-sm text-slate-600">عند إضافة مشتركين ستظهر هنا تلقائيًا.</div>
            </AdminCard>
          ) : null}

          {groupedEnrollments.map(([groupTitle, items]) => (
            <Accordion key={groupTitle} title={groupTitle} subtitle={`${items.length} مشترك`} defaultOpen={items.length <= 15}>
              <div className="overflow-auto">
                <table className="min-w-[920px] w-full text-right text-sm">
                  <thead className="text-xs text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="py-3 font-medium">الاسم</th>
                      <th className="py-3 font-medium">الهاتف</th>
                      <th className="py-3 font-medium">العمر</th>
                      <th className="py-3 font-medium">الطول</th>
                      <th className="py-3 font-medium">الوزن</th>
                      <th className="py-3 font-medium">الأجهزة</th>
                      <th className="py-3 font-medium">الحالة</th>
                      <th className="py-3 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((e) => {
                      const p = e.profile;
                      const name = p?.full_name ?? "—";
                      const phone = p?.phone ?? "—";
                      const age = p?.age_years ?? null;
                      const h = p?.height_cm ?? null;
                      const w = p?.weight_kg ?? null;

                      return (
                        <tr key={e.id} className="border-b border-slate-200 text-slate-900 hover:bg-slate-50">
                          <td className="py-3">{name}</td>
                          <td className="py-3">{phone}</td>
                          <td className="py-3">{age ?? "—"}</td>
                          <td className="py-3">{h ?? "—"}</td>
                          <td className="py-3">{w ?? "—"}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              {e.devices.length ? (
                                e.devices.slice(0, 3).map((d) => {
                                  const banned = e.bannedDevices.has(d.device_id);
                                  return (
                                    <button
                                      key={d.device_id}
                                      type="button"
                                      onClick={() => (banned ? unbanDevice(d.device_id) : banDevice(d.device_id))}
                                      disabled={actionBusy}
                                      className={
                                        "inline-flex h-8 items-center justify-center rounded-full border px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 " +
                                        (banned
                                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 focus-visible:ring-rose-200"
                                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 focus-visible:ring-slate-200")
                                      }
                                      title={d.device_id}
                                    >
                                      {banned ? "محظور" : "جهاز"}
                                    </button>
                                  );
                                })
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <span
                              className={
                                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium " +
                                (e.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200")
                              }
                            >
                              {e.status === "active" ? "نشط" : "موقوف"}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              {e.status === "active" ? (
                                <button
                                  type="button"
                                  onClick={() => stopEnrollment(e.id)}
                                  disabled={actionBusy}
                                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                                >
                                  إيقاف
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Accordion>
          ))}
        </div>
      ) : null}

      {tab === "requests" ? (
        <div className="space-y-4">
          {!loading && !error && groupedRequests.length === 0 ? (
            <AdminCard className="bg-slate-50">
              <div className="text-sm font-semibold text-slate-900">لا توجد طلبات</div>
              <div className="mt-1 text-sm text-slate-600">طلبات التواصل ستظهر هنا عند وصولها.</div>
            </AdminCard>
          ) : null}

          {groupedRequests.map(([groupTitle, items]) => (
            <Accordion key={groupTitle} title={groupTitle} subtitle={`${items.length} رسالة`} defaultOpen={items.length <= 15}>
              <div className="overflow-auto">
                <table className="min-w-[980px] w-full text-right text-sm">
                  <thead className="text-xs text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="py-3 font-medium">الاسم</th>
                      <th className="py-3 font-medium">الهاتف</th>
                      <th className="py-3 font-medium">الباقة</th>
                      <th className="py-3 font-medium">الكورس</th>
                      <th className="py-3 font-medium">العمر</th>
                      <th className="py-3 font-medium">الطول</th>
                      <th className="py-3 font-medium">الوزن</th>
                      <th className="py-3 font-medium">النادي</th>
                      <th className="py-3 font-medium">رسالة</th>
                      <th className="py-3 font-medium">جهاز</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r.id} className="border-b border-slate-200 text-slate-900 hover:bg-slate-50">
                        <td className="py-3">{r.full_name ?? "—"}</td>
                        <td className="py-3">{r.phone ?? "—"}</td>
                        <td className="py-3">{r.package_title ?? "—"}</td>
                        <td className="py-3">{r.course_title ?? "—"}</td>
                        <td className="py-3">{r.age_years ?? "—"}</td>
                        <td className="py-3">{r.height_cm ?? "—"}</td>
                        <td className="py-3">{r.weight_kg ?? "—"}</td>
                        <td className="py-3">{r.club ?? "—"}</td>
                        <td className="py-3 max-w-[320px] truncate" title={r.message ?? ""}>
                          {r.message ?? "—"}
                        </td>
                        <td className="py-3">
                          {r.device_id ? (
                            <button
                              type="button"
                              onClick={() => banDevice(String(r.device_id))}
                              disabled={actionBusy}
                              className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
                              title={String(r.device_id)}
                            >
                              حظر
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Accordion>
          ))}
        </div>
      ) : null}

      {tab === "grant" ? (
        <div className="space-y-4">
          <AdminCard>
            <div className="text-lg font-semibold text-slate-900">فتح كورس لمستخدم (بدون أكواد)</div>
            <div className="mt-1 text-sm text-slate-600">اختر المستخدم والباقه والكورس ثم افتح فورًا.</div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
              <input
                value={grantQuery}
                onChange={(e) => setGrantQuery(e.target.value)}
                placeholder="ابحث بالاسم أو رقم الهاتف"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              <button
                type="button"
                onClick={() => void searchUsers()}
                disabled={grantLoading}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
              >
                بحث
              </button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">المستخدم</div>
                <div className="mt-2 space-y-2">
                  {grantUsers.length ? (
                    grantUsers.slice(0, 20).map((u) => {
                      const isActive = selectedUserId === String(u.user_id);
                      const label = String(u.full_name ?? u.phone ?? u.user_id);
                      return (
                        <button
                          key={u.user_id}
                          type="button"
                          onClick={() => setSelectedUserId(String(u.user_id))}
                          className={
                            "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-right text-sm transition " +
                            (isActive
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50")
                          }
                        >
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{label}</div>
                            <div className="mt-1 truncate text-xs text-slate-500">{u.phone ?? "—"}</div>
                          </div>
                          <div className="text-xs text-slate-500">{u.age_years ?? "—"}</div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-500">{grantLoading ? "تحميل..." : "لا يوجد نتائج"}</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid gap-3">
                  <label className="block">
                    <div className="mb-1 text-sm font-semibold text-slate-900">الباقة</div>
                    <select
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="">اختر</option>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <div className="mb-1 text-sm font-semibold text-slate-900">الكورس</div>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      disabled={!selectedPackageId}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50"
                    >
                      <option value="">اختر</option>
                      {grantCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title_ar ?? c.title_en ?? c.slug}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <div className="mb-1 text-sm font-semibold text-slate-900">الكارت</div>
                    <select
                      value={selectedCardId}
                      onChange={(e) => setSelectedCardId(e.target.value)}
                      disabled={!selectedCourseId || cardsLoading}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50"
                    >
                      <option value="">{cardsLoading ? "تحميل..." : "اختر"}</option>
                      {grantCards.map((c) => {
                        const title = c.age_group_title ? `(${c.age_group_title}) ` : "";
                        const age = c.age ?? "—";
                        const h = c.height_cm ?? "—";
                        const w = c.weight_kg ?? "—";
                        return (
                          <option key={c.id} value={c.id}>
                            {`${title}عمر ${age} • طول ${h} • وزن ${w}`}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="text-sm font-semibold text-slate-900">مدة التفعيل</div>
                    <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={grantNoExpiry}
                        onChange={(e) => setGrantNoExpiry(e.target.checked)}
                        className="h-4 w-4"
                      />
                      بدون مدة (مفتوح)
                    </label>

                    {!grantNoExpiry ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px]">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={grantDurationValue}
                          onChange={(e) => setGrantDurationValue(e.target.value)}
                          placeholder="مثال: 30"
                          inputMode="numeric"
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        />
                        <select
                          value={grantDurationUnit}
                          onChange={(e) => setGrantDurationUnit(e.target.value as any)}
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        >
                          <option value="hour">ساعات</option>
                          <option value="day">أيام</option>
                        </select>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => void grantAccessNow()}
                    disabled={actionBusy || !selectedUserId || !selectedPackageId || !selectedCourseId}
                    className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    فتح فوري
                  </button>

                  <button
                    type="button"
                    onClick={openCards}
                    disabled={actionBusy || !selectedCourseId}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-900 border border-slate-200 shadow-sm transition enabled:hover:bg-slate-50 disabled:opacity-50"
                  >
                    عرض الكروت
                  </button>

                  <button
                    type="button"
                    onClick={openSelectedCard}
                    disabled={actionBusy || !selectedCardId}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-slate-800 disabled:opacity-50"
                  >
                    فتح الكارت
                  </button>
                </div>
              </div>
            </div>
          </AdminCard>
        </div>
      ) : null}
    </div>
  );
}
