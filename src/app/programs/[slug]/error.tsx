"use client";

import Link from "next/link";
import { Navbar } from "@/components/sections/Navbar";
import { FooterClean } from "@/components/sections/FooterClean";
import { Container } from "@/components/ui/Container";

export default function ProgramPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <Navbar />
      <main className="pt-44 sm:pt-48 md:pt-56">
        <section className="relative overflow-hidden bg-[#050506] py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_620px_at_20%_0%,rgba(255,255,255,0.10),transparent_62%),radial-gradient(1000px_620px_at_85%_10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(900px_520px_at_50%_65%,rgba(255,255,255,0.06),transparent_68%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
          <Container>
            <div className="mx-auto max-w-2xl" dir="rtl">
              <h1 className="text-right font-heading text-3xl tracking-[0.10em] text-white sm:text-5xl">
                حصل خطأ مؤقت
              </h1>
              <p className="mt-4 text-right text-sm text-white/70">
                جرّب تفتح الصفحة تاني بعد شوية.
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  onClick={reset}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white/5 px-5 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
                >
                  إعادة المحاولة
                </button>
                <Link
                  href="/packages"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white/5 px-5 text-xs font-semibold tracking-[0.18em] text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] transition hover:bg-white/10 hover:text-white"
                >
                  الباقات
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <FooterClean />
    </div>
  );
}

