"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function ActivateCoursePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openHref, setOpenHref] = useState<string | null>(null);
  const [openLabel, setOpenLabel] = useState<string | null>(null);

  const normalizeCode = useCallback((raw: string) => {
    const compact = raw.trim().replace(/\s+/g, "").toUpperCase();
    return compact.replace(/[IL]/g, "1").replace(/O/g, "0");
  }, []);

  const translateError = useCallback((msg: string) => {
    if (msg === "Not authenticated") return "لازم تسجل دخول الأول.";
    if (msg === "Device banned" || msg === "User banned") return "هذا الحساب أو الجهاز محظور.";
    if (msg === "Invalid code") return "الكود غير صحيح. تأكد إن الكود مكتوب صح.";
    if (msg === "Code already used") return "الكود مستخدم قبل كده.";
    if (msg === "Course code") return "ده كود اشتراك كورس (مش كود شهر/كارت).";
    if (msg === "Month code") return "ده كود شهر.";
    if (msg === "Card code") return "ده كود كارت.";
    return msg;
  }, []);

  const loginHref = useMemo(() => {
    return "/login?next=%2Factivate";
  }, []);

  const redeem = useCallback(
    async (overrideCode?: string) => {
      const c = normalizeCode(overrideCode ?? code);
      if (!c) return;

      const supabase = createSupabaseBrowserClient();
      setLoading(true);
      setError(null);
      setSuccess(null);
      setOpenHref(null);
      setOpenLabel(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        try {
          sessionStorage.setItem("fitcoach_pending_activation_code", c);
        } catch {
          // ignore
        }
        setLoading(false);
        router.replace(loginHref);
        return;
      }

      const res = await supabase.rpc("redeem_any_code", { p_code: c });

      if (res.error) {
        setError(translateError(String(res.error.message ?? "")));
        setLoading(false);
        return;
      }

      const data = (res.data ?? null) as any;
      const courseId = String(data?.course_id ?? "");
      const monthNumber = Number(data?.month_number ?? 0);
      const playerCardId = String(data?.player_card_id ?? "");

      let courseSlug = "";
      let courseTitle = "";

      if (courseId) {
        const courseRes = await supabase
          .from("courses")
          .select("id,slug,title_ar,title_en")
          .eq("id", courseId)
          .maybeSingle();

        if (!courseRes.error && courseRes.data) {
          courseSlug = String((courseRes.data as any).slug ?? "");
          courseTitle = String((courseRes.data as any).title_ar ?? (courseRes.data as any).title_en ?? courseSlug);
        }
      }

      if (playerCardId && courseSlug) {
        setSuccess("تم تفعيل الكارت بنجاح.");
        setOpenHref(`/programs/${encodeURIComponent(courseSlug)}/card/${encodeURIComponent(playerCardId)}`);
        setOpenLabel(courseTitle ? `فتح الكارت — ${courseTitle}` : "فتح الكارت");
      } else if (Number.isFinite(monthNumber) && monthNumber > 0 && courseSlug) {
        setSuccess(`تم تفعيل الشهر رقم ${monthNumber}.`);
        setOpenHref(`/programs/${encodeURIComponent(courseSlug)}/month/${encodeURIComponent(String(monthNumber))}`);
        setOpenLabel(courseTitle ? `فتح الشهر — ${courseTitle}` : "فتح الشهر");
      } else if (courseSlug) {
        setSuccess("تم تفعيل الكورس بنجاح.");
        setOpenHref(`/programs/${encodeURIComponent(courseSlug)}`);
        setOpenLabel(courseTitle ? `فتح الكورس — ${courseTitle}` : "فتح الكورس");
      } else {
        setSuccess("تم التفعيل بنجاح.");
      }

      router.refresh();
      setLoading(false);
    },
    [code, loginHref, normalizeCode, router, translateError],
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      let pending = "";
      try {
        pending = sessionStorage.getItem("fitcoach_pending_activation_code") ?? "";
        if (pending) sessionStorage.removeItem("fitcoach_pending_activation_code");
      } catch {
        pending = "";
      }

      const c = normalizeCode(pending);
      if (!c) return;

      if (!cancelled) setCode(c);

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;

      if (!cancelled) {
        await redeem(c);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [normalizeCode, redeem]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6" dir="rtl">
      <div className="w-full max-w-xl rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
        <div className="text-right font-heading text-3xl tracking-[0.10em] text-white">
          التفعيل
        </div>
        <div className="mt-3 text-right text-sm text-white/70">
          اكتب كود الكورس / الشهر / الكارت اللي استلمته.
        </div>

        <div className="mt-6">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="اكتب الكود هنا"
            className="h-12 w-full rounded-2xl bg-black/35 px-4 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] outline-none placeholder:text-white/35 focus:shadow-[0_0_0_1px_rgba(255,106,0,0.30),0_30px_90px_-70px_rgba(255,106,0,0.35)]"
            dir="ltr"
          />
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl bg-[#FF2424]/10 px-4 py-3 text-sm text-[#FFB35A] shadow-[0_0_0_1px_rgba(255,36,36,0.20)]">
            {error}
            <div className="mt-2 text-xs text-white/70">
              لو مش عامل تسجيل دخول:
              <Link href={loginHref} className="ms-2 text-white hover:text-white/90 underline">
                سجل دخول
              </Link>
            </div>
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-2xl bg-[#FF6A00]/10 px-4 py-3 text-sm text-white/85 shadow-[0_0_0_1px_rgba(255,106,0,0.22)]">
            {success}
          </div>
        ) : null}

        {openHref && openLabel ? (
          <Link
            href={openHref}
            className="mt-4 block w-full rounded-2xl bg-white/10 px-5 py-4 text-center text-xs font-extrabold tracking-[0.12em] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.14)] transition hover:bg-white/15"
          >
            {openLabel}
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => redeem()}
          disabled={loading || !code.trim()}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#FF2424] via-[#FF6A00] to-[#FFB35A] px-5 py-4 text-sm font-extrabold tracking-[0.12em] text-white shadow-[0_0_0_1px_rgba(255,179,90,0.24),0_28px_100px_-70px_rgba(255,106,0,0.75)] transition hover:brightness-110 active:translate-y-px disabled:opacity-50"
        >
          {loading ? "جاري التفعيل..." : "تفعيل"}
        </button>

        <div className="mt-6 flex flex-wrap justify-between gap-3 text-xs">
          <Link href="/login" className="text-white/70 hover:text-white transition">
            تسجيل الدخول
          </Link>
          <Link href="/packages" className="text-white/70 hover:text-white transition">
            الباقات
          </Link>
        </div>
      </div>
    </div>
  );
}
