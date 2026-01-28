"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type PreloaderProps = {
  className?: string;
};

const DEFAULT_ASSETS = ["/111.png", "/kalya.png", "/lava-cracks.svg", "/s.png"];

export function Preloader({ className }: PreloaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logoSrc, setLogoSrc] = useState("/s.png");

  const hasStartedRef = useRef(false);
  const logoCheckedRef = useRef(false);
  const assetsPrimedRef = useRef(false);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const killTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreOverflowRef = useRef<string | null>(null);
  const restoreHtmlOverflowRef = useRef<string | null>(null);
  const lastShownPathRef = useRef<string | null>(null);

  const assets = useMemo(() => DEFAULT_ASSETS, []);

  const forceEnableScroll = () => {
    try {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    } catch {}
  };

  const restoreScroll = () => {
    try {
      const prevBody = restoreOverflowRef.current;
      const prevHtml = restoreHtmlOverflowRef.current;
      document.body.style.overflow = prevBody && prevBody !== "hidden" ? prevBody : "";
      document.documentElement.style.overflow = prevHtml && prevHtml !== "hidden" ? prevHtml : "";
    } catch {}
  };

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;

    forceEnableScroll();

    if (lastShownPathRef.current === pathname) return;
    lastShownPathRef.current = pathname;

    hasStartedRef.current = false;
    setClosing(false);
    setProgress(0);
    setVisible(true);
  }, [pathname]);

  useEffect(() => {
    if (!pathname) return;

    let cancelled = false;
    const run = async () => {
      try {
        const supabase = createSupabaseBrowserClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) return;

        // Check if user is admin first - admins should bypass ban checks
        // Use RPC function directly as it uses security definer and bypasses RLS
        let isAdmin = false;
        try {
          // Try RPC function first (uses security definer, bypasses RLS)
          let rpcRes = await supabase.rpc("is_admin", { uid: user.id });
          if (rpcRes.error) {
            // If that fails, try without parameter (uses auth.uid() internally)
            rpcRes = await supabase.rpc("is_admin");
          }
          isAdmin = Boolean(!rpcRes.error && rpcRes.data);
          
          // Fallback: Try direct table query if RPC fails (may fail due to RLS)
          if (!isAdmin) {
            try {
              const adminRes = await supabase
                .from("admin_users")
                .select("user_id")
                .eq("user_id", user.id)
                .maybeSingle();
              isAdmin = Boolean(!adminRes.error && adminRes.data);
            } catch {
              // Table query failed, keep isAdmin as false
            }
          }
        } catch (err) {
          // If admin check fails, assume not admin
          isAdmin = false;
        }

        // Skip ban checks for admins
        if (isAdmin) return;

        const [deviceBanRes, userBanRes] = await Promise.all([
          supabase.rpc("is_device_banned"),
          supabase.rpc("is_user_banned", { uid: user.id }),
        ]);

        const isDeviceBanned = !deviceBanRes.error && Boolean(deviceBanRes.data);
        const isUserBanned = !userBanRes.error && Boolean(userBanRes.data);

        if (!isDeviceBanned && !isUserBanned) return;

        await supabase.auth.signOut();
        if (cancelled) return;
        router.replace("/login");
        router.refresh();
      } catch {}
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  useEffect(() => {
    let cancelled = false;

    const supabase = createSupabaseBrowserClient();

    const tick = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) return;

        // Check if user is admin first - admins should bypass ban checks
        let isAdmin = false;
        try {
          const adminRes = await supabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();
          
          isAdmin = Boolean(!adminRes.error && adminRes.data);
          
          // If not found in admin_users, try RPC function as fallback
          if (!isAdmin) {
            try {
              // Try with parameter first
              let rpcRes = await supabase.rpc("is_admin", { uid: user.id });
              if (rpcRes.error) {
                // If that fails, try without parameter (uses auth.uid() internally)
                rpcRes = await supabase.rpc("is_admin");
              }
              isAdmin = Boolean(!rpcRes.error && rpcRes.data);
            } catch {
              // RPC failed, keep isAdmin as false
            }
          }
        } catch (err) {
          // If admin check fails, assume not admin
          isAdmin = false;
        }

        // Skip ban checks for admins
        if (isAdmin) {
          // Still track device for admins, but skip ban checks
          await supabase.rpc("track_device");
          return;
        }

        const [deviceBanRes, userBanRes, trackRes] = await Promise.all([
          supabase.rpc("is_device_banned"),
          supabase.rpc("is_user_banned", { uid: user.id }),
          supabase.rpc("track_device"),
        ]);

        const isDeviceBanned = !deviceBanRes.error && Boolean(deviceBanRes.data);
        const isUserBanned = !userBanRes.error && Boolean(userBanRes.data);

        const trackErr = trackRes.error ? String(trackRes.error.message ?? "") : "";
        const trackErrLc = trackErr.toLowerCase();
        const isMultipleDevices = trackErrLc.includes("multiple devices");
        const isBanned = trackErrLc.includes("banned") || isDeviceBanned || isUserBanned;
        const shouldKick = isMultipleDevices || isBanned;

        if (!shouldKick) return;

        try {
          sessionStorage.setItem(
            "fitcoach_login_notice",
            isMultipleDevices ? "تم حظر الحساب لأن الحساب اتفتح على جهازين في نفس الوقت." : "هذا الحساب أو الجهاز محظور.",
          );
        } catch {}

        await supabase.auth.signOut();
        if (cancelled) return;
        router.replace("/login");
        router.refresh();
      } catch {}
    };

    const interval = setInterval(() => {
      void tick();
    }, 45000);

    void tick();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router]);

  useEffect(() => {
    if (!visible) return;

    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    restoreOverflowRef.current = prevOverflow;
    restoreHtmlOverflowRef.current = prevHtmlOverflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      restoreScroll();
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (!closing) return;
    restoreScroll();
  }, [closing, visible]);

  useEffect(() => {
    if (!visible) return;
    if (hasStartedRef.current) return;

    hasStartedRef.current = true;

    let cancelled = false;
    const startAt = performance.now();

    const MIN_SHOW_MS = 650;
    const MAX_WAIT_MS = 6500;
    const CLOSE_MS = 520;

    if (assetsPrimedRef.current) {
      const elapsed = performance.now() - startAt;
      const waitMs = Math.max(0, 260 - elapsed);
      setProgress(100);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      finishTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        restoreScroll();
        setClosing(true);
        setTimeout(() => {
          if (cancelled) return;
          setVisible(false);
        }, 320);
      }, waitMs);

      return () => {
        cancelled = true;
        if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      };
    }

    let doneCount = 0;
    const total = assets.length;

    const markOne = () => {
      if (cancelled) return;
      doneCount += 1;
      const pct = Math.max(0, Math.min(100, Math.round((doneCount / total) * 100)));
      setProgress(pct);
      if (doneCount >= total) {
        finish();
      }
    };

    const finish = () => {
      if (cancelled) return;
      if (closing) return;

      assetsPrimedRef.current = true;

      const elapsed = performance.now() - startAt;
      const waitMs = Math.max(0, MIN_SHOW_MS - elapsed);

      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      finishTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        setProgress(100);
        restoreScroll();
        setClosing(true);
        setTimeout(() => {
          if (cancelled) return;
          setVisible(false);
        }, CLOSE_MS);
      }, waitMs);
    };

    const loadImage = (src: string) => {
      const img = new window.Image();
      const onDone = () => {
        img.onload = null;
        img.onerror = null;
        markOne();
      };
      img.onload = onDone;
      img.onerror = onDone;
      img.src = src;
    };

    const loadVideo = (src: string) => {
      const v = document.createElement("video");
      const onDone = () => {
        v.onloadeddata = null;
        v.onerror = null;
        markOne();
      };
      v.onloadeddata = onDone;
      v.onerror = onDone;
      v.preload = "auto";
      v.src = src;
      setTimeout(onDone, 3600);
    };

    setProgress(8);

    for (const src of assets) {
      if (src.endsWith(".mp4") || src.endsWith(".webm") || src.endsWith(".mov")) {
        loadVideo(src);
      } else {
        loadImage(src);
      }
    }

    if (killTimerRef.current) clearTimeout(killTimerRef.current);
    killTimerRef.current = setTimeout(() => {
      if (cancelled) return;
      finish();
    }, MAX_WAIT_MS);

    return () => {
      cancelled = true;
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      if (killTimerRef.current) clearTimeout(killTimerRef.current);
    };
  }, [assets, closing, visible]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black",
        closing
          ? "pointer-events-none opacity-0 transition-opacity duration-500"
          : "opacity-100",
        className,
      )}
      aria-busy={!closing}
      aria-live="polite"
    >
      <div className="relative flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-6" dir="rtl">
        <div className="pointer-events-none absolute -inset-x-20 -top-28 h-56 opacity-60 blur-3xl bg-[radial-gradient(520px_220px_at_50%_50%,rgba(255,106,0,0.25),transparent_70%)]" />
        <div className="pointer-events-none absolute -inset-x-20 -bottom-28 h-56 opacity-55 blur-3xl bg-[radial-gradient(520px_220px_at_50%_50%,rgba(255,36,36,0.22),transparent_70%)]" />

        <div className="relative h-24 w-[260px] sm:h-28 sm:w-[420px] preloader-animate animate-[preloaderBreath_2.6s_ease-in-out_infinite]">
          <Image
            src={logoSrc}
            alt="FIT COACH"
            fill
            priority
            sizes="(min-width: 640px) 420px, 260px"
            className="object-contain drop-shadow-[0_22px_70px_rgba(255,106,0,0.38)]"
            onError={() => setLogoSrc("/s.png")}
          />
        </div>

        <div className="w-[min(560px,86vw)]">
          <div className="relative h-3 overflow-hidden rounded-full bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_28px_90px_-72px_rgba(0,0,0,0.92)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF2424] via-[#FF6A00] to-[#FFB35A] transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
            <div className="pointer-events-none absolute inset-0 opacity-35 preloader-animate animate-[preloaderShimmer_1.25s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)]" />
          </div>

          <div className="mt-4 text-center font-heading text-xs tracking-[0.22em] text-white/70">
            جاري التحميل… {progress}%
          </div>
        </div>
      </div>
    </div>
  );
}
