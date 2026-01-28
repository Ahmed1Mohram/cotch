"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function WelcomePage() {
  return (
    <Suspense fallback={null}>
      <WelcomePageInner />
    </Suspense>
  );
}

function WelcomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [logoSrc, setLogoSrc] = useState("/s.png");
  const [name, setName] = useState<string>("");

  const nextPath = useMemo(() => {
    const raw = searchParams.get("next") ?? "";
    if (!raw) return "/";
    if (!raw.startsWith("/")) return "/";
    if (raw.startsWith("//")) return "/";
    if (raw === "/welcome" || raw.startsWith("/welcome?")) return "/";
    return raw;
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        const user = data.user;

        const metaName = (user as any)?.user_metadata?.full_name;
        if (typeof metaName === "string" && metaName.trim()) {
          if (!cancelled) setName(metaName.trim());
          return;
        }

        if (user?.id) {
          const profRes = await supabase
            .from("user_profiles")
            .select("full_name")
            .eq("user_id", user.id)
            .maybeSingle();
          const profName = (profRes.data as any)?.full_name;
          if (!cancelled && typeof profName === "string" && profName.trim()) {
            setName(profName.trim());
          }
        }
      } catch {
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      router.replace(nextPath);
      router.refresh();
    }, 3000);

    return () => {
      window.clearTimeout(t);
    };
  }, [router, nextPath]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050506]" dir="rtl">
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(980px_560px_at_18%_22%,rgba(255,180,90,0.18),transparent_62%),radial-gradient(920px_560px_at_86%_40%,rgba(255,36,36,0.14),transparent_64%),radial-gradient(860px_520px_at_55%_72%,rgba(255,255,255,0.05),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/80" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.2, 0.9, 0.1, 1] }}
          className="w-full max-w-2xl"
        >
          <div className="flex items-center justify-center">
            <div className="relative h-20 w-[300px] sm:h-24 sm:w-[380px]">
              <Image
                src={logoSrc}
                alt="FIT COACH"
                fill
                priority
                sizes="380px"
                className="object-contain drop-shadow-[0_22px_80px_rgba(255,179,90,0.38)]"
                onError={() => setLogoSrc("/s.png")}
              />
            </div>
          </div>

          <div className="mt-10 rounded-[34px] p-[2px] bg-gradient-to-r from-[#FFD89A]/55 via-white/10 to-[#FFB35A]/60 shadow-[0_0_0_1px_rgba(255,242,204,0.16),0_80px_240px_-180px_rgba(0,0,0,0.98)]">
            <div className="relative overflow-hidden rounded-[32px] bg-black/45 px-6 py-14 text-center backdrop-blur-2xl sm:px-10">
              <div className="pointer-events-none absolute inset-0 opacity-10">
                <Image src="/lava-cracks.svg" alt="" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/75" />
              <div className="pointer-events-none absolute -inset-x-16 -top-24 h-56 opacity-70 blur-3xl bg-[radial-gradient(520px_220px_at_50%_50%,rgba(255,179,90,0.22),transparent_70%)]" />

              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
                  className="font-heading text-xs tracking-[0.26em] text-white/65"
                >
                  جاهز يا بطل؟
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14, duration: 0.55, ease: [0.2, 0.9, 0.1, 1] }}
                  className="mt-5 font-heading text-4xl tracking-[0.10em] sm:text-6xl"
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#FFF2CC] via-[#FFB35A] to-[#FF2424] drop-shadow-[0_18px_60px_rgba(255,179,90,0.25)]">
                    مرحباً بك{ name ? ` يا ${name}` : "" }
                  </span>
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.55, ease: "easeOut" }}
                  className="mt-4 text-center text-lg text-white/80 sm:text-xl"
                >
                  في عالم الأبطال
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.45 }}
                  className="mt-10"
                >
                  <div className="mx-auto h-1.5 w-52 overflow-hidden rounded-full bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
                    <motion.div
                      className="h-full w-full bg-gradient-to-r from-[#FF2424] via-[#FFB35A] to-[#FFF2CC]"
                      initial={{ x: "-100%" }}
                      animate={{ x: "0%" }}
                      transition={{ duration: 3, ease: "linear" }}
                    />
                  </div>
                  <div className="mt-3 text-xs tracking-[0.24em] text-white/55">تحميل…</div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
