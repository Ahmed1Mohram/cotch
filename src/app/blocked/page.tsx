"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function BlockedPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
      } catch {
        // ignore
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
        <div className="text-3xl font-extrabold tracking-wide">تم حظر هذا الجهاز / الحساب</div>
        <div className="mt-3 text-sm text-white/75">
          لو شايف إن ده بالخطأ، تواصل مع الدعم.
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={async () => {
              try {
                setBusy(true);
                const supabase = createSupabaseBrowserClient();
                await supabase.auth.signOut();
              } catch {
                // ignore
              } finally {
                setBusy(false);
                router.replace("/login");
                router.refresh();
              }
            }}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/10 px-6 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.14)] transition hover:bg-white/15 disabled:opacity-60"
          >
            {busy ? "جاري تسجيل الخروج..." : "اضغط هنا لتسجيل الدخول مجددًا"}
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/5 px-6 text-sm font-semibold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10"
          >
            الرئيسية
          </a>
        </div>
        <div className="mt-4 text-xs text-white/55">لن تتمكن من الدخول طالما الحظر مفعّل.</div>
      </div>
    </div>
  );
}
