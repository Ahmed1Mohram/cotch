"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { MotionConfig, motion, useAnimationControls } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { phoneToEmail } from "@/lib/phoneAuth";

function EyeToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  const [blinkKey, setBlinkKey] = useState(0);

  return (
    <motion.button
      type="button"
      onClick={() => {
        setBlinkKey((v) => v + 1);
        onClick();
      }}
      className={cn(
        "group inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-md transition",
        "hover:bg-white/7 hover:text-white",
        "active:scale-[0.98]",
      )}
      aria-label={open ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
    >
      <motion.svg
        key={blinkKey}
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: [1, 0.18, 1] }}
        transition={{ duration: 0.24, ease: "easeInOut" }}
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <motion.path
          d="M4 20 20 4"
          initial={false}
          animate={{ opacity: open ? 0 : 1, pathLength: open ? 0 : 1 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        />
      </motion.svg>
    </motion.button>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [logoSrc, setLogoSrc] = useState("/s.png");
  const [teaserAvailable, setTeaserAvailable] = useState(false);
  const teaserRef = useRef<HTMLVideoElement | null>(null);
  const [swipeKey, setSwipeKey] = useState(0);
  const [swipeDistance, setSwipeDistance] = useState(1400);
  const swipeControls = useAnimationControls();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const phoneDigits = useMemo(() => phone.replace(/\D/g, ""), [phone]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("fitcoach_post_register_login");
      if (!raw) return;
      sessionStorage.removeItem("fitcoach_post_register_login");
      const parsed = JSON.parse(raw);
      const p = typeof parsed?.phone === "string" ? parsed.phone : "";
      const pw = typeof parsed?.password === "string" ? parsed.password : "";
      if (p) setPhone(p);
      if (pw) setPassword(pw);
      setSuccess("تم إنشاء الحساب بنجاح. بياناتك جاهزة—اضغط دخول.");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const notice = sessionStorage.getItem("fitcoach_login_notice");
      if (!notice) return;
      sessionStorage.removeItem("fitcoach_login_notice");
      setSuccess(null);
      setError(notice);
    } catch {}
  }, []);

  const nextFromQuery = useMemo(() => {
    const raw = searchParams.get("next") ?? "";
    if (!raw) return null;
    if (!raw.startsWith("/")) return null;
    if (raw.startsWith("//")) return null;
    if (raw === "/login" || raw.startsWith("/login?")) return null;
    if (raw === "/register" || raw.startsWith("/register?")) return null;
    return raw;
  }, [searchParams]);

  useEffect(() => {
    fetch("/logo.png", { method: "HEAD" })
      .then((r) => {
        if (r.ok) setLogoSrc("/logo.png");
      })
      .catch(() => {});

    fetch("/register-teaser.mp4", { method: "HEAD" })
      .then((r) => {
        if (r.ok) setTeaserAvailable(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const update = () => {
      try {
        setSwipeDistance(Math.max(1400, Math.ceil(window.innerWidth * 1.25)));
      } catch {}
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      });

    const delayMs = 1000;
    const enterMs = 220;
    const settleMs = 140;
    const holdMs = Math.max(0, 3000 - delayMs - enterMs - settleMs);

    const run = async () => {
      while (!cancelled) {
        try {
          swipeControls.stop();
          swipeControls.set({ x: -swipeDistance, opacity: 0, skewX: -12, scale: 0.98 });

          await sleep(delayMs);
          if (cancelled) return;

          await swipeControls.start({
            x: 70,
            opacity: 1,
            skewX: 6,
            scale: 1.03,
            transition: { duration: enterMs / 1000, ease: [0.2, 0.9, 0.1, 1] },
          });
          if (cancelled) return;

          await swipeControls.start({
            x: 0,
            opacity: 1,
            skewX: 0,
            scale: 1,
            transition: { duration: settleMs / 1000, ease: "easeOut" },
          });
          if (cancelled) return;

          await sleep(holdMs);
          if (cancelled) return;
        } catch {
          // ignore
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      swipeControls.stop();
    };
  }, [swipeControls, swipeDistance, swipeKey]);

  useEffect(() => {
    if (!teaserAvailable) return;
    const v = teaserRef.current;
    if (!v) return;

    const onTimeUpdate = () => {
      if (v.currentTime >= 3) {
        setSwipeKey((k) => k + 1);
        v.currentTime = 0;
        void v.play().catch(() => {});
      }
    };

    const onLoaded = () => {
      try {
        v.currentTime = 0;
      } catch {}
      setSwipeKey((k) => k + 1);
      void v.play().catch(() => {});
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadeddata", onLoaded);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadeddata", onLoaded);
    };
  }, [teaserAvailable]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (phoneDigits.length !== 11) {
      setError("اكتب رقم موبايل صحيح.");
      return;
    }

    if (password.trim().length < 6) {
      setError("كلمة السر لازم تكون 6 حروف/أرقام على الأقل.");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    const deviceBanRes = await supabase.rpc("is_device_banned");
    if (!deviceBanRes.error && Boolean(deviceBanRes.data)) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
      router.replace("/blocked");
      router.refresh();
      return;
    }

    const emailForAuth = phoneToEmail(phoneDigits);
    let { data, error } = await supabase.auth.signInWithPassword({
      email: emailForAuth,
      password,
    });

    if (error) {
      const raw = String(error.message ?? "");
      const msg = raw.toLowerCase();
      const looksLikeWrongCreds = msg.includes("invalid login credentials") || (msg.includes("invalid") && msg.includes("credentials"));
      if (looksLikeWrongCreds) {
        const legacyEmail = `${phoneDigits}@fitcoach.local`;
        const retry = await supabase.auth.signInWithPassword({ email: legacyEmail, password });
        data = retry.data;
        error = retry.error;
      }
    }

    if (error) {
      const raw = String(error.message ?? "");
      const msg = raw.toLowerCase();
      if (msg.includes("email not confirmed")) {
        setError("الحساب محتاج تفعيل. لو دي منصة رقم موبايل، اقفل Confirm email من إعدادات Supabase Auth.");
        return;
      }
      if (msg.includes("invalid login credentials") || msg.includes("invalid") && msg.includes("credentials")) {
        setError("الرقم أو كلمة السر غلط.");
        return;
      }
      setError(raw);
      return;
    }

    const userId = data.user?.id ? String(data.user.id) : "";
    if (!userId) {
      setError("حصل خطأ غير متوقع.");
      return;
    }

    const userBanRes = await supabase.rpc("is_user_banned", { uid: userId });
    if (!userBanRes.error && Boolean(userBanRes.data)) {
      await supabase.auth.signOut();
      router.replace("/blocked");
      router.refresh();
      return;
    }

    const trackRes = await supabase.rpc("track_device");
    if (trackRes.error) {
      await supabase.auth.signOut();
      const msg = String(trackRes.error.message ?? "");
      if (msg.toLowerCase().includes("multiple devices")) {
        router.replace("/blocked");
        router.refresh();
      } else {
        if (msg.toLowerCase().includes("banned")) {
          router.replace("/blocked");
          router.refresh();
        } else {
          setError(msg);
        }
      }
      return;
    }

    let isAdmin = false;
    try {
      const adminRes = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      isAdmin = !adminRes.error && Boolean(adminRes.data);
    } catch {
      isAdmin = false;
    }

    try {
      const user = data.user;
      const meta = (user as any)?.user_metadata ?? {};

      const age =
        typeof meta.age_years === "number"
          ? meta.age_years
          : typeof meta.age_years === "string"
            ? Number.parseInt(meta.age_years, 10)
            : null;

      const height =
        typeof meta.height_cm === "number"
          ? meta.height_cm
          : typeof meta.height_cm === "string"
            ? Number.parseInt(meta.height_cm, 10)
            : null;

      const weight =
        typeof meta.weight_kg === "number"
          ? meta.weight_kg
          : typeof meta.weight_kg === "string"
            ? Number.parseFloat(meta.weight_kg)
            : null;

      if (user) {
        const payload: any = {
          user_id: user.id,
          full_name: typeof meta.full_name === "string" && meta.full_name.trim() ? meta.full_name.trim() : null,
          phone: phoneDigits || null,
        };
        if (typeof age === "number" && Number.isFinite(age)) payload.age_years = age;
        if (typeof height === "number" && Number.isFinite(height)) payload.height_cm = height;
        if (typeof weight === "number" && Number.isFinite(weight)) payload.weight_kg = weight;

        await supabase.from("user_profiles").upsert(payload, { onConflict: "user_id" });
      }
    } catch {}

    setSuccess("تم تسجيل الدخول بنجاح.");
    const targetNext = nextFromQuery ?? (isAdmin ? "/admin" : "/");
    router.replace(`/welcome?next=${encodeURIComponent(targetNext)}`);
    router.refresh();
  }

  const inputCls =
    "h-12 w-full rounded-2xl bg-black/35 px-4 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] outline-none placeholder:text-white/35 focus:shadow-[0_0_0_1px_rgba(255,106,0,0.30),0_30px_90px_-70px_rgba(255,106,0,0.35)]";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050506]">
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(1000px_520px_at_14%_24%,rgba(255,106,0,0.20),transparent_62%),radial-gradient(920px_520px_at_86%_34%,rgba(255,36,36,0.14),transparent_64%),radial-gradient(900px_520px_at_55%_70%,rgba(255,255,255,0.05),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/25 to-black/70" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-16" dir="rtl">
        <div className="w-full max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_520px] lg:items-stretch">
            <div className="relative overflow-hidden rounded-[34px] p-[2px] bg-gradient-to-r from-[#FF2424]/55 via-white/10 to-[#FFB35A]/55 shadow-[0_0_0_1px_rgba(255,179,90,0.10),0_80px_240px_-180px_rgba(0,0,0,0.98)]">
              <div className="relative h-full min-h-[260px] overflow-hidden rounded-[32px] bg-black/45 backdrop-blur-2xl">
                <div className="pointer-events-none absolute inset-0 opacity-10">
                  <Image src="/lava-cracks.svg" alt="" fill sizes="100vw" className="object-cover" />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
                <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(900px_420px_at_30%_20%,rgba(255,106,0,0.20),transparent_62%),radial-gradient(900px_420px_at_80%_40%,rgba(255,36,36,0.14),transparent_64%)]" />

                {teaserAvailable ? (
                  <video
                    ref={teaserRef}
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                    src="/register-teaser.mp4"
                    autoPlay
                    muted
                    loop={false}
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                  />
                ) : (
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_20%,rgba(255,106,0,0.24),transparent_64%),radial-gradient(900px_420px_at_50%_90%,rgba(255,36,36,0.16),transparent_68%)]" />
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,179,90,0.65)_1px,transparent_1.6px)] [background-size:34px_34px] [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent_72%)]" />
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_42%,rgba(0,0,0,0.55)_78%,rgba(0,0,0,0.90)_100%)]" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6" dir="rtl">
                  <div className="translate-y-24 text-center sm:translate-y-32">
                    <MotionConfig reducedMotion="never">
                      <motion.div
                        className="inline-block"
                        initial={{ x: -swipeDistance, opacity: 0, skewX: -12, scale: 0.98 }}
                        animate={swipeControls}
                      >
                        <div className="teaser-neon-text font-[var(--font-cairo)] text-4xl font-black tracking-[0.10em] sm:text-5xl">
                          متنجز سجل
                        </div>
                      </motion.div>
                    </MotionConfig>
                  </div>
                </div>

                {!teaserAvailable ? (
                  <div className="absolute bottom-0 left-0 right-0 p-6" dir="rtl">
                    <div className="rounded-3xl bg-black/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_44px_160px_-120px_rgba(0,0,0,0.98)] backdrop-blur-2xl">
                      <div className="text-sm text-white/70">
                        ضيف ملف <span className="text-white/85">register-teaser.mp4</span> داخل <span className="text-white/85">public</span>.
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="w-full max-w-xl justify-self-end">
              <div className="flex items-center justify-center">
                <div className="relative h-16 w-[260px] sm:h-20 sm:w-[340px]">
                  <Image
                    src={logoSrc}
                    alt="FIT COACH"
                    fill
                    priority
                    sizes="340px"
                    className="object-contain drop-shadow-[0_22px_70px_rgba(255,106,0,0.38)]"
                    onError={() => setLogoSrc("/s.png")}
                  />
                </div>
              </div>

              <div className="mt-10 rounded-[34px] p-[2px] bg-gradient-to-r from-[#FF6A00]/60 via-white/10 to-[#FFB35A]/60 shadow-[0_0_0_1px_rgba(255,179,90,0.12),0_70px_220px_-170px_rgba(0,0,0,0.98)]">
                <div className="relative overflow-hidden rounded-[32px] bg-black/40 px-6 py-10 backdrop-blur-2xl sm:px-10">
                  <div className="pointer-events-none absolute inset-0 opacity-10">
                    <Image src="/lava-cracks.svg" alt="" fill sizes="100vw" className="object-cover" />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/40" />
                  <div className="pointer-events-none absolute -inset-x-20 -top-28 h-56 opacity-60 blur-3xl bg-[radial-gradient(520px_220px_at_50%_50%,rgba(255,106,0,0.22),transparent_70%)]" />

                  <div className="relative">
                    <h1 className="text-right font-heading text-4xl tracking-[0.12em] text-white sm:text-5xl drop-shadow-[0_14px_40px_rgba(0,0,0,0.92)]">
                      تسجيل الدخول
                    </h1>
                    <p className="mt-3 text-right text-sm text-white/70">
                      ادخل بياناتك وكمل طريقك للنتيجة.
                    </p>

                    <form onSubmit={onSubmit} className="mt-8 space-y-4">
                      <label className="block">
                        <div className="mb-2 text-right font-heading text-xs tracking-[0.22em] text-white/70">
                          رقم الموبايل
                        </div>
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          inputMode="tel"
                          placeholder="01xxxxxxxxx"
                          className={inputCls}
                        />
                      </label>

                      <label className="block">
                        <div className="mb-2 text-right font-heading text-xs tracking-[0.22em] text-white/70">
                          كلمة السر
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className={cn(inputCls, "flex-1")}
                          />
                          <EyeToggle open={showPassword} onClick={() => setShowPassword((v) => !v)} />
                        </div>
                      </label>

                      {error ? (
                        <div className="rounded-2xl bg-[#FF2424]/10 px-4 py-3 text-sm text-[#FFB35A] shadow-[0_0_0_1px_rgba(255,36,36,0.20)]">
                          {error}
                        </div>
                      ) : null}

                      {success ? (
                        <div className="rounded-2xl bg-[#FF6A00]/10 px-4 py-3 text-sm text-white/85 shadow-[0_0_0_1px_rgba(255,106,0,0.22)]">
                          {success}
                        </div>
                      ) : null}

                      <button
                        type="submit"
                        className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#FF2424] via-[#FF6A00] to-[#FFB35A] px-5 py-4 text-sm font-extrabold tracking-[0.12em] text-white shadow-[0_0_0_1px_rgba(255,179,90,0.24),0_28px_100px_-70px_rgba(255,106,0,0.75)] transition hover:brightness-110 active:translate-y-px"
                      >
                        دخول
                      </button>

                      <div className="pt-2 text-center text-sm text-white/70">
                        معندكش حساب؟{" "}
                        <Link
                          href="/register"
                          className="font-heading tracking-[0.14em] text-[#FFB35A] hover:text-white transition"
                        >
                          اعمل حساب جديد
                        </Link>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link href="/" className="text-xs text-white/55 hover:text-white transition">
                  رجوع للرئيسية
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
