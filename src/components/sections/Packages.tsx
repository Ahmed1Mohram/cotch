import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

type PackageRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  features: unknown;
  theme: string;
  sort_order: number;
};

function getPackageOverride(meta: { slug?: string | null; title?: string | null; theme?: string | null }) {
  const slug = String(meta.slug ?? "").trim().toLowerCase();
  const title = String(meta.title ?? "").trim().toLowerCase();
  const theme = String(meta.theme ?? "").trim().toLowerCase();
  const hay = `${slug} ${title} ${theme}`.trim();

  const isVip = theme === "vip" || hay.includes("vip") || hay.includes("gold");
  const isMedium = theme === "blue" || hay.includes("medium") || hay.includes("pro");
  const isSmall = theme === "orange" || hay.includes("small") || hay.includes("star");

  if (isSmall && !isMedium && !isVip) {
    return {
      title: "STAR",
      subtitle: "🥉 باقة المبتدئين – STAR",
      features: [
        "1️⃣ 12 تمرينه في الشهر 🏃🏽",
        "2️⃣ قياسات كل شهر علي تطورك 📑",
        "3️⃣ متابعه اسبوعيه بالفيديوهات علي تكنيك تمرينك 👌🏽",
      ],
    };
  }
  if (isMedium && !isVip) {
    return {
      title: "PRO",
      subtitle: "🥈 باقة المحترفين – PRO",
      features: [
        "1️⃣ جدول تدريبي مخصص ومتغير علي حسب التطورات 📑",
        "2️⃣ نظام غذائي 🍛",
        "3️⃣ متابعه واتساب علي تكنيك التدريبات لتصحيح الخطأ 👏🏽",
        "4️⃣ قياسات كل أسبوعين 📑",
        "5️⃣ متابعه مرتين علي الواتساب تقدر تسألني علي اي حاجه؟ + تقدر تبعتلي التمارين اللي بتتمرنها 🏃🏽 + تقدر تسألني علي أي سؤال في التغذيه 🍛",
      ],
    };
  }
  if (isVip) {
    return {
      title: "VIP",
      subtitle: "🥇 الباقة الذهبية 👑 (Gold)",
      features: [
        "1️⃣ جدول تدريبي مخصص ومتغير علي حسب التطورات 📑",
        "2️⃣ نظام غذائي 🍛",
        "3️⃣ متابعه واتساب علي تكنيك التدريبات لتصحيح الخطأ 👏🏽",
        "4️⃣ قياسات كل أسبوع 📑",
        "5️⃣ متابعه يوميا علي الواتساب تقدر تسألني علي اي حاجه؟ + تقدر تبعتلي التمارين الي بتتمرنها 🏃🏽 + تقدر تسألني علي أي سؤال في التغذيه 🍛",
        "6️⃣ ليك انك تكلم كابتن مصطفي فيديو في أيام القياسات علشان القياسات تكون بالظبط عليك 📑👌🏽",
        "7️⃣ اول مبتوصل للمستوي اللي كابتن مصطفي محددهولك ليك تمرينه مجانا مع كابتن مصطفي بنفسه 💯👏🏽",
        "8️⃣ بتكلم كابتن مصطفي فون براحتك لحل اي مشكله خارج الاعداد البدني زي/ضغط الماتشات/قله الثقه في الماتشات/ الدعم النفسي /ومشاكل تانيه كتير تقدر تحلها مع كابتن مصطفي بإذن الله ♥️💯",
      ],
    };
  }
  return null;
}

function themeStyles(theme: string) {
  if (theme === "vip") {
    return {
      outer:
        "from-[#FFF2CC]/62 via-[#FFB35A]/18 to-[#FF2424]/16 shadow-[0_0_0_1px_rgba(255,242,204,0.32),0_0_65px_rgba(255,179,90,0.14),0_120px_360px_-240px_rgba(0,0,0,0.98)]",
      inner: "ring-[#FFF2CC]/40",
      title: "from-[#FFF2CC] via-[#FFD89A] to-[#FFB35A]",
      badge: "bg-[#FFF2CC]/12 text-[#FFF2CC] ring-[#FFF2CC]/32",
      cta:
        "text-black bg-gradient-to-r from-[#FFF2CC] via-[#FFB35A] to-[#FF6A00] hover:brightness-110 shadow-[0_18px_80px_-45px_rgba(255,179,90,0.95)]",
    };
  }

  if (theme === "blue") {
    return {
      outer:
        "from-[#60A5FA]/22 via-white/10 to-[#A78BFA]/20 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_70px_220px_-170px_rgba(0,0,0,0.98)]",
      inner: "ring-[#60A5FA]/25",
      title: "from-[#60A5FA] via-[#A78BFA] to-white",
      badge: "bg-white/5 text-white ring-white/15",
      cta: "text-white bg-white/10 hover:bg-white/15",
    };
  }

  return {
    outer:
      "from-[#FFB35A]/18 via-white/10 to-[#FF2424]/18 shadow-[0_0_0_1px_rgba(255,179,90,0.18),0_70px_220px_-170px_rgba(0,0,0,0.98)]",
    inner: "ring-[#FFB35A]/25",
    title: "from-[#FFB35A] via-[#FF6A00] to-[#FF2424]",
    badge: "bg-white/5 text-white ring-white/15",
    cta: "text-white bg-white/10 hover:bg-white/15",
  };
}

function normalizeFeatures(features: unknown): string[] {
  if (!features) return [];
  if (Array.isArray(features)) return features.map((x) => String(x)).map((s) => s.trim()).filter(Boolean);
  if (typeof features === "string") {
    const s = features.trim();
    return s ? [s] : [];
  }
  if (typeof features === "object") {
    const obj = features as any;
    if (Array.isArray(obj?.items)) {
      return obj.items.map((x: any) => String(x)).map((s: string) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export async function Packages() {
  noStore();

  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("packages")
    .select(
      "id,slug,title,subtitle,description,features,theme,sort_order",
    )
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const items: PackageRow[] = ((rows as any[]) ?? []).map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title ?? ""),
    subtitle: r.subtitle ?? null,
    description: r.description ?? null,
    features: (r as any).features,
    theme: String(r.theme ?? "orange"),
    sort_order: Number(r.sort_order ?? 0),
  }));

  const isEmpty = items.length === 0;

  return (
    <section id="packages" className="relative overflow-hidden bg-[#050506] py-20 sm:py-28 cv-auto">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/111.png)" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-black/75" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_620px_at_18%_0%,rgba(255,106,0,0.16),transparent_62%),radial-gradient(1000px_620px_at_86%_10%,rgba(96,165,250,0.12),transparent_60%),radial-gradient(900px_520px_at_55%_70%,rgba(255,255,255,0.05),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <Container>
        <Reveal>
          <div className="max-w-3xl" dir="rtl">
            <div className="flex items-center justify-end gap-3">
              <p className="font-heading text-xs tracking-[0.22em] text-[#B5B5B5]">الباقات</p>
              <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            </div>
            <h2 className="mt-4 text-right font-heading text-4xl tracking-[0.10em] text-white sm:text-6xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
              اختار الباقة المناسبة… وكل باقة فيها كورسات
            </h2>
            <p className="mt-4 text-right text-base leading-7 text-white/70 sm:text-lg">
              اضغط على الباقة علشان تشوف الكورسات اللي جواها.
            </p>
          </div>
        </Reveal>

        <div className="mt-14">
          {isEmpty ? (
            <div className="rounded-3xl bg-black/45 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_60px_190px_-140px_rgba(0,0,0,0.95)]" dir="rtl">
              <h3 className="text-right font-heading text-2xl tracking-[0.10em] text-white">لا توجد باقات حالياً</h3>
              <p className="mt-3 text-right text-sm leading-7 text-white/75">
                ادخل الأدمن وأنشئ باقات ثم اربطها بالكورسات.
              </p>
              {process.env.NODE_ENV !== "production" && error?.message ? (
                <p className="mt-4 text-right text-xs leading-6 text-white/60" dir="ltr">
                  {error.message}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory", overscrollBehaviorX: "contain", touchAction: "pan-x" }}>
              <div className="flex items-start gap-7 snap-x snap-mandatory scroll-px-5 sm:grid sm:items-start sm:gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p, idx) => {
                const st = themeStyles(p.theme);
                const isVip = p.theme === "vip" || p.slug === "vip";
                const isMedium = p.slug === "medium";
                const isSmall = p.slug === "small";
                const override = getPackageOverride({ slug: p.slug, title: p.title, theme: p.theme });
                const isVipPlan = override?.title === "VIP" || isVip;
                const isMediumPlan = override?.title === "PRO" || isMedium;
                const isSmallPlan = override?.title === "STAR" || isSmall;
                const displayTitle = override?.title ?? p.title;
                const displaySubtitle = override?.subtitle ?? p.subtitle;
                const feats = (override?.features ?? normalizeFeatures(p.features)).slice(0, isVipPlan ? 8 : 5);

                return (
                  <Reveal key={p.id} delay={0.06 * idx}>
                    <Link
                      href={`/packages/${encodeURIComponent(p.slug)}`}
                      className={
                        "group relative isolate block w-[86vw] max-w-[360px] flex-none snap-start overflow-hidden rounded-3xl bg-gradient-to-r p-[2px] transition-transform duration-300 hover:-translate-y-1 sm:w-auto sm:max-w-none " +
                        st.outer +
                        (isVipPlan ? " hover:-translate-y-2 hover:scale-[1.02]" : "")
                      }
                      dir="rtl"
                    >
                      <div className="relative overflow-hidden rounded-[22px] bg-black/60 px-6 py-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-2xl">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(740px_380px_at_20%_24%,rgba(255,255,255,0.08),transparent_64%)]" />
                        <div className={"pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset " + st.inner} />
                        {isSmallPlan ? (
                          <div className="pointer-events-none absolute inset-0 opacity-[0.14] bg-[url('/ss.png')] bg-cover bg-center bg-no-repeat mix-blend-screen [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent_80%)]" />
                        ) : null}
                        {isMediumPlan ? (
                          <div className="pointer-events-none absolute inset-0 opacity-[0.16] bg-[url('/M.png')] bg-cover bg-center bg-no-repeat mix-blend-screen [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent_78%)]" />
                        ) : null}
                        {isVipPlan ? (
                          <>
                            <div className="pointer-events-none absolute inset-0 opacity-[0.18] bg-[url('/v.png')] bg-cover bg-center bg-no-repeat mix-blend-screen" />
                            <div className="pointer-events-none absolute -inset-10 opacity-70 blur-3xl bg-[radial-gradient(circle,rgba(255,242,204,0.28)_0%,transparent_60%)]" />
                            <div className="pointer-events-none absolute inset-0 opacity-50 bg-[radial-gradient(circle,rgba(255,179,90,0.22)_1px,transparent_1.6px)] [background-size:26px_26px] [mask-image:radial-gradient(72%_60%_at_50%_40%,black,transparent_74%)]" />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FFF2CC]/10 via-transparent to-black/65" />
                            <div className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(255,242,204,0.28)_0%,transparent_62%)] blur-2xl" />
                          </>
                        ) : null}

                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div
                              className={
                                "font-heading tracking-[0.10em] text-transparent bg-clip-text bg-gradient-to-l " +
                                st.title +
                                (isVipPlan
                                  ? " text-3xl drop-shadow-[0_18px_60px_rgba(255,179,90,0.18)]"
                                  : " text-2xl")
                              }
                            >
                              {isVipPlan ? <span className="me-2">👑</span> : null}
                              {displayTitle}
                            </div>
                            {displaySubtitle ? (
                              <div className={"mt-1 text-sm " + (isVipPlan ? "text-[#FFF2CC]/80" : "text-white/75")}>
                                {displaySubtitle}
                              </div>
                            ) : null}
                          </div>
                          {isVipPlan ? (
                            <div className={"shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold tracking-[0.22em] ring-1 ring-inset " + st.badge}>
                              GOLD
                            </div>
                          ) : null}
                        </div>

                        {p.description ? (
                          <div className="mt-5 text-right text-sm leading-7 text-white/80">{p.description}</div>
                        ) : null}

                        {feats.length ? (
                          <div className="mt-6 space-y-2">
                            {feats.map((f, i) => (
                              <div
                                key={i}
                                className={
                                  "rounded-2xl px-4 py-3 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.10)] " +
                                  (isVip
                                    ? "bg-gradient-to-r from-[#FFF2CC]/12 via-white/5 to-[#FFB35A]/10 text-[#FFF2CC]/90 ring-1 ring-inset ring-[#FFF2CC]/20"
                                    : "bg-white/5 text-white/85")
                                }
                              >
                                {isVip ? "✦ " : ""}
                                {f}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-7 flex justify-end">
                          <div
                            className={
                              "relative inline-flex h-12 items-center justify-center rounded-2xl px-6 text-xs font-extrabold tracking-[0.14em] shadow-[0_30px_120px_-90px_rgba(0,0,0,0.95)] transition " +
                              st.cta
                            }
                          >
                            {isVip ? (
                              <div className="pointer-events-none absolute inset-0 opacity-60 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.55),transparent)] translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700" />
                            ) : null}
                            <span className="relative">{isVip ? "افتح كورسات VIP" : "افتح الكورسات"}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
