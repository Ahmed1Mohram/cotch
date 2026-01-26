"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const links = [
  { label: "الباقات", href: "#packages" },
  { label: "التواصل", href: "#contact" },
];

export function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastScrollYRef = useRef(0);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [logoSrc, setLogoSrc] = useState("/s.png");
  const [logoChecked, setLogoChecked] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLabel, setUserLabel] = useState("حسابي");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const res = await supabase.auth.getUser();
      const user = res.data.user;
      if (!mounted) return;

      if (!user) {
        setIsAuthed(false);
        setIsAdmin(false);
        setUserLabel("حسابي");
        setAuthReady(true);
        return;
      }

      const meta = (user as any)?.user_metadata ?? {};
      const name = typeof meta.full_name === "string" && meta.full_name.trim() ? meta.full_name.trim() : "";
      const email = typeof user.email === "string" ? user.email : "";
      setUserLabel(name || email || "حسابي");
      setIsAuthed(true);

      try {
        const adminRes = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!mounted) return;
        setIsAdmin(!adminRes.error && Boolean(adminRes.data));
      } catch {
        if (!mounted) return;
        setIsAdmin(false);
      }

      setAuthReady(true);
    };

    void load();
    const sub = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
  }, [supabase]);

  const logout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.replace("/login");
    router.refresh();
  };

  useEffect(() => {
    lastScrollYRef.current = window.scrollY ?? 0;
    const onScroll = () => {
      const y = window.scrollY ?? 0;
      setScrolled(y > 20);

      const last = lastScrollYRef.current;
      const delta = y - last;

      if (y < 80) {
        setHidden(false);
      } else if (Math.abs(delta) >= 6) {
        if (delta > 0) setHidden(true);
        if (delta < 0) setHidden(false);
      }

      lastScrollYRef.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/logo.png", { method: "HEAD" })
      .then((r) => {
        if (r.ok) setLogoSrc("/logo.png");
      })
      .catch(() => {})
      .finally(() => setLogoChecked(true));
  }, []);

  useEffect(() => {
    if (!logoChecked) return;
    if (logoSrc !== "/s.png") return;

    let cancelled = false;
    const makeTransparent = async () => {
      try {
        const res = await fetch("/s.png");
        if (!res.ok) return;
        const blob = await res.blob();
        const bitmap = await createImageBitmap(blob);

        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(bitmap, 0, 0);

        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = img.data;

        const w = canvas.width;
        const h = canvas.height;
        const visited = new Uint8Array(w * h);
        const stack: number[] = [];

        const bgLum = 30;
        const featherLum = 45;

        const lumAt = (idx: number) => {
          const i = idx * 4;
          return (data[i] + data[i + 1] + data[i + 2]) / 3;
        };

        const pushIfBg = (idx: number) => {
          if (visited[idx]) return;
          const lum = lumAt(idx);
          if (lum <= featherLum) {
            visited[idx] = 1;
            stack.push(idx);
          }
        };

        for (let x = 0; x < w; x++) {
          pushIfBg(x);
          pushIfBg((h - 1) * w + x);
        }
        for (let y = 0; y < h; y++) {
          pushIfBg(y * w);
          pushIfBg(y * w + (w - 1));
        }

        while (stack.length) {
          const idx = stack.pop() as number;
          const i = idx * 4;
          const lum = lumAt(idx);

          if (lum <= bgLum) {
            data[i + 3] = 0;
          } else {
            const t = Math.max(0, Math.min(1, (lum - bgLum) / (featherLum - bgLum)));
            const a = Math.round(t * 170);
            data[i + 3] = Math.min(data[i + 3], a);
          }

          const x = idx % w;
          const y = (idx - x) / w;
          if (x > 0) pushIfBg(idx - 1);
          if (x < w - 1) pushIfBg(idx + 1);
          if (y > 0) pushIfBg(idx - w);
          if (y < h - 1) pushIfBg(idx + w);
        }

        ctx.putImageData(img, 0, 0);
        const url = canvas.toDataURL("image/png");
        if (!cancelled) setLogoSrc(url);
      } catch {}
    };

    void makeTransparent();
    return () => {
      cancelled = true;
    };
  }, [logoChecked, logoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (!v.canPlayType("video/mp4")) {
      setVideoEnabled(false);
      return;
    }

    let loaded = false;

    const tryPlay = async () => {
      try {
        v.muted = true;
        v.playsInline = true;
        await v.play();
      } catch {}
    };

    void tryPlay();
    const onCanPlay = () => {
      void tryPlay();
    };
    v.addEventListener("canplay", onCanPlay);

    const onLoadedData = () => {
      loaded = true;
    };
    v.addEventListener("loadeddata", onLoadedData);

    const timeoutId = setTimeout(() => {
      if (!loaded && v.readyState < 2) {
        setVideoEnabled(false);
      }
    }, 2500);

    const onFirstInteraction = () => {
      void tryPlay();
    };
    window.addEventListener("pointerdown", onFirstInteraction, { once: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true });
    return () => {
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("loadeddata", onLoadedData);
      clearTimeout(timeoutId);
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, []);

  const desktopLinkItems = useMemo(
    () =>
      links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className="relative inline-flex items-center whitespace-nowrap font-heading text-[15px] font-extrabold leading-none tracking-[0.10em] text-white transition hover:text-white [text-shadow:0_2px_0_rgba(0,0,0,0.85),0_0_18px_rgba(0,0,0,0.55)] after:absolute after:left-0 after:-bottom-2 after:h-px after:w-0 after:bg-gradient-to-r after:from-[#FF6A00] after:to-[#FFB35A] after:transition-all after:duration-200 hover:after:w-full lg:text-[16px]"
        >
          {l.label}
        </a>
      )),
    [],
  );

  const usingRawFallbackLogo = logoSrc === "/s.png";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-10 z-50 transition-transform duration-300 ease-out will-change-transform sm:top-12 md:top-20",
        hidden ? "-translate-y-[140%]" : "translate-y-0",
      )}
    >
      <Container className="relative">
        <div className="relative mx-auto w-full max-w-7xl">
          <a
            href="#top"
            aria-label="FIT COACH Home"
            className="absolute left-1/2 top-0 z-30 h-14 w-[220px] -translate-x-1/2 -translate-y-[72%] sm:h-16 sm:w-[280px] sm:-translate-y-[66%] md:h-28 md:w-[620px] md:-translate-y-[58%]"
          >
            <Image
              src={logoSrc}
              alt="FIT COACH"
              fill
              priority
              sizes="(min-width: 768px) 620px, (min-width: 640px) 280px, 220px"
              unoptimized={logoSrc.startsWith("data:")}
              className={cn(
                "object-contain drop-shadow-[0_18px_55px_rgba(255,106,0,0.35)]",
                usingRawFallbackLogo ? "mix-blend-screen brightness-125 contrast-125" : "",
              )}
              onError={() => setLogoSrc("/s.png")}
            />
          </a>

          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-[#FF6A00]/16 bg-gradient-to-b from-black/55 via-black/20 to-black/55 bg-black/15",
              scrolled
                ? "shadow-[0_0_0_1px_rgba(255,106,0,0.14),0_28px_84px_-60px_rgba(0,0,0,0.98)]"
                : "shadow-[0_0_0_1px_rgba(255,106,0,0.10),0_20px_64px_-54px_rgba(0,0,0,0.86)]",
            )}
          >
            {videoEnabled && !scrolled ? (
              <video
                className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-70 brightness-110 contrast-110 saturate-125"
                ref={videoRef}
                src="/1.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden="true"
                onError={() => {
                  setVideoEnabled(false);
                }}
              >
                <source src="/1.mp4" type="video/mp4" />
              </video>
            ) : null}
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/35 via-black/10 to-black/40" />
            <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(1100px_120px_at_50%_50%,rgba(255,106,0,0.18),transparent_72%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[#FF6A00] to-transparent opacity-90" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-[#FF8A00] to-transparent opacity-80" />
            <div className="pointer-events-none absolute -inset-x-10 -top-10 z-10 h-24 bg-[radial-gradient(600px_80px_at_50%_50%,rgba(255,106,0,0.40),transparent_70%)] blur-2xl" />
            <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(900px_240px_at_50%_0%,rgba(255,106,0,0.22),transparent_60%),radial-gradient(900px_260px_at_10%_120%,rgba(255,138,0,0.14),transparent_60%)]" />

            <div className="pointer-events-none absolute inset-0 z-10 opacity-10 mix-blend-soft-light blur-md [mask-image:url('/lava-cracks.svg')] [-webkit-mask-image:url('/lava-cracks.svg')] [mask-repeat:repeat-x] [-webkit-mask-repeat:repeat-x] [mask-size:1700px_240px] [-webkit-mask-size:1700px_240px] [mask-position:center_top] [-webkit-mask-position:center_top] bg-gradient-to-r from-[#FF6A00] via-[#FF8A00] to-[#FFB35A]" />
            <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.06] mix-blend-soft-light [mask-image:url('/lava-cracks.svg')] [-webkit-mask-image:url('/lava-cracks.svg')] [mask-repeat:repeat-x] [-webkit-mask-repeat:repeat-x] [mask-size:1700px_240px] [-webkit-mask-size:1700px_240px] [mask-position:center_top] [-webkit-mask-position:center_top] bg-gradient-to-r from-[#FFB35A] via-[#FF8A00] to-[#FF6A00]" />

            <div className="relative z-40 flex h-14 items-center justify-between px-4 md:grid md:h-16 md:grid-cols-[auto_420px_1fr] lg:grid-cols-[auto_480px_1fr] md:items-center md:px-7">
              <nav
                className="md:hidden absolute inset-y-0 left-1/2 w-max -translate-x-1/2 flex items-center justify-center gap-5"
                aria-label="Primary"
                dir="rtl"
              >
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="relative inline-flex items-center whitespace-nowrap font-heading text-[15px] font-extrabold leading-none tracking-[0.04em] text-white transition hover:text-white [text-shadow:0_2px_0_rgba(0,0,0,0.85),0_0_18px_rgba(0,0,0,0.60)] after:absolute after:left-0 after:-bottom-2 after:h-px after:w-0 after:bg-gradient-to-r after:from-[#FF6A00] after:to-[#FFB35A] after:transition-all after:duration-200 hover:after:w-full"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
              <nav className="hidden md:flex items-center justify-start gap-6 pr-8 lg:gap-7 lg:pr-10" aria-label="Primary">
                {desktopLinkItems}
              </nav>
              <div className="hidden md:block" />
              <div className="flex items-center justify-end gap-3">
                <div className="relative z-30 flex md:hidden items-center" dir="rtl">
                  <div className="rounded-full p-[2px] bg-gradient-to-r from-[#FF6A00]/70 via-white/10 to-[#FFB35A]/70 shadow-[0_0_0_1px_rgba(255,106,0,0.18),0_22px_70px_-52px_rgba(0,0,0,0.95)]">
                    <div className="flex items-center gap-1 rounded-full bg-black/60 p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                      {authReady && isAuthed ? (
                        <>
                          {isAdmin ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-11 rounded-full px-5 text-[12px] font-extrabold normal-case tracking-[0.10em] text-white/85 bg-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.10)] hover:bg-white/5 hover:text-white"
                              onClick={() => {
                                try {
                                  window.location.assign("/admin");
                                } catch {
                                  router.push("/admin");
                                }
                              }}
                            >
                              الإدارة
                            </Button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              void logout();
                            }}
                            disabled={signingOut}
                            className="h-11 max-w-[180px] rounded-full px-5 text-[12px] font-extrabold normal-case tracking-[0.10em] text-white/85 bg-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.10)] hover:bg-white/5 hover:text-white disabled:opacity-60"
                            title="تسجيل خروج"
                          >
                            <span className="block min-w-0 truncate">{userLabel}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Button
                            href="/login"
                            size="sm"
                            variant="ghost"
                            className="h-11 rounded-full px-5 text-[12px] font-extrabold normal-case tracking-[0.10em] text-white/85 bg-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.10)] hover:bg-white/5 hover:text-white"
                          >
                            دخول
                          </Button>
                          <Button
                            href="/register"
                            size="sm"
                            variant="primary"
                            className="h-11 rounded-full px-5 text-[12px] font-extrabold normal-case tracking-[0.10em] shadow-[0_0_0_1px_rgba(255,179,90,0.26),0_18px_70px_-48px_rgba(255,106,0,0.72)]"
                          >
                            تسجيل
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  {authReady && isAuthed ? (
                    <>
                      {isAdmin ? (
                        <div className="group rounded-full p-[1px] bg-gradient-to-r from-[#FF6A00]/60 via-white/14 to-[#FFB35A]/60 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_14px_44px_-26px_rgba(0,0,0,0.90)] hover:shadow-[0_0_0_1px_rgba(255,206,120,0.18),0_18px_56px_-30px_rgba(0,0,0,0.92)]">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-10 rounded-full px-5 text-[12px] font-extrabold normal-case tracking-[0.10em] text-white bg-black/28 shadow-none hover:bg-black/40 hover:shadow-[inset_0_0_0_1px_rgba(255,106,0,0.22)]"
                            onClick={() => {
                              try {
                                window.location.assign("/admin");
                              } catch {
                                router.push("/admin");
                              }
                            }}
                          >
                            الإدارة
                          </Button>
                        </div>
                      ) : null}
                      <div className="group rounded-full p-[1px] bg-gradient-to-r from-[#FF6A00]/60 via-white/14 to-[#FFB35A]/60 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_14px_44px_-26px_rgba(0,0,0,0.90)] hover:shadow-[0_0_0_1px_rgba(255,206,120,0.18),0_18px_56px_-30px_rgba(0,0,0,0.92)]">
                        <button
                          type="button"
                          onClick={() => {
                            void logout();
                          }}
                          disabled={signingOut}
                          className="h-10 max-w-[220px] rounded-full px-5 text-[12px] font-extrabold normal-case tracking-[0.10em] text-white bg-black/28 shadow-none hover:bg-black/40 hover:shadow-[inset_0_0_0_1px_rgba(255,106,0,0.22)] disabled:opacity-60"
                          title="تسجيل خروج"
                        >
                          <span className="block min-w-0 truncate">{userLabel}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="group rounded-full p-[1px] bg-gradient-to-r from-[#FF6A00]/60 via-white/14 to-[#FFB35A]/60 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_14px_44px_-26px_rgba(0,0,0,0.90)] hover:shadow-[0_0_0_1px_rgba(255,206,120,0.18),0_18px_56px_-30px_rgba(0,0,0,0.92)]">
                        <Button
                          href="/login"
                          size="sm"
                          variant="ghost"
                          className="h-10 rounded-full px-5 text-[12px] font-extrabold normal-case tracking-[0.10em] text-white bg-black/28 shadow-none hover:bg-black/40 hover:shadow-[inset_0_0_0_1px_rgba(255,106,0,0.22)]"
                        >
                          دخول
                        </Button>
                      </div>
                      <div className="relative group overflow-hidden rounded-full">
                        <Button
                          href="/register"
                          size="sm"
                          variant="primary"
                          className="relative z-10 h-10 overflow-hidden rounded-full px-6 text-[12px] font-extrabold normal-case tracking-[0.10em]"
                        >
                          تسجيل
                        </Button>
                        <span className="pointer-events-none absolute -inset-y-10 -left-16 w-16 rotate-12 bg-white/20 blur-md opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-[360px]" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}
