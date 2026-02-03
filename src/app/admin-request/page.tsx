"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type ReqRow = {
  id: string;
  requester_user_id: string;
  status: string;
  reviewed_at: string | null;
  created_at: string;
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

export default function AdminRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<ReqRow | null>(null);

  const status = String(row?.status ?? "pending").toLowerCase();

  const load = async () => {
    const supabase = createSupabaseBrowserClient();

    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      router.replace("/login?next=%2Fadmin");
      router.refresh();
      return;
    }

    try {
      let isAdmin = false;
      try {
        let rpcRes = await supabase.rpc("is_admin", { uid: user.id });
        if (rpcRes.error) {
          rpcRes = await supabase.rpc("is_admin");
        }
        isAdmin = Boolean(!rpcRes.error && rpcRes.data);
      } catch {
        isAdmin = false;
      }

      if (isAdmin) {
        router.replace("/admin");
        router.refresh();
        return;
      }

      await supabase
        .from("admin_access_requests")
        .upsert(
          { requester_user_id: user.id, status: "pending", reviewed_by: null, reviewed_at: null },
          { onConflict: "requester_user_id" },
        );

      const res = await supabase
        .from("admin_access_requests")
        .select("id,requester_user_id,status,reviewed_at,created_at")
        .eq("requester_user_id", user.id)
        .maybeSingle();

      if (res.error) {
        throw new Error(res.error.message);
      }

      if (!res.data) {
        setRow(null);
      } else {
        const r: any = res.data;
        setRow({
          id: String(r.id),
          requester_user_id: String(r.requester_user_id),
          status: String(r.status ?? "pending"),
          reviewed_at: r.reviewed_at ? String(r.reviewed_at) : null,
          created_at: String(r.created_at ?? ""),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();

    const t = window.setInterval(() => {
      void load();
    }, 12000);

    return () => {
      window.clearInterval(t);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050506] text-white" dir="rtl">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-8">
          <div className="text-2xl font-extrabold tracking-wide">الصفحة دي للأدمن بس</div>
          <div className="mt-3 text-sm text-white/80">دي صفحة خاصة بالإدارة فقط. اقفل الصفحة دي.</div>

          {status === "rejected" ? (
            <div className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-50">
              تم رفض الطلب.
            </div>
          ) : null}

          {error ? <div className="mt-4 rounded-2xl bg-black/25 px-4 py-3 text-sm font-semibold">{error}</div> : null}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                router.replace("/");
                router.refresh();
              }}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/10 px-6 text-sm font-semibold text-white/90 transition hover:bg-white/15"
            >
              إقفل وارجع للرئيسية
            </button>

            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/15 px-6 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
            >
              {loading ? "جاري التحديث..." : "تحديث"}
            </button>
          </div>

          {row?.created_at ? (
            <div className="mt-5 text-xs text-white/55">تاريخ الطلب: {fmtDate(row.created_at)}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
