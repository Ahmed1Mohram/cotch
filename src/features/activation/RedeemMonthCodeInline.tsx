"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type CourseRow = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 21l-4.3-4.3" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}

export function RedeemMonthCodeInline({
  initialCourseSlug,
  initialCourseTitle,
  ageGroupId,
  pkgSlug,
  onOpen,
  onActivated,
}: {
  initialCourseSlug?: string;
  initialCourseTitle?: string;
  ageGroupId?: string;
  pkgSlug?: string;
  onOpen?: (monthNumber: number) => void;
  onActivated?: (monthNumber: number) => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [resolvedCourseSlug, setResolvedCourseSlug] = useState<string | null>(initialCourseSlug ?? null);
  const [resolvedCourseTitle, setResolvedCourseTitle] = useState<string | null>(initialCourseTitle ?? null);
  const [resolvedMonthNumber, setResolvedMonthNumber] = useState<number | null>(null);
  const [resolvedPlayerCardId, setResolvedPlayerCardId] = useState<string | null>(null);

  const openLabel = useMemo(() => {
    if (resolvedPlayerCardId) return "فتح الكارت";
    if (resolvedMonthNumber) return "فتح الفيديوهات";
    return "فتح الكورس";
  }, [resolvedMonthNumber, resolvedPlayerCardId]);

  const canOpen = useMemo(() => {
    return Boolean(success && resolvedCourseSlug);
  }, [resolvedCourseSlug, success]);

  useEffect(() => {
    setResolvedCourseSlug(initialCourseSlug ?? null);
    setResolvedCourseTitle(initialCourseTitle ?? null);
    setResolvedMonthNumber(null);
    setResolvedPlayerCardId(null);
  }, [initialCourseSlug, initialCourseTitle]);

  const normalizeCode = (raw: string) => {
    const compact = raw.trim().replace(/\s+/g, "").toUpperCase();
    return compact.replace(/[IL]/g, "1").replace(/O/g, "0");
  };

  const redeem = async () => {
    const c = normalizeCode(code);
    if (!c) return;

    const supabase = createSupabaseBrowserClient();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResolvedMonthNumber(null);
    setResolvedPlayerCardId(null);

    const res = await supabase.rpc("redeem_any_code", { p_code: c });

    if (res.error) {
      const msg = String(res.error.message ?? "");
      if (msg === "Not authenticated") {
        setError("لازم تسجل دخول الأول.");
      } else if (msg === "Course code") {
        setError("ده كود اشتراك كورس (مش كود شهر). استخدم تفعيل الكورس.");
      } else if (msg === "Card code") {
        setError("ده كود كارت (مش كود شهر). استخدم تفعيل الكورس / الكارت.");
      } else if (msg === "Invalid code") {
        setError("الكود غير صحيح. تأكد إن الكود مكتوب صح.");
      } else if (msg === "Code already used") {
        setError("الكود مستخدم قبل كده.");
      } else {
        setError(msg);
      }
      setLoading(false);
      return;
    }

    const data = (res.data ?? null) as any;
    const courseId = String(data?.course_id ?? "");
    const monthNumber = Number(data?.month_number ?? 0);
    const playerCardId = String(data?.player_card_id ?? "");

    if (!courseId) {
      setSuccess("تم التفعيل بنجاح.");
      router.refresh();
      setLoading(false);
      return;
    }

    if (playerCardId) {
      setResolvedPlayerCardId(playerCardId);
    }

    if (Number.isFinite(monthNumber) && monthNumber > 0) {
      setResolvedMonthNumber(monthNumber);
    }

    const courseRes = await supabase
      .from("courses")
      .select("id,slug,title_ar,title_en")
      .eq("id", courseId)
      .maybeSingle();

    if (!courseRes.error && courseRes.data) {
      const row = courseRes.data as CourseRow;
      setResolvedCourseSlug(String(row.slug));
      setResolvedCourseTitle(String(row.title_ar ?? row.title_en ?? row.slug));
    }

    if (playerCardId) {
      setSuccess("تم تفعيل الكارت بنجاح.");
    } else if (Number.isFinite(monthNumber) && monthNumber > 0) {
      setSuccess(`تم تفعيل الشهر رقم ${monthNumber}.`);
      if (typeof onActivated === "function") {
        onActivated(monthNumber);
      }
    } else {
      setSuccess("تم تفعيل الكورس بنجاح.");
    }
    router.refresh();
    setLoading(false);
  };

  const open = () => {
    if (!resolvedCourseSlug) return;

    if (typeof onOpen === "function" && resolvedMonthNumber) {
      onOpen(resolvedMonthNumber);
      return;
    }

    const ag = typeof ageGroupId === "string" ? ageGroupId.trim() : "";
    const pkg = typeof pkgSlug === "string" ? pkgSlug.trim() : "";

    const qs = new URLSearchParams();
    if (ag) qs.set("ag", ag);
    if (pkg) qs.set("pkg", pkg);

    const suffix = qs.toString() ? `?${qs.toString()}` : "";

    if (resolvedPlayerCardId) {
      router.push(`/programs/${resolvedCourseSlug}/card/${resolvedPlayerCardId}${suffix}`);
      return;
    }

    if (resolvedMonthNumber) {
      router.push(`/programs/${resolvedCourseSlug}/month/${resolvedMonthNumber}${suffix}`);
      return;
    }

    router.push(`/programs/${resolvedCourseSlug}${suffix}`);
  };

  return (
    <div className="rounded-3xl bg-black/45 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]">
      <div className="flex flex-wrap items-center justify-between gap-3" dir="rtl">
        <div>
          <div className="text-right font-heading text-xl tracking-[0.10em] text-white">تفعيل الشهر</div>
          <div className="mt-2 text-right text-sm text-white/70">اكتب كود الشهر علشان تشتغل معاك الفيديوهات.</div>
        </div>
        <Link href="/activate" className="text-xs text-white/70 hover:text-white transition">
          صفحة التفعيل
        </Link>
      </div>

      <div className="mt-5 flex items-center gap-3" dir="ltr">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            <SearchIcon className="h-5 w-5" />
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="اكتب الكود هنا"
            className="h-12 w-full rounded-2xl bg-black/35 pl-12 pr-4 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] outline-none placeholder:text-white/35 focus:shadow-[0_0_0_1px_rgba(255,106,0,0.30),0_30px_90px_-70px_rgba(255,106,0,0.35)]"
          />
        </div>

        <button
          type="button"
          onClick={redeem}
          disabled={loading || !code.trim()}
          className="h-12 rounded-2xl bg-gradient-to-r from-[#FF2424] via-[#FF6A00] to-[#FFB35A] px-6 text-xs font-extrabold tracking-[0.12em] text-white shadow-[0_0_0_1px_rgba(255,179,90,0.24),0_28px_100px_-70px_rgba(255,106,0,0.75)] transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "..." : "تفعيل"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl bg-[#FF2424]/10 px-4 py-3 text-sm text-[#FFB35A] shadow-[0_0_0_1px_rgba(255,36,36,0.20)]" dir="rtl">
          {error}
          <div className="mt-2 text-xs text-white/70">
            لو مش عامل تسجيل دخول:
            <Link href="/login" className="ms-2 text-white hover:text-white/90 underline">
              سجل دخول
            </Link>
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-2xl bg-[#FF6A00]/10 px-4 py-3 text-sm text-white/85 shadow-[0_0_0_1px_rgba(255,106,0,0.22)]" dir="rtl">
          {success}
          <div className="mt-2 text-xs text-white/80">
            {resolvedCourseTitle ? `الكورس: ${resolvedCourseTitle}` : null}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3" dir="rtl">
        <button
          type="button"
          onClick={open}
          disabled={!canOpen}
          className="h-11 rounded-2xl bg-white/5 px-6 text-xs font-extrabold tracking-[0.12em] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 disabled:opacity-50"
        >
          {openLabel}
        </button>
      </div>
    </div>
  );
}
