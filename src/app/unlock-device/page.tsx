"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

// ── Credentials ──────────────────────────────────────────────
const MASTER_USER = "11111111111";
const MASTER_PASS = "11111111111";

// ── Types ─────────────────────────────────────────────────────
interface DeviceLock {
  admin_user_id: string;
  allowed_device_id: string;
  created_at: string | null;
  // joined
  email: string | null;
  full_name: string | null;
  phone: string | null;
}

// ── Helpers ───────────────────────────────────────────────────
function fmt(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("ar-EG", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// ── Page ──────────────────────────────────────────────────────
export default function UnlockDevicePage() {
  const [authed, setAuthed]     = useState(false);
  const [userInput, setUserInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const [locks, setLocks]       = useState<DeviceLock[]>([]);
  const [loading, setLoading]   = useState(false);
  const [clearing, setClearing] = useState<string | null>(null);
  const [msg, setMsg]           = useState("");

  // ── Login ────────────────────────────────────────────────────
  const handleLogin = () => {
    if (userInput.trim() === MASTER_USER && passInput.trim() === MASTER_PASS) {
      setAuthed(true);
      setLoginErr("");
    } else {
      setLoginErr("اليوزر أو كلمة السر غلط.");
    }
  };

  // ── Fetch locks ───────────────────────────────────────────────
  const fetchLocks = async () => {
    setLoading(true);
    setMsg("");
    try {
      const supabase = createSupabaseBrowserClient();

      // 1. Get all lock rows
      const { data: lockRows, error: lockErr } = await supabase
        .from("admin_device_locks")
        .select("admin_user_id, allowed_device_id, created_at")
        .order("created_at", { ascending: false });

      if (lockErr || !lockRows) {
        setMsg("❌ فشل تحميل بيانات الأقفال: " + (lockErr?.message ?? ""));
        setLoading(false);
        return;
      }

      if (lockRows.length === 0) {
        setLocks([]);
        setLoading(false);
        return;
      }

      const userIds = lockRows.map((r: any) => r.admin_user_id);

      // 2. Get profiles for those users
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);

      const profileMap: Record<string, { full_name: string | null; phone: string | null }> = {};
      (profiles ?? []).forEach((p: any) => {
        profileMap[p.user_id] = { full_name: p.full_name ?? null, phone: p.phone ?? null };
      });

      // 3. Get auth emails via admin_users table (if available)
      const { data: adminUsers } = await supabase
        .from("admin_users")
        .select("user_id")
        .in("user_id", userIds);

      const merged: DeviceLock[] = lockRows.map((r: any) => ({
        admin_user_id: r.admin_user_id,
        allowed_device_id: r.allowed_device_id,
        created_at: r.created_at ?? null,
        email: null,
        full_name: profileMap[r.admin_user_id]?.full_name ?? null,
        phone: profileMap[r.admin_user_id]?.phone ?? null,
      }));

      setLocks(merged);
    } catch (e: any) {
      setMsg("❌ خطأ غير متوقع: " + String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  // ── Clear a specific lock ─────────────────────────────────────
  const clearLock = async (adminUserId: string) => {
    setClearing(adminUserId);
    setMsg("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("admin_device_locks")
        .delete()
        .eq("admin_user_id", adminUserId);

      if (error) {
        setMsg("❌ فشل مسح القفل: " + error.message);
      } else {
        setMsg("✅ تم مسح القفل بنجاح!");
        setLocks((prev) => prev.filter((l) => l.admin_user_id !== adminUserId));
      }
    } catch (e: any) {
      setMsg("❌ خطأ: " + String(e?.message ?? e));
    } finally {
      setClearing(null);
    }
  };

  // ── Clear ALL locks ───────────────────────────────────────────
  const clearAll = async () => {
    if (!confirm("هل أنت متأكد من مسح كل الأقفال؟")) return;
    setLoading(true);
    setMsg("");
    try {
      const supabase = createSupabaseBrowserClient();
      // Delete all rows — Supabase requires a filter, use neq with a placeholder
      const { error } = await supabase
        .from("admin_device_locks")
        .delete()
        .neq("admin_user_id", "00000000-0000-0000-0000-000000000000");

      if (error) {
        setMsg("❌ فشل: " + error.message);
      } else {
        setMsg("✅ تم مسح كل الأقفال!");
        setLocks([]);
      }
    } catch (e: any) {
      setMsg("❌ خطأ: " + String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) void fetchLocks();
  }, [authed]);

  // ══════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════════════════════════════════════
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050506] flex items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="rounded-3xl bg-[#0e0e10] border border-white/10 shadow-[0_0_80px_-20px_rgba(255,106,0,0.25)] p-8 flex flex-col gap-5">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-white tracking-wide mb-1">🔒 Unlock Device</div>
              <div className="text-xs text-white/40">صفحة إدارة أقفال الأجهزة</div>
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => { setUserInput(e.target.value); setLoginErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                placeholder="اليوزر"
                className="h-11 w-full rounded-2xl bg-white/8 border border-white/10 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#FF6A00]/50 transition"
              />
              <input
                type="password"
                value={passInput}
                onChange={(e) => { setPassInput(e.target.value); setLoginErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                placeholder="كلمة السر"
                className="h-11 w-full rounded-2xl bg-white/8 border border-white/10 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#FF6A00]/50 transition"
              />
              {loginErr && (
                <div className="text-xs text-red-400 text-center">{loginErr}</div>
              )}
              <button
                type="button"
                onClick={handleLogin}
                className="h-11 w-full rounded-2xl bg-gradient-to-r from-[#FF2424] via-[#FF6A00] to-[#FFB35A] text-sm font-extrabold text-white shadow-[0_8px_32px_-12px_rgba(255,106,0,0.60)] transition hover:opacity-90 active:scale-[0.98]"
              >
                دخول
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // DASHBOARD SCREEN
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#050506] text-white px-4 py-10" dir="rtl">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-2xl font-extrabold tracking-wide">🔒 Unlock Device Panel</div>
            <div className="text-xs text-white/40 mt-0.5">إدارة أقفال أجهزة الأدمن</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void fetchLocks()}
              disabled={loading}
              className="h-9 px-4 rounded-xl bg-white/10 text-xs font-semibold text-white border border-white/10 hover:bg-white/15 transition disabled:opacity-50"
            >
              {loading ? "جاري التحميل..." : "🔄 تحديث"}
            </button>
            {locks.length > 0 && (
              <button
                type="button"
                onClick={() => void clearAll()}
                disabled={loading}
                className="h-9 px-4 rounded-xl bg-red-500/15 text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/25 transition disabled:opacity-50"
              >
                🗑 مسح الكل
              </button>
            )}
          </div>
        </div>

        {/* Status message */}
        {msg && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-medium border ${
            msg.startsWith("✅")
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {msg}
          </div>
        )}

        {/* Locks list */}
        {loading ? (
          <div className="text-center text-white/40 py-16 text-sm">جاري التحميل...</div>
        ) : locks.length === 0 ? (
          <div className="rounded-3xl bg-white/5 border border-white/8 p-10 text-center">
            <div className="text-4xl mb-3">🔓</div>
            <div className="text-white/60 text-sm">مفيش أقفال أجهزة حالياً</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {locks.map((lock) => (
              <div
                key={lock.admin_user_id}
                className="rounded-2xl bg-[#0e0e10] border border-white/8 p-5 flex flex-col gap-4 shadow-[0_2px_24px_-8px_rgba(0,0,0,0.6)]"
              >
                {/* User info */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#FF6A00]" />
                      <span className="text-sm font-bold text-white">
                        {lock.full_name ?? "اسم غير متوفر"}
                      </span>
                    </div>
                    {lock.phone && (
                      <div className="text-xs text-white/50 font-mono pr-4">{lock.phone}</div>
                    )}
                    <div className="text-[10px] text-white/30 pr-4">
                      User ID: {lock.admin_user_id.slice(0, 18)}...
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void clearLock(lock.admin_user_id)}
                    disabled={clearing === lock.admin_user_id}
                    className="h-9 px-4 rounded-xl bg-red-500/15 text-xs font-bold text-red-400 border border-red-500/20 hover:bg-red-500/25 transition disabled:opacity-50 shrink-0"
                  >
                    {clearing === lock.admin_user_id ? "جاري المسح..." : "🔓 فك القفل"}
                  </button>
                </div>

                {/* Device info */}
                <div className="rounded-xl bg-black/30 border border-white/5 p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Device ID</span>
                    <span className="font-mono text-white/70 text-[11px] break-all text-left max-w-[200px]">
                      {lock.allowed_device_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">تاريخ القفل</span>
                    <span className="text-white/60">{fmt(lock.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] text-white/20 pb-4">
          Unlock Device Panel · FIT COACH Admin
        </div>
      </div>
    </div>
  );
}
