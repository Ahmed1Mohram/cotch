                                 "use client";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { getOrCreateDeviceId } from "@/lib/deviceId";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type IconProps = { className?: string };

function IconChat({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 14a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" />
      <path d="M8 10h.01" />
      <path d="M12 10h.01" />
      <path d="M16 10h.01" />
    </svg>
  );
}

function IconInstagram({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <path d="M16 11.37a4 4 0 1 1-7.64 1.3 4 4 0 0 1 7.64-1.3z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

function IconFacebook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M13.5 22v-8h3l1-4h-4V7.5c0-1.16.34-2 2-2H18V2h-3c-3.07 0-5 2.07-5 5.5V10H7v4h3v8h3.5z" />
    </svg>
  );
}

function IconTikTok({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.6 3c.3 2.4 1.8 4 4.4 4.2V10c-1.6.1-3.1-.4-4.4-1.3v7.1c0 3.4-2.8 6.2-6.2 6.2S4.2 19.2 4.2 15.8c0-3.4 2.8-6.2 6.2-6.2.4 0 .8 0 1.2.1v3.1c-.4-.1-.8-.2-1.2-.2-1.7 0-3.1 1.4-3.1 3.1 0 1.7 1.4 3.1 3.1 3.1 1.8 0 3.2-1.5 3.2-3.5V3h3z" />
    </svg>
  );
}

function IconWhatsApp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M20.5 11.8c0 4.8-3.9 8.7-8.7 8.7-1.5 0-3-.4-4.3-1.1L3 21l1.6-4.3c-.8-1.3-1.2-2.8-1.2-4.4C3.4 7.5 7.3 3.6 12.1 3.6c4.5 0 8.4 3.7 8.4 8.2zm-8.4-6.9c-3.8 0-6.9 3.1-6.9 6.9 0 1.5.5 2.9 1.3 4.1l-.9 2.5 2.6-.8c1.2.7 2.5 1.1 3.9 1.1 3.8 0 6.9-3.1 6.9-6.9 0-3.7-3.1-6.9-6.9-6.9zm4 9.7c-.2.5-1.1 1-1.6 1.1-.4.1-1 .1-1.6-.1-2.3-.8-3.8-3.2-3.9-3.4-.1-.2-1-1.3-1-2.5 0-1.2.6-1.8.8-2 .2-.2.4-.3.6-.3h.4c.1 0 .3 0 .5.4.2.5.7 1.7.8 1.8.1.1.1.3 0 .5-.1.2-.2.3-.3.5-.1.1-.2.2-.3.4-.1.1-.2.2-.1.4.1.2.6 1 1.3 1.6.9.8 1.6 1.1 1.8 1.1.2 0 .3 0 .4-.1.1-.1.5-.6.7-.8.2-.2.3-.2.5-.1.2.1 1.3.6 1.5.7.2.1.3.2.3.3.1.1.1.6 0 1z" />
    </svg>
  );
}

function Orb3D({
  accentOrb,
  children,
  className,
}: {
  accentOrb: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={
        "relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-white/16 via-white/8 to-transparent shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14),0_18px_60px_-44px_rgba(0,0,0,0.95)] " +
        accentOrb +
        (className ? " " + className : "")
      }
    >
      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(140%_120%_at_28%_18%,rgba(255,255,255,0.34),transparent_58%)]" />
      <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-70 bg-[radial-gradient(160%_120%_at_70%_120%,rgba(0,0,0,0.0),rgba(0,0,0,0.55))]" />
      <span className="relative">{children}</span>
    </span>
  );
}

type SocialLink = {
  label: string;
  href: string;
  Icon: (props: IconProps) => JSX.Element;
  accentOrb: string;
  hoverGlow: string;
  iconClassName: string;
};

function whatsappSendHref(baseHref: string, message: string) {
  const clean = message.trim();
  if (!clean) return baseHref;
  const match = baseHref.match(/wa\.me\/(\d+)/);
  if (!match) return baseHref;
  return `https://wa.me/${match[1]}?text=${encodeURIComponent(clean)}`;
}

const socialLinks: SocialLink[] = [
  {
    label: "واتساب",
    href: "https://wa.me/201146512849",
    Icon: IconWhatsApp,
    accentOrb: "from-[#25D366]/45 via-white/10",
    hoverGlow:
      "hover:shadow-[0_0_0_1px_rgba(37,211,102,0.22),0_34px_120px_-92px_rgba(37,211,102,0.55)]",
    iconClassName: "text-[#25D366]",
  },
  {
    label: "إنستجرام",
    href: "https://www.instagram.com/coach_mostafanasr?igsh=NWd1YjJ4andza2Jp",
    Icon: IconInstagram,
    accentOrb: "from-[#E1306C]/45 via-white/10",
    hoverGlow:
      "hover:shadow-[0_0_0_1px_rgba(225,48,108,0.22),0_34px_120px_-92px_rgba(225,48,108,0.55)]",
    iconClassName: "text-[#E1306C]",
  },
  {
    label: "فيسبوك",
    href: "https://www.facebook.com/people/Mostafa-Nasr/100031643914568/?rdid=qhn8TSb2vqeWMMfC&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1A1S1eTFjB%2F",
    Icon: IconFacebook,
    accentOrb: "from-[#1877F2]/45 via-white/10",
    hoverGlow:
      "hover:shadow-[0_0_0_1px_rgba(24,119,242,0.22),0_34px_120px_-92px_rgba(24,119,242,0.55)]",
    iconClassName: "text-[#1877F2]",
  },
  {
    label: "تيك توك",
    href: "https://www.tiktok.com/@c_mostafa_nasr_",
    Icon: IconTikTok,
    accentOrb: "from-white/14 via-white/8",
    hoverGlow:
      "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_34px_120px_-92px_rgba(0,0,0,0.95)]",
    iconClassName: "text-[#69C9D0]",
  },
];

type PackageOption = {
  id: string;
  title: string;
  slug: string;
};

type CourseOption = {
  id: string;
  slug: string;
  title: string;
};

export function FinalCTA() {
  const [chatOpen, setChatOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [packageId, setPackageId] = useState("");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [club, setClub] = useState("");

  const whatsAppHref = socialLinks.find((l) => l.label === "واتساب")?.href ?? "https://wa.me/201146512849";

  const fullNameParts = fullName.trim().split(/\s+/).filter(Boolean).length;
  const fullNameOk = fullNameParts >= 3;
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneOk = phoneDigits.length >= 8;

  const canSend = fullNameOk && phoneOk && Boolean(packageId.trim()) && Boolean(courseId.trim());

  useEffect(() => {
    const url = new URL(window.location.href);
    const open = url.searchParams.get("chat");
    if (!(open === "1" || open === "true")) return;
    setChatOpen(true);
    const t = window.setTimeout(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(t);
  }, []);

  const selectedPackage = useMemo(() => packages.find((p) => p.id === packageId) ?? null, [packages, packageId]);
  const selectedCourse = useMemo(() => courses.find((c) => c.id === courseId) ?? null, [courses, courseId]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const run = async () => {
      const res = await supabase
        .from("packages")
        .select("id,slug,title")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (res.error) {
        setPackages([]);
        return;
      }

      const list: PackageOption[] = ((res.data as any[]) ?? []).map((r) => ({
        id: String(r.id),
        slug: String(r.slug),
        title: String(r.title ?? ""),
      }));

      setPackages(list);
    };

    void run().catch(() => {
      setPackages([]);
    });
  }, []);

  useEffect(() => {
    setCourses([]);
    setCourseId("");
    setCoursesLoading(false);
    setCoursesError(null);

    const pid = packageId.trim();
    if (!pid) return;

    const supabase = createSupabaseBrowserClient();
    const run = async () => {
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const pcRes = await supabase
          .from("package_courses")
          .select("course_id,sort_order,created_at")
          .eq("package_id", pid)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true });

        if (pcRes.error) {
          setCourses([]);
          setCoursesError("تعذر تحميل الكورسات");
          return;
        }

        const ids: string[] = ((pcRes.data as any[]) ?? []).map((r) => String(r.course_id ?? "")).filter(Boolean);
        if (!ids.length) {
          setCourses([]);
          return;
        }

        const cRes = await supabase.from("courses").select("id,slug,title_ar,title_en").in("id", ids);
        if (cRes.error) {
          setCourses([]);
          setCoursesError("تعذر تحميل الكورسات");
          return;
        }

        const byId = new Map(((cRes.data as any[]) ?? []).map((c) => [String(c.id), c] as const));
        const list: CourseOption[] = ids
          .map((id) => byId.get(id))
          .filter(Boolean)
          .map((c: any) => ({
            id: String(c.id),
            slug: String(c.slug),
            title: String(c.title_ar ?? c.title_en ?? c.slug ?? ""),
          }));

        setCourses(list);
      } finally {
        setCoursesLoading(false);
      }
    };

    void run().catch(() => {
      setCourses([]);
      setCoursesError("تعذر تحميل الكورسات");
      setCoursesLoading(false);
    });
  }, [packageId]);

  function onSubmitChat(e: FormEvent) {
    e.preventDefault();
    if (!fullNameOk || !phoneOk) return;

    const supabase = createSupabaseBrowserClient();
    const deviceId = getOrCreateDeviceId();

    const ageInt = ageYears.trim() ? Number.parseInt(ageYears.trim(), 10) : null;
    const heightInt = heightCm ? Number.parseInt(heightCm, 10) : null;
    const weightNum = weightKg.trim() ? Number.parseFloat(weightKg.trim()) : null;

    const payload = [
      `الاسم: ${fullName.trim()}`,
      `رقم الموبايل: ${phone.trim()}`,
      selectedPackage?.title ? `الباقة: ${selectedPackage.title}` : "",
      selectedCourse?.title ? `الكورس: ${selectedCourse.title}` : "",
      Number.isFinite(ageInt as any) ? `العمر: ${String(ageInt)} سنة` : "",
      heightCm ? `الطول: ${heightCm} سم` : "",
      weightKg.trim() ? `الوزن: ${weightKg.trim()} كجم` : "",
      club.trim() ? `النادي: ${club.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("contact_requests").insert({
        user_id: user?.id ?? null,
        device_id: deviceId || null,
        package_id: selectedPackage?.id ?? null,
        package_title: selectedPackage?.title ?? null,
        course_id: selectedCourse?.id ?? null,
        course_title: selectedCourse?.title ?? null,
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        age_years: Number.isFinite(ageInt as any) ? ageInt : null,
        height_cm: Number.isFinite(heightInt as any) ? heightInt : null,
        weight_kg: Number.isFinite(weightNum as any) ? weightNum : null,

        club: club.trim() || null,
        message: null,
      });

      if (user) {
        await supabase.from("user_profiles").upsert(
          {
            user_id: user.id,
            full_name: fullName.trim() || null,
            phone: phone.trim() || null,
            age_years: Number.isFinite(ageInt as any) ? ageInt : null,
            height_cm: Number.isFinite(heightInt as any) ? heightInt : null,
            weight_kg: Number.isFinite(weightNum as any) ? weightNum : null,
          },
          { onConflict: "user_id" },
        );
      }
    })().catch(() => {});

    const href = whatsappSendHref(whatsAppHref, payload);
    if (href === whatsAppHref) return;
    window.open(href, "_blank", "noopener,noreferrer");
    setFullName("");
    setPhone("");
    setPackageId("");
    setCourseId("");
    setAgeYears("");
    setHeightCm("");
    setWeightKg("");
    setClub("");
    setChatOpen(false);
  }

  return (
    <section id="contact" className="relative isolate overflow-hidden bg-[#050506] py-20 sm:py-28 cv-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_640px_at_18%_0%,rgba(255,255,255,0.08),transparent_62%),radial-gradient(1000px_620px_at_86%_10%,rgba(59,130,246,0.10),transparent_60%),radial-gradient(900px_520px_at_55%_70%,rgba(168,85,247,0.08),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <Container>
        <div className="relative mx-auto max-w-6xl">
          <div className="rounded-[36px] p-[1px] bg-gradient-to-r from-white/16 via-white/6 to-white/16 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_70px_220px_-170px_rgba(0,0,0,0.98)]">
            <div className="relative overflow-hidden rounded-[35px] bg-black/35 px-7 py-14 backdrop-blur-none sm:px-12">
              <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(1000px_520px_at_12%_20%,rgba(255,255,255,0.10),transparent_64%),radial-gradient(920px_520px_at_88%_24%,rgba(59,130,246,0.12),transparent_64%),radial-gradient(900px_520px_at_55%_78%,rgba(168,85,247,0.10),transparent_72%)]" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/35" />
              <div className="pointer-events-none absolute -inset-x-24 -top-28 hidden h-56 opacity-60 blur-3xl sm:block bg-[radial-gradient(700px_160px_at_50%_50%,rgba(255,255,255,0.14),transparent_70%)]" />
              <div className="pointer-events-none absolute -inset-x-24 -bottom-28 hidden h-56 opacity-50 blur-3xl sm:block bg-[radial-gradient(700px_160px_at_50%_50%,rgba(0,0,0,0.65),transparent_70%)]" />

              <div className="relative grid gap-10 lg:grid-cols-[1fr_520px] lg:items-start">
                <div dir="rtl">
                  <Reveal>
                    <p className="font-heading text-xs tracking-[0.26em] text-white/60">CONTACT</p>
                  </Reveal>
                  <Reveal delay={0.06}>
                    <h2 className="mt-3 font-heading text-4xl tracking-[0.12em] text-white sm:text-6xl drop-shadow-[0_16px_40px_rgba(0,0,0,0.92)]">
                      تواصل معي الآن… وخلي جسمك يتكلم
                    </h2>
                  </Reveal>
                  <Reveal delay={0.12}>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-white/78 sm:text-lg drop-shadow-[0_10px_26px_rgba(0,0,0,0.9)]">
                      لو جاهز للتغيير الحقيقي… هنعمل خطة تدريب ذكية تناسب هدفك، ونمشي خطوة بخطوة لحد ما تشوف النتيجة بنفسك.
                    </p>
                  </Reveal>

                  <Reveal delay={0.16}>
                    <div className="mt-8 flex flex-wrap justify-end gap-3">
                      <div className="rounded-full bg-white/5 px-4 py-2 text-xs tracking-[0.22em] text-white/75 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                        رد سريع
                      </div>
                      <div className="rounded-full bg-white/5 px-4 py-2 text-xs tracking-[0.22em] text-white/75 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                        خصوصية
                      </div>
                      <div className="rounded-full bg-white/5 px-4 py-2 text-xs tracking-[0.22em] text-white/75 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                        خطة واضحة
                      </div>
                    </div>
                  </Reveal>

                </div>

                <Reveal delay={0.12}>
                  <div className="relative mx-auto max-w-md w-full [perspective:1200px]" dir="rtl">
                    <div className="rounded-3xl p-[1px] bg-gradient-to-r from-white/16 via-white/8 to-transparent w-full">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/5 p-5 sm:p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_44px_160px_-120px_rgba(0,0,0,0.98)]">
                        <div className="pointer-events-none absolute inset-0 opacity-75 bg-[radial-gradient(900px_320px_at_18%_0%,rgba(59,130,246,0.14),transparent_64%),radial-gradient(900px_340px_at_88%_110%,rgba(168,85,247,0.12),transparent_66%)]" />
                        <div className="pointer-events-none absolute -inset-x-16 -top-20 hidden h-40 opacity-60 blur-3xl sm:block bg-[radial-gradient(600px_140px_at_50%_50%,rgba(255,255,255,0.16),transparent_72%)]" />
                        <div className="pointer-events-none absolute inset-0 opacity-80 [mask-image:linear-gradient(to_bottom,black,transparent_62%)] [-webkit-mask-image:linear-gradient(to_bottom,black,transparent_62%)] bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.06)_32%,transparent_62%)]" />

                        <div className="relative flex flex-col items-center gap-4 sm:gap-6 w-full">
                          <button
                            type="button"
                            onClick={() => setChatOpen((v) => !v)}
                            aria-label="فتح الشات"
                            className="[transform-style:preserve-3d] flex flex-col items-center gap-2.5 sm:gap-3 w-full"
                          >
                            <Orb3D
                              accentOrb="from-white/18 via-white/8"
                              className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_28px_90px_-70px_rgba(0,0,0,0.98)]"
                            >
                              <IconChat className="h-8 w-8 sm:h-10 sm:w-10 text-white/90" />
                            </Orb3D>
                            <span className="text-center text-xs font-semibold text-white/85 [text-shadow:0_0_18px_rgba(255,255,255,0.35)] px-2">
                              اضغطني لتسججيل الاشتراك
                            </span>
                          </button>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-sm sm:max-w-none mx-auto">
                            {socialLinks.map(({ label, href, Icon, accentOrb, hoverGlow, iconClassName }) => (
                              <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={label}
                                title={label}
                                className={
                                  "rounded-2xl sm:rounded-2xl bg-white/5 p-[1px] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_60px_-44px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1 " +
                                  hoverGlow
                                }
                              >
                                <span className="grid place-items-center rounded-2xl bg-black/35 p-2.5 sm:p-2 w-full">
                                  <Orb3D accentOrb={accentOrb} className="h-16 w-16 sm:h-14 sm:w-14">
                                    <Icon className={"h-7 w-7 sm:h-6 sm:w-6 drop-shadow-[0_10px_26px_rgba(0,0,0,0.85)] " + iconClassName} />
                                  </Orb3D>
                                </span>
                              </a>
                            ))}
                          </div>

                          <div
                            className={
                              "w-full overflow-hidden rounded-3xl bg-white/5 p-[1px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-all duration-300 " +
                              (chatOpen ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0")
                            }
                          >
                            <div className="max-h-[640px] overflow-auto rounded-3xl bg-black/35 p-4" dir="rtl">
                              <form onSubmit={onSubmitChat} className="flex flex-col gap-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <label className="flex flex-col gap-2">
                                    <span className="font-heading text-xs tracking-[0.22em] text-white/70">الاسم الثلاثي (إجباري)</span>

                                    <input
                                      value={fullName}
                                      onChange={(e) => setFullName(e.target.value)}
                                      placeholder="مثال: أحمد محمد علي"
                                      className="w-full rounded-2xl bg-black/35 px-4 py-3 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] outline-none placeholder:text-white/40 focus:shadow-[0_0_0_1px_rgba(37,211,102,0.25),0_28px_90px_-70px_rgba(37,211,102,0.35)]"
                                    />
                                  </label>

                                  <label className="flex flex-col gap-2">
                                    <span className="font-heading text-xs tracking-[0.22em] text-white/70">رقم الموبايل (إجباري)</span>
                                    <input
                                      value={phone}
                                      onChange={(e) => setPhone(e.target.value)}
                                      placeholder="01xxxxxxxxx"
                                      inputMode="tel"
                                      className="w-full rounded-2xl bg-black/35 px-4 py-3 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] outline-none placeholder:text-white/40 focus:shadow-[0_0_0_1px_rgba(37,211,102,0.25),0_28px_90px_-70px_rgba(37,211,102,0.35)]"
                                    />
                                  </label>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <label className="flex flex-col gap-2">
                                    <span className="font-heading text-xs tracking-[0.22em] text-white/70">العمر (سنة)</span>
                                    <input
                                      value={ageYears}
                                      onChange={(e) => setAgeYears(e.target.value)}
                                      placeholder="اختياري"
                                      inputMode="numeric"
                                      className="w-full rounded-2xl bg-black/35 px-4 py-3 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] outline-none placeholder:text-white/40 focus:shadow-[0_0_0_1px_rgba(37,211,102,0.25),0_28px_90px_-70px_rgba(37,211,102,0.35)]"
                                    />
                                  </label>

                                  <label className="flex flex-col gap-2">
                                    <span className="font-heading text-xs tracking-[0.22em] text-white/70">الطول (سم)</span>
                                    <select
                                      value={heightCm}
                                      onChange={(e) => setHeightCm(e.target.value)}
                                      className="w-full rounded-2xl bg-black/35 px-4 py-3 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] outline-none focus:shadow-[0_0_0_1px_rgba(37,211,102,0.25),0_28px_90px_-70px_rgba(37,211,102,0.35)] disabled:opacity-50"
                                    >
                                      <option value="">اختياري</option>
                                      <option value="150">150</option>
                                      <option value="155">155</option>
                                      <option value="160">160</option>
                                      <option value="165">165</option>
                                      <option value="170">170</option>
                                      <option value="175">175</option>
                                      <option value="180">180</option>
                                      <option value="185">185</option>
                                      <option value="190">190</option>
                                      <option value="195">195</option>
                                      <option value="200">200</option>
                                    </select>
                                  </label>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <label className="flex flex-col gap-2">
                                    <span className="font-heading text-xs tracking-[0.22em] text-white/70">الباقة</span>
                                    <select
                                      value={packageId}
                                      onChange={(e) => setPackageId(e.target.value)}
                                      className="w-full rounded-2xl bg-black/35 px-4 py-3 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] outline-none focus:shadow-[0_0_0_1px_rgba(37,211,102,0.25),0_28px_90px_-70px_rgba(37,211,102,0.35)]"
                                    >
                                      <option value="">اختر الباقة…</option>
                                      {packages.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.title}
                                        </option>
                                      ))}
                                    </select>
                                  </label>

                                  <label className="flex flex-col gap-2">
                                    <span className="font-heading text-xs tracking-[0.22em] text-white/70">الكورس</span>
                                    <select
                                      value={courseId}
                                      onChange={(e) => setCourseId(e.target.value)}
                                      disabled={!packageId || coursesLoading || courses.length === 0}
                                      className="w-full rounded-2xl bg-black/35 px-4 py-3 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] outline-none focus:shadow-[0_0_0_1px_rgba(37,211,102,0.25),0_28px_90px_-70px_rgba(37,211,102,0.35)] disabled:opacity-50"
                                    >
                                      <option value="">
                                        {!packageId
                                          ? "اختار الباقة الأول…"
                                          : coursesLoading
                                            ? "جاري تحميل الكورسات…"
                                            : coursesError
                                              ? coursesError
                                              : courses.length === 0
                                                ? "مفيش كورسات للباقه دي"
                                                : "اختر الكورس…"}
                                      </option>
                                      {courses.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.title}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <label className="flex flex-col gap-2">
                                    <span className="font-heading text-xs tracking-[0.22em] text-white/70">الوزن (كجم)</span>

                                    <input
                                      value={weightKg}
                                      onChange={(e) => setWeightKg(e.target.value)}
                                      placeholder="اكتب وزنك…"
                                      inputMode="numeric"
                                      className="w-full rounded-2xl bg-black/35 px-4 py-3 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] outline-none placeholder:text-white/40 focus:shadow-[0_0_0_1px_rgba(37,211,102,0.25),0_28px_90px_-70px_rgba(37,211,102,0.35)]"
                                    />
                                  </label>

                                  <label className="flex flex-col gap-2">
                                    <span className="font-heading text-xs tracking-[0.22em] text-white/70">النادي (اختياري)</span>
                                    <input
                                      value={club}
                                      onChange={(e) => setClub(e.target.value)}
                                      placeholder="اسم النادي…"
                                      className="w-full rounded-2xl bg-black/35 px-4 py-3 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] outline-none placeholder:text-white/40 focus:shadow-[0_0_0_1px_rgba(37,211,102,0.25),0_28px_90px_-70px_rgba(37,211,102,0.35)]"
                                    />
                                  </label>
                                </div>

                                <button
                                  type="submit"
                                  disabled={!canSend}
                                  className="rounded-2xl bg-[#25D366]/90 px-4 py-3 text-center text-[13px] font-semibold text-white shadow-[0_14px_60px_-36px_rgba(37,211,102,0.65)] transition hover:bg-[#25D366] hover:shadow-[0_18px_90px_-44px_rgba(37,211,102,0.80)] [text-shadow:0_0_18px_rgba(255,255,255,0.55)] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
                                >
                                  اضغطني لتسججيل الاشتراك
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}