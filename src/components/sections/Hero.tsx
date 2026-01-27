"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Hero() {
  const reduce = useReducedMotion();
  const candidates = useMemo(() => ["/kalfya.png", "/kalya.png"], []);
  const [src, setSrc] = useState<string | null>(candidates[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const animate = mounted && !reduce;

  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        {src ? (
          <Image
            src={src}
            alt="Intense gym training background"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[78%_26%] opacity-100 sm:object-[center_28%] md:object-[center_12%]"
            onError={() => {
              if (src === candidates[0]) {
                setSrc(candidates[1]);
              } else {
                setSrc(null);
              }
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-black/40 sm:bg-black/60 md:bg-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-transparent sm:from-black/78 sm:via-black/58 sm:to-black/25" />
        <div className="absolute inset-0 bg-[radial-gradient(1100px_700px_at_18%_18%,rgba(255,106,0,0.18),transparent_60%),radial-gradient(1000px_640px_at_84%_24%,rgba(255,138,0,0.12),transparent_58%),radial-gradient(900px_560px_at_55%_62%,rgba(255,255,255,0.05),transparent_70%)]" />
        <div className="absolute inset-0 opacity-60 blur-[2px] bg-[radial-gradient(420px_220px_at_30%_60%,rgba(255,179,90,0.12),transparent_70%),radial-gradient(520px_260px_at_70%_56%,rgba(255,106,0,0.10),transparent_72%)]" />
      </div>

      <Container className="relative z-10 flex min-h-[100svh] items-center pt-28 sm:pt-24 md:pt-20">
        <div className="max-w-3xl">
          {animate ? (
            <motion.h1
              className="font-heading text-5xl tracking-[0.14em] text-white sm:text-6xl md:text-7xl drop-shadow-[0_12px_34px_rgba(0,0,0,0.9)]"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              UNLEASH YOUR POWER
              <span className="mt-3 block text-xl tracking-[0.22em] text-white/85 sm:text-2xl md:text-3xl">
                Physical trainer
              </span>
            </motion.h1>
          ) : (
            <h1 className="font-heading text-5xl tracking-[0.14em] text-white sm:text-6xl md:text-7xl drop-shadow-[0_12px_34px_rgba(0,0,0,0.9)]">
              UNLEASH YOUR POWER
              <span className="mt-3 block text-xl tracking-[0.22em] text-white/85 sm:text-2xl md:text-3xl">
                Physical trainer
              </span>
            </h1>
          )}

          {animate ? (
            <motion.p
              className="mt-6 max-w-2xl font-heading text-3xl leading-[1.25] tracking-[0.10em] drop-shadow-[0_14px_40px_rgba(0,0,0,0.92)] sm:text-4xl md:text-5xl"
              dir="rtl"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            >
              <span className="bg-gradient-to-r from-[#FFE7B8] via-[#FFB35A] to-[#FF6A00] bg-clip-text text-transparent [text-shadow:0_0_34px_rgba(255,179,90,0.45),0_0_16px_rgba(255,106,0,0.20)]">
                اتمرن بعقلك مش بجسمك
              </span>
              <span className="ms-2 inline-block text-white drop-shadow-[0_10px_26px_rgba(0,0,0,0.9)]">🧠🏃</span>
            </motion.p>
          ) : (
            <p
              className="mt-6 max-w-2xl font-heading text-3xl leading-[1.25] tracking-[0.10em] drop-shadow-[0_14px_40px_rgba(0,0,0,0.92)] sm:text-4xl md:text-5xl"
              dir="rtl"
            >
              <span className="bg-gradient-to-r from-[#FFE7B8] via-[#FFB35A] to-[#FF6A00] bg-clip-text text-transparent [text-shadow:0_0_34px_rgba(255,179,90,0.45),0_0_16px_rgba(255,106,0,0.20)]">
                اتمرن بعقلك مش بجسمك
              </span>
              <span className="ms-2 inline-block text-white drop-shadow-[0_10px_26px_rgba(0,0,0,0.9)]">🧠🏃</span>
            </p>
          )}

          {animate ? (
            <motion.div
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
            >
              <Button
                href="#contact"
                size="lg"
                variant="primary"
                className="rounded-full normal-case tracking-[0.12em] backdrop-blur-md text-white"
              >
                START YOUR TRANSFORMATION
              </Button>
              <a
                href="#packages"
                className="font-heading text-xs tracking-[0.22em] text-white/85 hover:text-[#FFB35A] transition drop-shadow-[0_10px_26px_rgba(0,0,0,0.9)]"
              >
                VIEW PROGRAMS
              </a>
            </motion.div>
          ) : (
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                href="#contact"
                size="lg"
                variant="primary"
                className="rounded-full normal-case tracking-[0.12em] backdrop-blur-md text-white"
              >
                START YOUR TRANSFORMATION
              </Button>
              <a
                href="#packages"
                className="font-heading text-xs tracking-[0.22em] text-white/85 hover:text-[#FFB35A] transition drop-shadow-[0_10px_26px_rgba(0,0,0,0.9)]"
              >
                VIEW PROGRAMS
              </a>
            </div>
          )}

          {animate ? (
            <motion.div
              className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
            >
              <div className="rounded-2xl bg-[#0E0F12]/55 px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_70px_-60px_rgba(0,0,0,0.92)] backdrop-blur-md">
                <div className="font-heading text-2xl tracking-[0.12em] text-white">
                  1:1
                </div>
                <div className="mt-1 text-sm text-white/55">Coaching</div>
              </div>
              <div className="rounded-2xl bg-[#0E0F12]/55 px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_70px_-60px_rgba(0,0,0,0.92)] backdrop-blur-md">
                <div className="font-heading text-2xl tracking-[0.12em] text-white">
                  12W
                </div>
                <div className="mt-1 text-sm text-white/55">Programs</div>
              </div>
              <div className="rounded-2xl bg-[#0E0F12]/55 px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_70px_-60px_rgba(0,0,0,0.92)] backdrop-blur-md">
                <div className="font-heading text-2xl tracking-[0.12em] text-white">
                  24/7
                </div>
                <div className="mt-1 text-sm text-white/55">Support</div>
              </div>
            </motion.div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#0E0F12]/55 px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_70px_-60px_rgba(0,0,0,0.92)] backdrop-blur-md">
                <div className="font-heading text-2xl tracking-[0.12em] text-white">
                  1:1
                </div>
                <div className="mt-1 text-sm text-white/55">Coaching</div>
              </div>
              <div className="rounded-2xl bg-[#0E0F12]/55 px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_70px_-60px_rgba(0,0,0,0.92)] backdrop-blur-md">
                <div className="font-heading text-2xl tracking-[0.12em] text-white">
                  12W
                </div>
                <div className="mt-1 text-sm text-white/55">Programs</div>
              </div>
              <div className="rounded-2xl bg-[#0E0F12]/55 px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_70px_-60px_rgba(0,0,0,0.92)] backdrop-blur-md">
                <div className="font-heading text-2xl tracking-[0.12em] text-white">
                  24/7
                </div>
                <div className="mt-1 text-sm text-white/55">Support</div>
              </div>
            </div>
          )}
        </div>
      </Container>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#050506] to-transparent" />
    </section>
  );
}
