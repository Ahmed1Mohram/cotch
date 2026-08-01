"use client";

import { useEffect, useState } from "react";

const MASTER_SECRET = "11111111111";

interface AdminLock {
  admin_user_id: string;
  allowed_device_id: string;
  created_at: string | null;
  full_name: string | null;
  phone: string | null;
}

interface ActiveDevice {
  device_id: string;
  user_id: string;
  user_agent: string | null;
  first_seen: string | null;
  last_seen: string | null;
  full_name: string | null;
  phone: string | null;
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("ar-EG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function parseUA(ua: string | null) {
  if (!ua) return "جهاز غير معروف";
  if (ua.includes("iPhone")) return "📱 iPhone";
  if (ua.includes("Android")) return "📱 Android";
  if (ua.includes("Windows")) return "💻 Windows PC";
  if (ua.includes("Macintosh")) return "💻 Mac";
  if (ua.includes("Linux")) return "💻 Linux";
  return "📱/💻 متصفح جوال أو كمبيوتر";
}

export default function UnlockDevicePage() {
  const [authed, setAuthed] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const [locks, setLocks] = useState<AdminLock[]>([]);
  const [devices, setDevices] = useState<ActiveDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const handleLogin = () => {
    if (userInput.trim() === MASTER_SECRET && passInput.trim() === MASTER_SECRET) {
      setAuthed(true);
      setLoginErr("");
    } else {
      setLoginErr("اليوزر أو كلمة السر غير صحيحة.");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/unlock-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: MASTER_SECRET, action: "fetch" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMsg("❌ خطأ: " + (data.error ?? "فشل التحميل"));
        return;
      }
      setLocks(data.adminLocks ?? []);
      setDevices(data.activeDevices ?? []);
    } catch (e: any) {
      setMsg("❌ خطأ في الاتصال: " + String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const handleClearLock = async (adminUserId?: string) => {
    setActionInProgress(adminUserId ?? "all_locks");
    setMsg("");
    try {
      const res = await fetch("/api/unlock-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: MASTER_SECRET, action: "clear_lock", adminUserId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMsg("❌ فشل المسح: " + (data.error ?? "خطأ"));
      } else {
        setMsg("✅ تم فك قفل الأدمن بنجاح! يمكن للجهاز الجديد الدخول الآن.");
        void fetchData();
      }
    } catch (e: any) {
      setMsg("❌ خطأ: " + String(e?.message ?? e));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    setActionInProgress(deviceId);
    setMsg("");
    try {
      const res = await fetch("/api/unlock-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: MASTER_SECRET, action: "remove_device", deviceId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMsg("❌ فشل إغلاق الجهاز: " + (data.error ?? "خطأ"));
      } else {
        setMsg("✅ تم تسجيل خروج وإغلاق الجهاز بنجاح!");
        void fetchData();
      }
    } catch (e: any) {
      setMsg("❌ خطأ: " + String(e?.message ?? e));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("هل أنت متأكد من مسح جميع الأقفال والأجهزة المتصلة؟ سيتم السماح لأي جهاز جديد بالتسجيل.")) return;
    setActionInProgress("clear_all");
    setMsg("");
    try {
      const res = await fetch("/api/unlock-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: MASTER_SECRET, action: "clear_all" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMsg("❌ فشل المسح: " + (data.error ?? "خطأ"));
      } else {
        setMsg("✅ تم مسح جميع الأقفال والأجهزة المتصلة بنجاح!");
        void fetchData();
      }
    } catch (e: any) {
      setMsg("❌ خطأ: " + String(e?.message ?? e));
    } finally {
      setActionInProgress(null);
    }
  };

  useEffect(() => {
    if (authed) void fetchData();
  }, [authed]);

  // ══════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════════════════════════════════════
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050506] flex items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl bg-[#0e0e10] border border-white/10 shadow-[0_0_80px_-20px_rgba(255,106,0,0.25)] p-8 flex flex-col gap-5">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-white tracking-wide mb-1">🔐 Unlock Device</div>
              <div className="text-xs text-white/40">صفحة فك الأقفال وإدارة الأجهزة المتصلة</div>
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => { setUserInput(e.target.value); setLoginErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                placeholder="اسم المستخدم (11111111111)"
                className="h-11 w-full rounded-2xl bg-white/8 border border-white/10 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#FF6A00]/50 transition"
              />
              <input
                type="password"
                value={passInput}
                onChange={(e) => { setPassInput(e.target.value); setLoginErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                placeholder="كلمة السر (11111111111)"
                className="h-11 w-full rounded-2xl bg-white/8 border border-white/10 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#FF6A00]/50 transition"
              />
              {loginErr && <div className="text-xs text-red-400 text-center">{loginErr}</div>}
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
      <div className="mx-auto max-w-4xl flex flex-col gap-8">

        {/* Top Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="text-2xl font-extrabold tracking-wide flex items-center gap-2">
              <span>🔓</span>
              <span>Unlock Device Panel</span>
            </div>
            <div className="text-xs text-white/50 mt-1">
              إدارة أقفال الأدمن وتسجيل خروج الأجهزة المتصلة للسماح للأجهزة الجديدة
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void fetchData()}
              disabled={loading}
              className="h-10 px-4 rounded-xl bg-white/10 text-xs font-semibold text-white border border-white/12 hover:bg-white/15 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>🔄</span>
              <span>{loading ? "جاري التحميل..." : "تحديث البيانات"}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleClearAll()}
              disabled={loading || !!actionInProgress}
              className="h-10 px-4 rounded-xl bg-red-500/15 text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/25 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>مسح جميع الأقفال والأجهزة</span>
            </button>
          </div>
        </div>

        {/* Status Alert */}
        {msg && (
          <div className={`rounded-2xl px-5 py-3.5 text-sm font-bold border transition ${
            msg.startsWith("✅")
              ? "bg-emerald-500/12 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/12 border-rose-500/30 text-rose-400"
          }`}>
            {msg}
          </div>
        )}

        {/* SECTION 1: ADMIN DEVICE LOCKS */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <h2 className="text-lg font-bold text-white">أقفال حسابات الأدمن ({locks.length})</h2>
            </div>
            {locks.length > 0 && (
              <button
                type="button"
                onClick={() => void handleClearLock()}
                disabled={!!actionInProgress}
                className="text-xs font-semibold text-[#FFB35A] hover:underline"
              >
                فك جميع أقفال الأدمن
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center text-white/40 py-8 text-sm">جاري جلب أقفال الأدمن...</div>
          ) : locks.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6 text-center text-sm text-white/50">
              لا يوجد أي قفل جهاز أدمن مسجل حالياً. يمكن لأي أدمن جديد التسجيل بحرية.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {locks.map((lock) => (
                <div
                  key={lock.admin_user_id}
                  className="rounded-2xl bg-[#0e0e10] border border-white/10 p-5 flex flex-col justify-between gap-4 shadow-lg"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-white">
                        {lock.full_name ?? "حساب أدمن"}
                      </span>
                      <span className="rounded-md bg-[#FF6A00]/20 px-2 py-0.5 text-[10px] font-bold text-[#FFB35A]">
                        مقفول
                      </span>
                    </div>
                    {lock.phone && (
                      <div className="text-xs text-white/60 font-mono">📞 {lock.phone}</div>
                    )}
                    <div className="text-[11px] text-white/40 font-mono break-all">
                      Device ID: {lock.allowed_device_id}
                    </div>
                    <div className="text-[10px] text-white/30">
                      تاريخ القفل: {fmtDate(lock.created_at)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleClearLock(lock.admin_user_id)}
                    disabled={actionInProgress === lock.admin_user_id}
                    className="h-10 w-full rounded-xl bg-gradient-to-r from-[#FF2424] via-[#FF6A00] to-[#FFB35A] text-xs font-extrabold text-white shadow-md hover:opacity-90 transition disabled:opacity-50"
                  >
                    {actionInProgress === lock.admin_user_id
                      ? "جاري فك القفل..."
                      : "🔓 فك القفل (السماح بجهاز جديد)"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: ACTIVE CONNECTED DEVICES */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📱</span>
            <h2 className="text-lg font-bold text-white">الأجهزة المتصلة والنشطة ({devices.length})</h2>
          </div>

          {loading ? (
            <div className="text-center text-white/40 py-8 text-sm">جاري جلب الأجهزة النشطة...</div>
          ) : devices.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6 text-center text-sm text-white/50">
              لا توجد أجهزة متصلة مسجلة في النظام حالياً.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {devices.map((dev) => (
                <div
                  key={dev.device_id}
                  className="rounded-2xl bg-[#0e0e10] border border-white/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
                >
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-bold text-white">
                        {dev.full_name ?? "مستخدم"}
                      </span>
                      {dev.phone && (
                        <span className="text-xs text-white/60 font-mono">({dev.phone})</span>
                      )}
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                        {parseUA(dev.user_agent)}
                      </span>
                    </div>

                    <div className="text-[11px] text-white/40 font-mono break-all">
                      Device ID: {dev.device_id}
                    </div>

                    <div className="text-[10px] text-white/30">
                      آخر ظهور: {fmtDate(dev.last_seen)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleRemoveDevice(dev.device_id)}
                    disabled={actionInProgress === dev.device_id}
                    className="h-9 px-4 rounded-xl bg-red-500/15 text-xs font-bold text-red-400 border border-red-500/25 hover:bg-red-500/25 transition disabled:opacity-50 shrink-0"
                  >
                    {actionInProgress === dev.device_id
                      ? "جاري الفصل..."
                      : "🚪 تسجيل خروج وإغلاق الجهاز"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-white/25 pt-6 border-t border-white/5">
          Unlock Device Panel · FIT COACH Admin System
        </div>

      </div>
    </div>
  );
}
