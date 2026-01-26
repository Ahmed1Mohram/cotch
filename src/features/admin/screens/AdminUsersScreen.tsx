"use client";

import { useEffect, useMemo, useState } from "react";

import { Accordion } from "@/features/admin/ui/Accordion";
import { AdminCard } from "@/features/admin/ui/AdminCard";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  age_years: number | null;
  height_cm: number | null;
  weight_kg: number | null;
};

type CourseRow = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
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

type MonthAccessRow = {
  id: string;
  user_id: string;
  course_id: string;
  month_number: number;
  status: string;
  start_at: string;
  end_at: string | null;
  source: string;
  created_at: string;
};

type DeviceRow = {
  device_id: string;
  user_id: string | null;
  last_seen: string;
  user_agent: string | null;
};

type DeviceBanRow = {
  device_id: string;
  active: boolean;
  banned_until: string | null;
  reason: string | null;
};

type UserBanRow = {
  user_id: string;
  active: boolean;
  banned_until: string | null;
  reason: string | null;
};

type UserView = {
  userId: string;
  profile: ProfileRow | null;
  devices: DeviceRow[];
  bannedDevices: Set<string>;
  bannedUser: UserBanRow | null;
  enrollments: EnrollmentRow[];
  monthAccess: MonthAccessRow[];
};

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function courseTitle(course: CourseRow | undefined) {
  if (!course) return "—";
  return String(course.title_ar ?? course.title_en ?? course.slug ?? "—");
}

export function AdminUsersScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);

  const [users, setUsers] = useState<UserView[]>([]);
  const [courseById, setCourseById] = useState<Map<string, CourseRow>>(new Map());

  const pushNotice = (kind: "success" | "error" | "info", text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => {
      setNotice((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const run = async () => {
      setLoading(true);
      setError(null);

      const [profilesRes, enrollmentsRes, monthAccessRes] = await Promise.all([
        supabase.from("user_profiles").select("user_id,full_name,phone,age_years,height_cm,weight_kg"),
        supabase
          .from("enrollments")
          .select("id,user_id,course_id,status,start_at,end_at,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("course_month_access")
          .select("id,user_id,course_id,month_number,status,start_at,end_at,source,created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (profilesRes.error) throw new Error(profilesRes.error.message);
      if (enrollmentsRes.error) throw new Error(enrollmentsRes.error.message);
      if (monthAccessRes.error) throw new Error(monthAccessRes.error.message);

      const profiles = (profilesRes.data ?? []) as ProfileRow[];
      const enrollments = (enrollmentsRes.data ?? []) as EnrollmentRow[];
      const monthAccess = (monthAccessRes.data ?? []) as MonthAccessRow[];

      const userIds = Array.from(
        new Set([
          ...profiles.map((p) => p.user_id),
          ...enrollments.map((e) => e.user_id),
          ...monthAccess.map((m) => m.user_id),
        ].filter(Boolean)),
      );

      const devices: DeviceRow[] = [];
      for (const ids of chunk(userIds, 200)) {
        const res = await supabase
          .from("user_devices")
          .select("device_id,user_id,last_seen,user_agent")
          .in("user_id", ids)
          .order("last_seen", { ascending: false });
        if (res.error) throw new Error(res.error.message);
        devices.push(...((res.data ?? []) as DeviceRow[]));
      }

      const deviceIds = Array.from(new Set(devices.map((d) => d.device_id).filter(Boolean)));

      const deviceBans: DeviceBanRow[] = [];
      for (const ids of chunk(deviceIds, 200)) {
        const res = await supabase
          .from("device_bans")
          .select("device_id,active,banned_until,reason")
          .in("device_id", ids)
          .eq("active", true);
        if (res.error) throw new Error(res.error.message);
        deviceBans.push(...((res.data ?? []) as DeviceBanRow[]));
      }

      const userBans: UserBanRow[] = [];
      for (const ids of chunk(userIds, 200)) {
        const res = await supabase
          .from("user_bans")
          .select("user_id,active,banned_until,reason")
          .in("user_id", ids)
          .eq("active", true);
        if (res.error) throw new Error(res.error.message);
        userBans.push(...((res.data ?? []) as UserBanRow[]));
      }

      const allCourseIds = Array.from(
        new Set([
          ...enrollments.map((e) => e.course_id),
          ...monthAccess.map((m) => m.course_id),
        ].filter(Boolean)),
      );

      const courses: CourseRow[] = [];
      for (const ids of chunk(allCourseIds, 200)) {
        const res = await supabase.from("courses").select("id,slug,title_ar,title_en").in("id", ids);
        if (res.error) throw new Error(res.error.message);
        courses.push(...((res.data ?? []) as CourseRow[]));
      }

      const courseMap = new Map(courses.map((c) => [String(c.id), c] as const));
      setCourseById(courseMap);

      const profileByUser = new Map(profiles.map((p) => [String(p.user_id), p] as const));

      const devicesByUser = new Map<string, DeviceRow[]>();
      for (const d of devices) {
        if (!d.user_id) continue;
        const k = String(d.user_id);
        const list = devicesByUser.get(k);
        if (list) list.push(d);
        else devicesByUser.set(k, [d]);
      }

      const enrollmentsByUser = new Map<string, EnrollmentRow[]>();
      for (const e of enrollments) {
        const k = String(e.user_id);
        const list = enrollmentsByUser.get(k);
        if (list) list.push(e);
        else enrollmentsByUser.set(k, [e]);
      }

      const monthAccessByUser = new Map<string, MonthAccessRow[]>();
      for (const m of monthAccess) {
        const k = String(m.user_id);
        const list = monthAccessByUser.get(k);
        if (list) list.push(m);
        else monthAccessByUser.set(k, [m]);
      }

      const bannedByDevice = new Set(deviceBans.filter((b) => b.active).map((b) => String(b.device_id)));
      const bannedByUser = new Map(userBans.filter((b) => b.active).map((b) => [String(b.user_id), b] as const));

      const views: UserView[] = userIds.map((uid) => {
        const userDevices = devicesByUser.get(uid) ?? [];
        const bannedDevices = new Set(userDevices.map((d) => d.device_id).filter((id) => bannedByDevice.has(id)));

        return {
          userId: uid,
          profile: profileByUser.get(uid) ?? null,
          devices: userDevices,
          bannedDevices,
          bannedUser: bannedByUser.get(uid) ?? null,
          enrollments: enrollmentsByUser.get(uid) ?? [],
          monthAccess: monthAccessByUser.get(uid) ?? [],
        };
      });

      views.sort((a, b) => {
        const aName = (a.profile?.full_name ?? "").toLowerCase();
        const bName = (b.profile?.full_name ?? "").toLowerCase();
        return aName.localeCompare(bName);
      });

      setUsers(views);
      setLoading(false);
    };

    void run().catch((err) => {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      setLoading(false);
    });
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const name = (u.profile?.full_name ?? "").toLowerCase();
      const phone = (u.profile?.phone ?? "").toLowerCase();
      const id = u.userId.toLowerCase();
      return name.includes(q) || phone.includes(q) || id.includes(q);
    });
  }, [query, users]);

  async function banDevice(deviceId: string) {
    const supabase = createSupabaseBrowserClient();
    const reason = window.prompt("سبب الحظر؟ (اختياري)") ?? "";

    setActionBusy(true);
    setNotice(null);

    const insertRes = await supabase.from("device_bans").insert({ device_id: deviceId, active: true, reason: reason.trim() || null });

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

    setUsers((prev) =>
      prev.map((u) => {
        const hasDevice = u.devices.some((d) => d.device_id === deviceId);
        if (!hasDevice) return u;
        const next = new Set(Array.from(u.bannedDevices));
        next.add(deviceId);
        return { ...u, bannedDevices: next };
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

    setUsers((prev) =>
      prev.map((u) => {
        const next = new Set(Array.from(u.bannedDevices));
        next.delete(deviceId);
        return { ...u, bannedDevices: next };
      }),
    );

    pushNotice("success", "تم فك الحظر عن الجهاز.");
    setActionBusy(false);
  }

  async function banUser(userId: string) {
    const supabase = createSupabaseBrowserClient();
    const reason = window.prompt("سبب حظر الحساب؟ (اختياري)") ?? "";

    setActionBusy(true);
    setNotice(null);

    const insertRes = await supabase.from("user_bans").insert({ user_id: userId, active: true, reason: reason.trim() || null });

    if (insertRes.error) {
      const updateRes = await supabase
        .from("user_bans")
        .update({ active: true, reason: reason.trim() || null })
        .eq("user_id", userId)
        .eq("active", true);

      if (updateRes.error) {
        pushNotice("error", insertRes.error.message);
        setActionBusy(false);
        return;
      }
    }

    setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, bannedUser: { user_id: userId, active: true, banned_until: null, reason: reason.trim() || null } } : u)));
    pushNotice("success", "تم حظر الحساب.");
    setActionBusy(false);
  }

  async function unbanUser(userId: string) {
    const supabase = createSupabaseBrowserClient();
    const ok = window.confirm("فك الحظر عن هذا الحساب؟");
    if (!ok) return;

    setActionBusy(true);
    setNotice(null);

    const res = await supabase.from("user_bans").update({ active: false }).eq("user_id", userId).eq("active", true);

    if (res.error) {
      pushNotice("error", res.error.message);
      setActionBusy(false);
      return;
    }

    setUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, bannedUser: null } : u)));
    pushNotice("success", "تم فك الحظر عن الحساب.");
    setActionBusy(false);
  }

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

    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        enrollments: u.enrollments.map((e) => (e.id === enrollmentId ? { ...e, status: "inactive" } : e)),
      })),
    );

    pushNotice("success", "تم إيقاف الاشتراك.");
    setActionBusy(false);
  }

  async function activateEnrollment(enrollmentId: string) {
    const supabase = createSupabaseBrowserClient();
    const raw = window.prompt("مدة التفعيل بالأيام؟", "30") ?? "";
    const days = Number(raw.trim());
    if (!Number.isFinite(days) || days <= 0) return;

    setActionBusy(true);
    setNotice(null);

    const now = Date.parse(new Date().toISOString());
    const endAt = new Date(now + days * 24 * 60 * 60 * 1000).toISOString();

    const res = await supabase
      .from("enrollments")
      .update({ status: "active", end_at: endAt })
      .eq("id", enrollmentId);

    if (res.error) {
      pushNotice("error", res.error.message);
      setActionBusy(false);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        enrollments: u.enrollments.map((e) => (e.id === enrollmentId ? { ...e, status: "active", end_at: endAt } : e)),
      })),
    );

    pushNotice("success", "تم تفعيل الاشتراك.");
    setActionBusy(false);
  }

  async function stopMonthAccess(accessId: string) {
    const supabase = createSupabaseBrowserClient();
    const ok = window.confirm("إيقاف صلاحية الشهر؟");
    if (!ok) return;

    setActionBusy(true);
    setNotice(null);

    const now = new Date().toISOString();
    const res = await supabase.from("course_month_access").update({ status: "inactive", end_at: now }).eq("id", accessId);

    if (res.error) {
      pushNotice("error", res.error.message);
      setActionBusy(false);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        monthAccess: u.monthAccess.map((m) => (m.id === accessId ? { ...m, status: "inactive", end_at: now } : m)),
      })),
    );

    pushNotice("success", "تم إيقاف صلاحية الشهر.");
    setActionBusy(false);
  }

  async function extendMonthAccess(accessId: string) {
    const supabase = createSupabaseBrowserClient();
    const raw = window.prompt("تمديد بالأيام؟", "40") ?? "";
    const days = Number(raw.trim());
    if (!Number.isFinite(days) || days <= 0) return;

    setActionBusy(true);
    setNotice(null);

    const now = Date.parse(new Date().toISOString());
    const endAt = new Date(now + days * 24 * 60 * 60 * 1000).toISOString();

    const res = await supabase.from("course_month_access").update({ status: "active", end_at: endAt }).eq("id", accessId);

    if (res.error) {
      pushNotice("error", res.error.message);
      setActionBusy(false);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        monthAccess: u.monthAccess.map((m) => (m.id === accessId ? { ...m, status: "active", end_at: endAt } : m)),
      })),
    );

    pushNotice("success", "تم تحديث صلاحية الشهر.");
    setActionBusy(false);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <AdminCard>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">المستخدمين</div>
            <div className="mt-1 text-sm text-slate-600">كل المستخدمين + الحظر + الأجهزة + الاشتراك + صلاحيات الشهور.</div>
          </div>
          <div className="min-w-[260px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث بالاسم / الموبايل / user_id"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
          </div>
        </div>

        <div
          className={
            "mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs " +
            (error || notice?.kind === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : loading || actionBusy || notice?.kind === "info"
                ? "border-violet-100 bg-violet-50 text-violet-700"
                : notice?.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600")
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
                  : `${filteredUsers.length} مستخدم`}
        </div>
      </AdminCard>

      {!loading && !error ? (
        <div className="space-y-4">
          {filteredUsers.map((u) => {
            const name = u.profile?.full_name ?? "—";
            const phone = u.profile?.phone ?? "—";
            const banned = Boolean(u.bannedUser);

            return (
              <Accordion
                key={u.userId}
                title={`${name} • ${phone}`}
                subtitle={`${banned ? "محظور" : "غير محظور"} • ${u.devices.length} جهاز • ${u.enrollments.length} اشتراك • ${u.monthAccess.length} صلاحية شهر`}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-700">الحساب</div>
                    <div className="mt-2 text-xs text-slate-600" dir="ltr">{u.userId}</div>

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      {banned ? (
                        <button
                          type="button"
                          onClick={() => unbanUser(u.userId)}
                          disabled={actionBusy}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                        >
                          فك حظر الحساب
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => banUser(u.userId)}
                          disabled={actionBusy}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                        >
                          حظر الحساب
                        </button>
                      )}
                    </div>

                    {banned ? (
                      <div className="mt-3 text-sm text-slate-700">
                        السبب: <span className="text-slate-900">{u.bannedUser?.reason ?? "—"}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-700">الأجهزة</div>

                    {u.devices.length ? (
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        {u.devices.slice(0, 12).map((d) => {
                          const isBanned = u.bannedDevices.has(d.device_id);
                          return (
                            <button
                              key={d.device_id}
                              type="button"
                              onClick={() => (isBanned ? unbanDevice(d.device_id) : banDevice(d.device_id))}
                              disabled={actionBusy}
                              className={
                                "inline-flex h-8 items-center justify-center rounded-full border px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 " +
                                (isBanned
                                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 focus-visible:ring-rose-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 focus-visible:ring-slate-200")
                              }
                              title={d.user_agent ?? d.device_id}
                            >
                              {isBanned ? "محظور" : "جهاز"}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-slate-500">—</div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
                    <div className="text-xs font-semibold text-slate-700">الاشتراكات</div>

                    {u.enrollments.length ? (
                      <div className="mt-3 overflow-auto">
                        <table className="min-w-[860px] w-full text-right text-sm">
                          <thead className="text-xs text-slate-500">
                            <tr className="border-b border-slate-200">
                              <th className="py-3 font-medium">الكورس</th>
                              <th className="py-3 font-medium">الحالة</th>
                              <th className="py-3 font-medium">ينتهي</th>
                              <th className="py-3 font-medium">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {u.enrollments.map((e) => {
                              const c = courseById.get(String(e.course_id));
                              const active = String(e.status) === "active";
                              return (
                                <tr key={e.id} className="border-b border-slate-200 text-slate-900 hover:bg-slate-50">
                                  <td className="py-3">{courseTitle(c)}</td>
                                  <td className="py-3">{active ? "نشط" : "موقوف"}</td>
                                  <td className="py-3" dir="ltr">{e.end_at ? String(e.end_at) : "—"}</td>
                                  <td className="py-3">
                                    <div className="flex flex-wrap justify-end gap-2">
                                      {active ? (
                                        <button
                                          type="button"
                                          onClick={() => stopEnrollment(e.id)}
                                          disabled={actionBusy}
                                          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                                        >
                                          إيقاف
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => activateEnrollment(e.id)}
                                          disabled={actionBusy}
                                          className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                                        >
                                          تفعيل
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-slate-500">—</div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
                    <div className="text-xs font-semibold text-slate-700">صلاحيات الشهور</div>

                    {u.monthAccess.length ? (
                      <div className="mt-3 overflow-auto">
                        <table className="min-w-[980px] w-full text-right text-sm">
                          <thead className="text-xs text-slate-500">
                            <tr className="border-b border-slate-200">
                              <th className="py-3 font-medium">الكورس</th>
                              <th className="py-3 font-medium">الشهر</th>
                              <th className="py-3 font-medium">الحالة</th>
                              <th className="py-3 font-medium">ينتهي</th>
                              <th className="py-3 font-medium">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {u.monthAccess.map((m) => {
                              const c = courseById.get(String(m.course_id));
                              const active = String(m.status) === "active";
                              return (
                                <tr key={m.id} className="border-b border-slate-200 text-slate-900 hover:bg-slate-50">
                                  <td className="py-3">{courseTitle(c)}</td>
                                  <td className="py-3">{m.month_number}</td>
                                  <td className="py-3">{active ? "نشط" : "موقوف"}</td>
                                  <td className="py-3" dir="ltr">{m.end_at ? String(m.end_at) : "—"}</td>
                                  <td className="py-3">
                                    <div className="flex flex-wrap justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => extendMonthAccess(m.id)}
                                        disabled={actionBusy}
                                        className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
                                      >
                                        تمديد/تفعيل
                                      </button>
                                      {active ? (
                                        <button
                                          type="button"
                                          onClick={() => stopMonthAccess(m.id)}
                                          disabled={actionBusy}
                                          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
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
                    ) : (
                      <div className="mt-3 text-sm text-slate-500">—</div>
                    )}
                  </div>
                </div>
              </Accordion>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
