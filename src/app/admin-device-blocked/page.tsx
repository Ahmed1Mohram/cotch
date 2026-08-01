"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { getCachedUser } from "@/lib/sessionCache";

const SECRET_PASSWORD = "010052";

export default function AdminDeviceBlockedPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(true);
  const [lockHolders, setLockHolders] = useState<
    Array<{ full_name: string | null; phone: string | null }>
  >([]);

  // Hidden unlock state
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockInput, setUnlockInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tap the hidden dot 3 times quickly to show the password prompt
  const handleSecretTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      setShowUnlock(true);
      setUnlockInput("");
      setUnlockError("");
    }
  };

  const handleUnlock = async () => {
    if (unlockInput.trim() !== SECRET_PASSWORD) {
      setUnlockError("كلمة السر غلط.");
      return;
    }
    setUnlocking(true);
    setUnlockError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { user } = await getCachedUser(supabase);
      if (!user?.id) {
        setUnlockError("المستخدم مش مسجل.");
        setUnlocking(false);
        return;
      }
      // Delete the device lock so this device becomes the new allowed one
      await supabase
        .from("admin_device_locks")
        .delete()
        .eq("admin_user_id", user.id);

      setUnlocked(true);
      setTimeout(() => {
        router.replace("/admin");
      }, 1200);
    } catch {
      setUnlockError("حصل خطأ، جرب تاني.");
      setUnlocking(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { user } = await getCachedUser(supabase);

        if (!user?.id) {
          if (cancelled) return;
          setBusy(false);
          return;
        }

        let isAdmin = false;
        try {
          const rpcRes = await Promise.resolve(
            supabase.rpc("is_admin", { uid: user.id })
          );
          isAdmin = Boolean(!rpcRes.error && rpcRes.data);

          if (!isAdmin) {
            const adminRes = await supabase
              .from("admin_users")
              .select("user_id")
              .eq("user_id", user.id)
              .maybeSingle();
            isAdmin = Boolean(!adminRes.error && adminRes.data);
          }
        } catch {}

        if (!isAdmin) {
          await supabase.auth.signOut();
          return;
        }

        const { data: lockRow } = await supabase
          .from("admin_device_locks")
          .select("allowed_device_id")
          .eq("admin_user_id", user.id)
          .maybeSingle();

        if (lockRow?.allowed_device_id) {
          const { data: logs } = await supabase
            .from("device_access_logs")
            .select("user_id")
            .eq("device_id", lockRow.allowed_device_id)
            .neq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5);

          const otherUserIds = Array.from(
            new Set(
              (logs ?? []).map((l: any) => l.user_id).filter(Boolean)
            )
          );

          if (otherUserIds.length > 0) {
            const { data: profiles } = await supabase
              .from("user_profiles")
              .select("full_name, phone")
              .in("user_id", otherUserIds);

            if (profiles && profiles.length > 0 && !cancelled) {
              setLockHolders(
                profiles.map((p: any) => ({
                  full_name: p.full_name ?? null,
                  phone: p.phone ?? null,
                }))
              );
            }
          }
        }
      } catch {
      } finally {
        if (!cancelled) setBusy(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050506] text-white" dir="rtl">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">

        <div className="text-3xl font-extrabold tracking-wide">
          الدخول للأدمن مسموح من جهاز / متصفح واحد فقط
        </div>
        <div className="mt-3 text-sm text-white/75">
          الحساب الأدمن بالفعل مفتوح على جهاز أو متصفح آخر. افتح الأدمن من نفس الجهاز الأساسي.
        </div>

        {lockHolders.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5 text-right w-full">
            <div className="text-xs font-semibold text-[#FFB35A] uppercase tracking-wider mb-3">
              الحسابات المسجلة التي استخدمت هذا الجهاز النشط مؤخراً:
            </div>
            <div className="space-y-3">
              {lockHolders.map((holder, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-sm font-semibold text-white">
                    {holder.full_name ?? "اسم غير متوفر"}
                  </span>
                  <span className="font-mono text-xs text-white/60">
                    {holder.phone ?? "رقم غير متوفر"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={async () => {
              try {
                setBusy(true);
                const supabase = createSupabaseBrowserClient();
                await supabase.auth.signOut();
              } catch {
              } finally {
                setBusy(false);
                router.replace("/login");
                router.refresh();
              }
            }}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/10 px-6 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.14)] transition hover:bg-white/15 disabled:opacity-60"
          >
            {busy ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/5 px-6 text-sm font-semibold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10"
          >
            الرئيسية
          </a>
        </div>

        <div className="mt-4 text-xs text-white/55">
          لو محتاج تبدّل الجهاز، لازم تمسح القفل من قاعدة البيانات.
        </div>

        {/* ── Visible unlock button ── */}
        <button
          type="button"
          onClick={() => {
            setShowUnlock(true);
            setUnlockInput("");
            setUnlockError("");
          }}
          className="mt-6 inline-flex h-9 items-center justify-center rounded-xl bg-[#FF6A00]/15 px-4 text-xs font-bold text-[#FFB35A] border border-[#FF6A00]/30 hover:bg-[#FF6A00]/25 transition"
        >
          🔐 فك القفل بكلمة السر
        </button>

      </div>

      {/* ── Password prompt modal ── */}
      {showUnlock && !unlocked && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="w-full max-w-xs rounded-3xl bg-[#111] border border-white/10 p-7 shadow-2xl flex flex-col gap-4">
            <div className="text-base font-bold text-white text-center">
              🔐 أدخل كلمة السر
            </div>
            <input
              type="password"
              value={unlockInput}
              onChange={(e) => {
                setUnlockInput(e.target.value);
                setUnlockError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleUnlock();
              }}
              placeholder="كلمة السر"
              autoFocus
              className="h-11 w-full rounded-2xl bg-white/10 px-4 text-sm text-white placeholder:text-white/30 outline-none border border-white/10 focus:border-[#FF6A00]/60 transition text-center tracking-widest"
            />
            {unlockError && (
              <div className="text-xs text-red-400 text-center">{unlockError}</div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleUnlock()}
                disabled={unlocking}
                className="flex-1 h-10 rounded-2xl bg-gradient-to-r from-[#FF2424] via-[#FF6A00] to-[#FFB35A] text-sm font-bold text-white disabled:opacity-60 transition"
              >
                {unlocking ? "جاري الفتح..." : "فتح"}
              </button>
              <button
                type="button"
                onClick={() => setShowUnlock(false)}
                className="flex-1 h-10 rounded-2xl bg-white/10 text-sm font-semibold text-white/70 hover:bg-white/15 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success overlay ── */}
      {unlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-6xl mb-5">✅</div>
            <div className="text-lg font-bold text-white">تم فتح الجهاز! جاري التوجيه...</div>
          </div>
        </div>
      )}
    </div>
  );
}
