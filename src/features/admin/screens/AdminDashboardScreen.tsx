"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminCard } from "@/features/admin/ui/AdminCard";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export function AdminDashboardScreen() {
  const [courseCount, setCourseCount] = useState<number>(0);
  const [ageGroupsCount, setAgeGroupsCount] = useState<number>(0);
  const [monthsCount, setMonthsCount] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const run = async () => {
      const [c, ag, m] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("age_groups").select("id", { count: "exact", head: true }),
        supabase.from("months").select("id", { count: "exact", head: true }),
      ]);

      setCourseCount(c.count ?? 0);
      setAgeGroupsCount(ag.count ?? 0);
      setMonthsCount(m.count ?? 0);
      setLoaded(true);
    };

    void run();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-3">
        <AdminCard glow="orange">
          <div className="text-sm font-medium text-slate-600">الكورسات</div>
          <div className="mt-2 text-4xl font-semibold text-slate-900">{courseCount}</div>
          <div className="mt-2 text-sm text-slate-600">إدارة الكورسات والبرامج.</div>
        </AdminCard>

        <AdminCard glow="green">
          <div className="text-sm font-medium text-slate-600">مجموعات الأعمار</div>
          <div className="mt-2 text-4xl font-semibold text-slate-900">{ageGroupsCount}</div>
          <div className="mt-2 text-sm text-slate-600">الأعمار والكروت وبيانات الاشتراك.</div>
        </AdminCard>

        <AdminCard glow="blue">
          <div className="text-sm font-medium text-slate-600">الشهور</div>
          <div className="mt-2 text-4xl font-semibold text-slate-900">{monthsCount}</div>
          <div className="mt-2 text-sm text-slate-600">كل شهر بيتقسم لأيام وفيديوهات.</div>
        </AdminCard>
      </div>

      <AdminCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">إجراءات سريعة</div>
            <div className="mt-1 text-sm text-slate-600">ابدأ بالكورسات، وبعدها أضف الأعمار والشهور والمحتوى.</div>
          </div>
          <Link
            href="/admin/courses"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            إدارة الكورسات
          </Link>
        </div>
        <div className="mt-4 text-xs text-slate-500">{loaded ? "بيانات مباشرة" : "تحميل..."}</div>
      </AdminCard>
    </div>
  );
}
