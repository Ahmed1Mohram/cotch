import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

const uiFallback: Record<string, { emoji: string; imageClassName: string }> = {
  football: { emoji: "⚽", imageClassName: "object-[78%_58%]" },
  volleyball: { emoji: "🏐", imageClassName: "object-[70%_52%]" },
  basketball: { emoji: "🏀", imageClassName: "object-[82%_52%]" },
  handball: { emoji: "🤾‍♂️", imageClassName: "object-[72%_52%]" },
  injuries: { emoji: "🩹", imageClassName: "object-[78%_60%]" },
};

export async function Programs() {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("courses")
    .select("slug,title_ar,title_en,description,cover_image_url")
    .order("created_at", { ascending: true });

  const courses =
    rows?.map((r) => {
      const slug = String(r.slug);
      const fallback = uiFallback[slug] ?? { emoji: "🔥", imageClassName: "object-center" };
      const cover = typeof (r as any).cover_image_url === "string" ? String((r as any).cover_image_url).trim() : "";
      return {
        slug,
        emoji: fallback.emoji,
        titleEn: String(r.title_en ?? slug).replace(/\s+/g, " ").trim(),
        titleAr: String(r.title_ar ?? ""),
        desc: String(r.description ?? ""),
        image: cover ? cover : "/kalya.png",
        imageClassName: fallback.imageClassName,
      };
    }) ?? [];

  const isEmpty = courses.length === 0;

  return (
    <section id="programs" className="relative overflow-hidden bg-[#050506] py-20 sm:py-28 cv-auto">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/111.png)" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-black/75" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_620px_at_18%_0%,rgba(255,106,0,0.18),transparent_62%),radial-gradient(1000px_620px_at_86%_10%,rgba(255,36,36,0.12),transparent_60%),radial-gradient(900px_520px_at_55%_70%,rgba(255,255,255,0.05),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <Container>
        <Reveal>
          <div className="max-w-3xl" dir="rtl">
            <div className="flex items-center justify-end gap-3">
              <p className="font-heading text-xs tracking-[0.22em] text-[#B5B5B5]">
                الكورسات
              </p>
              <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            </div>
            <h2 className="mt-4 text-right font-heading text-4xl tracking-[0.10em] text-white sm:text-6xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
              كورسات رياضية قوية تبني جسمك وتطوّر أدائك
            </h2>
            <p className="mt-4 text-right text-base leading-7 text-white/70 sm:text-lg">
              اختار الكورس المناسب ليك، وابدأ تدريب عملي بخطة واضحة ونتيجة تشوفها.
            </p>
          </div>
        </Reveal>

        <div className="mt-14">
          {isEmpty ? (
            <div className="rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]" dir="rtl">
              <h3 className="text-right font-heading text-2xl tracking-[0.10em] text-white">
                الكورسات مش ظاهرة حالياً
              </h3>
              <p className="mt-3 text-right text-sm leading-7 text-white/75">
                غالباً جدول <span dir="ltr" className="font-mono text-white/90">courses</span> فاضي أو الكورسات مش منشورة.
                تأكد إن <span dir="ltr" className="font-mono text-white/90">is_published = true</span>.
              </p>
              {process.env.NODE_ENV !== "production" && error?.message ? (
                <p className="mt-4 text-right text-xs leading-6 text-white/60" dir="ltr">
                  {error.message}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c, idx) => (
            <Reveal key={c.slug} delay={0.06 * idx}>
              <Link
                href={`/programs/${c.slug}`}
                aria-label={c.titleEn}
                className="group relative isolate block aspect-[3/4] overflow-hidden rounded-3xl bg-gradient-to-r from-[#2b0000] via-[#120000] to-[#2b0000] p-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_80px_240px_-170px_rgba(0,0,0,0.96)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="pointer-events-none absolute inset-0 rounded-3xl">
                  <div className="absolute -inset-7 hidden rounded-[34px] opacity-90 blur-xl bg-[radial-gradient(420px_180px_at_10%_18%,rgba(255,36,36,0.70),transparent_70%),radial-gradient(420px_180px_at_90%_18%,rgba(185,0,0,0.62),transparent_70%),radial-gradient(520px_240px_at_50%_92%,rgba(110,0,0,0.55),transparent_72%)] sm:block" />
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#7a0000]/65 via-[#ff2424]/55 to-[#3a0000]/55 opacity-95" />
                  <div className="absolute inset-0 rounded-3xl opacity-70 bg-[radial-gradient(circle,rgba(255,36,36,0.85)_1px,transparent_1.6px)] [background-size:30px_30px] [mask-image:radial-gradient(80%_70%_at_50%_50%,transparent_48%,black_74%)]" />
                </div>

                <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-black/55 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                  {/^https?:\/\//i.test(c.image) ? (
                    <img
                      src={c.image}
                      alt={c.titleEn}
                      loading="lazy"
                      className={
                        "absolute inset-0 h-full w-full object-cover contrast-[1.04] saturate-[1.03] brightness-[1.00] transition duration-700 group-hover:scale-[1.08] group-hover:contrast-[1.10] group-hover:saturate-[1.08] " +
                        c.imageClassName
                      }
                    />
                  ) : (
                    <Image
                      src={c.image}
                      alt={c.titleEn}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className={
                        "object-cover contrast-[1.04] saturate-[1.03] brightness-[1.00] transition duration-700 group-hover:scale-[1.08] group-hover:contrast-[1.10] group-hover:saturate-[1.08] " +
                        c.imageClassName
                      }
                    />
                  )}

                  <div className="pointer-events-none absolute inset-0 opacity-12">
                    <Image
                      src="/lava-cracks.svg"
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover opacity-70"
                    />
                  </div>

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/78 via-black/22 to-black/0" />
                  <div className="pointer-events-none absolute inset-0 hidden opacity-45 blur-2xl bg-[radial-gradient(740px_440px_at_20%_32%,rgba(255,255,255,0.06),transparent_64%)] sm:block" />

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_42%,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_38%,rgba(0,0,0,0.62)_76%,rgba(0,0,0,0.90)_100%)]" />

                  <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/10 transition group-hover:ring-[#FFB35A]/20" />
                  <div className="pointer-events-none absolute -inset-10 hidden opacity-0 transition duration-500 group-hover:opacity-100 bg-[radial-gradient(520px_260px_at_50%_86%,rgba(255,106,0,0.16),transparent_72%)] blur-3xl sm:block" />

                  <div
                    className="absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold tracking-[0.10em] text-[#FFE2B8] shadow-[0_0_0_1px_rgba(255,179,90,0.24),0_20px_70px_-50px_rgba(255,106,0,0.85)] backdrop-blur-md"
                    dir="rtl"
                  >
                    شدة • نار
                  </div>

                  <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-7" dir="rtl">
                    <div className="rounded-2xl bg-black/45 p-4 shadow-[0_0_0_1px_rgba(255,179,90,0.16),0_40px_140px_-120px_rgba(0,0,0,0.95)] backdrop-blur-md">
                      <h3 className="text-right font-heading text-lg leading-snug tracking-[0.06em] text-[#FFE2B8] drop-shadow-[0_18px_40px_rgba(0,0,0,0.96)] sm:text-xl">
                        <span
                          className="flex min-w-0 max-w-full flex-wrap items-baseline justify-end gap-x-2 gap-y-1 whitespace-normal break-words"
                        >
                          <span className="shrink-0 text-sm leading-none" aria-hidden="true">
                            {c.emoji}
                          </span>
                          <span dir="ltr" className="min-w-0 uppercase">
                            {c.titleEn}
                          </span>
                          <span className="basis-full text-[11px] font-semibold tracking-[0.08em] text-[#FFB35A] sm:basis-auto">
                            ({c.titleAr})
                          </span>
                        </span>
                      </h3>
                      <p className="mt-2 line-clamp-2 text-right text-[13px] leading-6 text-white/88 drop-shadow-[0_16px_40px_rgba(0,0,0,0.96)]">
                        {c.desc}
                      </p>
                      <div className="mt-4 flex justify-end">
                        <div className="group/cta relative inline-flex h-11 items-center justify-center rounded-2xl bg-black/55 px-5 text-[12px] font-semibold tracking-[0.12em] text-[#FFE2B8] shadow-[0_0_0_1px_rgba(255,36,36,0.24),0_26px_90px_-70px_rgba(255,36,36,0.55)] transition hover:bg-black/45">
                          افتح تفاصيل الكورس
                          <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-[#FF2424]/55" />
                          <span className="pointer-events-none absolute -inset-x-10 -inset-y-10 opacity-0 blur-2xl transition group-hover/cta:opacity-100 bg-[radial-gradient(320px_160px_at_55%_55%,rgba(255,36,36,0.22),transparent_70%)]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
              ))}
            </div>
          )}
        </div>

        <Reveal delay={0.08}>
          <div className="mt-14 relative overflow-hidden rounded-3xl p-[2px]">
            <div className="pointer-events-none absolute -inset-[45%] hidden opacity-70 blur-3xl bg-[conic-gradient(from_180deg_at_50%_50%,#FFB35A,#FF6A00,#FF2424,#FFB35A)] sm:block animate-[spin_10s_linear_infinite]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#FF6A00]/25 via-white/10 to-[#FF2424]/25" />
            <div className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(900px_520px_at_14%_30%,rgba(255,106,0,0.24),transparent_60%),radial-gradient(860px_520px_at_86%_36%,rgba(255,36,36,0.20),transparent_62%),radial-gradient(840px_520px_at_56%_82%,rgba(255,179,90,0.14),transparent_70%)]" />

            <div className="relative overflow-hidden rounded-3xl bg-[#060607]/86 px-7 py-12 shadow-[0_0_0_1px_rgba(255,179,90,0.18),0_50px_160px_-110px_rgba(0,0,0,0.92)] sm:px-12">
              <div className="pointer-events-none absolute inset-0 opacity-10">
                <Image src="/lava-cracks.svg" alt="" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_520px_at_14%_24%,rgba(255,255,255,0.10),transparent_62%),radial-gradient(920px_520px_at_86%_34%,rgba(255,255,255,0.08),transparent_64%),radial-gradient(900px_520px_at_55%_70%,rgba(255,255,255,0.06),transparent_72%)]" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/40" />
              <div className="pointer-events-none absolute inset-0 hidden opacity-70 sm:block animate-pulse bg-[radial-gradient(520px_220px_at_50%_92%,rgba(255,106,0,0.18),transparent_72%)]" />
              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-[#FFB35A]/25" />

              <div className="relative" dir="rtl">
                <h3 className="text-right font-heading text-4xl tracking-[0.10em] text-transparent bg-clip-text bg-gradient-to-l from-[#FFB35A] via-[#FF6A00] to-[#FF2424] sm:text-5xl drop-shadow-[0_18px_55px_rgba(0,0,0,0.96)]">
                  أنا مدرب بدني… شغل علمي ونتيجة واضحة
                </h3>
                <p className="mt-5 text-right max-w-3xl text-base leading-7 text-white/85 sm:text-lg drop-shadow-[0_16px_45px_rgba(0,0,0,0.96)]">
                  تدريبي مش كلام حماس وخلاص. هتدخل بخطة، هتمشي على نظام، وهتطلع بنسخة أقوى منك. قوة، لياقة، مرونة، وتحكم في جسمك… وكل ده بتدرّج محسوب وقياسات حقيقية.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <div className="relative group">
                    <Button
                      href="#contact"
                      size="lg"
                      variant="primary"
                      className="relative overflow-hidden rounded-full normal-case tracking-[0.12em] text-white shadow-[0_0_0_1px_rgba(255,179,90,0.28),0_34px_130px_-78px_rgba(255,36,36,0.58)] hover:shadow-[0_0_0_1px_rgba(255,179,90,0.34),0_46px_170px_-92px_rgba(255,106,0,0.72)]"
                    >
                      تواصل وابدأ الآن
                    </Button>
                    <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/15" />
                    <span className="pointer-events-none absolute -inset-y-10 -left-16 w-16 rotate-12 bg-white/20 blur-md opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:translate-x-[420px]" />
                    <span className="pointer-events-none absolute -inset-10 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100 bg-[radial-gradient(340px_180px_at_55%_55%,rgba(255,36,36,0.22),transparent_70%)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
