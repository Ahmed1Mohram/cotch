"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminCard } from "@/features/admin/ui/AdminCard";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type AdminAccessRequestRow = {
  id: string;
  requester_user_id: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
};

function fmtDate(v: string | null | undefined) {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  try {
    return d.toLocaleString("ar-EG", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return s;
  }
}

function StatusPill({ status }: { status: string }) {
  const s = String(status ?? "").toLowerCase();
  const meta =
    s === "approved"
      ? { label: "مقبول", cls: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20" }
      : s === "rejected"
        ? { label: "مرفوض", cls: "bg-rose-500/15 text-rose-700 ring-rose-500/20" }
        : { label: "معلق", cls: "bg-amber-500/15 text-amber-700 ring-amber-500/20" };

  return (
    <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 " + meta.cls}>
      {meta.label}
    </span>
  );
}

export function AdminAccessRequestsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [requests, setRequests] = useState<AdminAccessRequestRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileRow>>(new Map());

  const pendingCount = useMemo(
    () => requests.filter((r) => String(r.status ?? "").toLowerCase() === "pending").length,
    [requests],
  );

  const load = async () => {
    const supabase = createSupabaseBrowserClient();

    setLoading(true);
    setError(null);

    const reqRes = await supabase
      .from("admin_access_requests")
      .select("id,requester_user_id,status,reviewed_by,reviewed_at,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (reqRes.error) {
      setRequests([]);
      setProfiles(new Map());
      setError(reqRes.error.message);
      setLoading(false);
      return;
    }

    const rows = ((reqRes.data ?? []) as any[]).map((r) => ({
      id: String(r.id),
      requester_user_id: String(r.requester_user_id),
      status: String(r.status ?? "pending"),
      reviewed_by: r.reviewed_by ? String(r.reviewed_by) : null,
      reviewed_at: r.reviewed_at ? String(r.reviewed_at) : null,
      created_at: String(r.created_at ?? ""),
      updated_at: String(r.updated_at ?? ""),
    })) as AdminAccessRequestRow[];

    setRequests(rows);

    const ids = Array.from(new Set(rows.map((x) => x.requester_user_id).filter(Boolean)));
    if (!ids.length) {
      setProfiles(new Map());
      setLoading(false);
      return;
    }

    const profRes = await supabase.from("user_profiles").select("user_id,full_name,phone").in("user_id", ids);
    if (profRes.error) {
      setProfiles(new Map());
      setLoading(false);
      return;
    }

    const map = new Map<string, ProfileRow>();
    for (const p of (profRes.data ?? []) as any[]) {
      const user_id = String(p.user_id ?? "");
      if (!user_id) continue;
      map.set(user_id, {
        user_id,
        full_name: p.full_name ? String(p.full_name) : null,
        phone: p.phone ? String(p.phone) : null,
      });
    }

    setProfiles(map);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const approve = async (row: AdminAccessRequestRow) => {
    if (busyId) return;
    const supabase = createSupabaseBrowserClient();

    setBusyId(row.id);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        throw new Error("Unauthorized");
      }

      const ins = await supabase
        .from("admin_users")
        .upsert({ user_id: row.requester_user_id }, { onConflict: "user_id", ignoreDuplicates: true });
      if (ins.error) {
        throw new Error(ins.error.message);
      }

      const now = new Date().toISOString();
      const up = await supabase
        .from("admin_access_requests")
        .update({ status: "approved", reviewed_by: user.id, reviewed_at: now, updated_at: now })
        .eq("id", row.id);

      if (up.error) {
        throw new Error(up.error.message);
      }

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (row: AdminAccessRequestRow) => {
    if (busyId) return;
    const supabase = createSupabaseBrowserClient();

    setBusyId(row.id);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        throw new Error("Unauthorized");
      }

      const now = new Date().toISOString();
      const up = await supabase
        .from("admin_access_requests")
        .update({ status: "rejected", reviewed_by: user.id, reviewed_at: now, updated_at: now })
        .eq("id", row.id);

      if (up.error) {
        throw new Error(up.error.message);
      }

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminCard>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-extrabold">طلبات دخول الأدمن</div>
            <div className="mt-1 text-sm text-slate-600">أي مستخدم يحاول دخول لوحة الأدمن يظهر هنا عشان تقبل أو ترفض.</div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-800 ring-1 ring-amber-500/20">
              معلق: {pendingCount}
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              disabled={loading}
            >
              تحديث
            </button>
          </div>
        </div>

        {error ? <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
      </AdminCard>

      <AdminCard className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-200/70">
          {loading ? (
            <div className="px-5 py-6 text-sm text-slate-600">جاري التحميل...</div>
          ) : requests.length ? (
            requests.map((r) => {
              const prof = profiles.get(r.requester_user_id) ?? null;
              const name = String(prof?.full_name ?? "").trim();
              const phone = String(prof?.phone ?? "").trim();
              const statusLower = String(r.status ?? "").toLowerCase();
              const isPending = statusLower === "pending";

              return (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold text-slate-900" dir="rtl">
                            {name || phone || r.requester_user_id}
                          </div>
                          <div className="mt-1 text-xs text-slate-600" dir="rtl">
                            {phone ? `رقم: ${phone}` : ""}
                          </div>
                        </div>
                        <StatusPill status={r.status} />
                      </div>

                      <div className="mt-2 text-xs text-slate-500" dir="rtl">
                        تاريخ الطلب: {fmtDate(r.created_at)}
                        {r.reviewed_at ? ` • آخر مراجعة: ${fmtDate(r.reviewed_at)}` : ""}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void approve(r)}
                        disabled={!isPending || busyId === r.id}
                        className={
                          "inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition " +
                          (isPending ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-100 text-slate-400")
                        }
                      >
                        قبول
                      </button>
                      <button
                        type="button"
                        onClick={() => void reject(r)}
                        disabled={!isPending || busyId === r.id}
                        className={
                          "inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition " +
                          (isPending ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-slate-100 text-slate-400")
                        }
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-6 text-sm text-slate-600">لا يوجد طلبات حالياً.</div>
          )}
        </div>
      </AdminCard>
    </div>
  );
}
