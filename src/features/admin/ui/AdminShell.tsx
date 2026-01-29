"use client";



import type { ReactNode } from "react";

import { useEffect, useMemo, useRef, useState } from "react";



import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";



import { cn } from "@/lib/cn";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

import { ThemeToggle } from "@/components/ui/ThemeToggle";



import { IconBell, IconBook, IconChat, IconGrid, IconMenu, IconSpark, IconUsers } from "./icons";



type NavItem = {

  label: string;

  href?: string;

  icon: (props: { className?: string }) => JSX.Element;

  disabled?: boolean;

};



type NavGroup = {

  label: string;

  items: NavItem[];

};



const navGroups: NavGroup[] = [

  {

    label: "الرئيسية",

    items: [{ label: "لوحة التحكم", href: "/admin", icon: IconGrid }],

  },

  {

    label: "التواصل",

    items: [{ label: "الشات", href: "/admin/chat", icon: IconChat }],

  },

  {

    label: "المحتوى",

    items: [

      { label: "الكورسات", href: "/admin/courses", icon: IconBook },

      { label: "الباقات", href: "/admin/packages", icon: IconSpark },

      { label: "أكواد الكروت", href: "/admin/card-codes", icon: IconSpark },

    ],

  },

  {

    label: "المستخدمين",

    items: [

      { label: "المشتركين", href: "/admin/subscribers", icon: IconUsers },

      { label: "المستخدمين", href: "/admin/users", icon: IconUsers },

    ],

  },

];



export function AdminShell({ children }: { children: ReactNode }) {

  const pathname = usePathname();

  const router = useRouter();

  const [userLabel, setUserLabel] = useState("حسابي");

  const [signingOut, setSigningOut] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [isLightTheme, setIsLightTheme] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);



  useEffect(() => {

    const supabase = createSupabaseBrowserClient();

    let mounted = true;



    const run = async () => {

      const res = await supabase.auth.getUser();

      const user = res.data.user;

      if (!mounted || !user) return;

      const meta = (user as any)?.user_metadata ?? {};

      const name = typeof meta.full_name === "string" && meta.full_name.trim() ? meta.full_name.trim() : "";

      const email = typeof user.email === "string" ? user.email : "";

      setUserLabel(name || email || "حسابي");

    };



    void run();

    return () => {

      mounted = false;

    };

  }, []);



  useEffect(() => {

    setUserMenuOpen(false);

    setDrawerOpen(false);

  }, [pathname]);



  useEffect(() => {

    const read = () => {

      setIsLightTheme(document.documentElement.classList.contains("theme-light"));

    };

    read();

    window.addEventListener("fitcoach-theme-changed", read);

    window.addEventListener("storage", read);

    return () => {

      window.removeEventListener("fitcoach-theme-changed", read);

      window.removeEventListener("storage", read);

    };

  }, []);



  const shellCls = cn(

    "min-h-screen font-sans antialiased [&_.font-heading]:font-sans [&_.font-heading]:tracking-normal [&_.rounded-xl]:!rounded-2xl",

    isLightTheme ? "bg-[#EEF2F7] text-slate-900" : "admin-theme-dark",

  );



  useEffect(() => {

    if (!userMenuOpen) return;



    const onPointerDown = (e: MouseEvent) => {

      const root = userMenuRef.current;

      if (!root) return;

      if (root.contains(e.target as Node)) return;

      setUserMenuOpen(false);

    };



    window.addEventListener("mousedown", onPointerDown);

    return () => window.removeEventListener("mousedown", onPointerDown);

  }, [userMenuOpen]);



  const logout = async () => {

    if (signingOut) return;

    setUserMenuOpen(false);

    setSigningOut(true);

    try {

      const supabase = createSupabaseBrowserClient();

      await supabase.auth.signOut();

    } catch {

      // ignore

    }

    router.replace("/login");

    router.refresh();

  };



  const pageMeta = useMemo(() => {

    if (pathname === "/admin") {

      return {

        title: "لوحة التحكم",

        description: "نظرة سريعة وإحصائيات مختصرة.",

      };

    }



    if (pathname === "/admin/packages") {

      return {

        title: "الباقات",

        description: "إنشاء وتعديل الباقات وربط الكورسات.",

      };

    }



    if (pathname === "/admin/courses") {

      return {

        title: "الكورسات",

        description: "إنشاء وإدارة الكورسات ومحتواها.",

      };

    }



    if (pathname === "/admin/card-codes") {

      return {

        title: "أكواد الكروت",

        description: "توليد أكواد تفعيل الكروت (Card codes) لكل كورس.",

      };

    }



    if (pathname?.startsWith("/admin/courses/") && pathname?.endsWith("/subscribers")) {

      return {

        title: "مشتركين الكورس",

        description: "عرض المشتركين وغير المشتركين في هذا الكورس.",

      };

    }



    if (pathname?.startsWith("/admin/courses/")) {

      return {

        title: "تفاصيل الكورس",

        description: "إدارة الأعمار والشهور والأيام والفيديوهات والأكواد.",

      };

    }



    if (pathname === "/admin/subscribers") {

      return {

        title: "المشتركين",

        description: "متابعة الاشتراكات والحالات.",

      };

    }



    if (pathname === "/admin/users") {

      return {

        title: "المستخدمين",

        description: "إدارة حسابات المستخدمين.",

      };

    }



    if (pathname === "/admin/chat") {

      return {

        title: "الشات",

        description: "متابعة محادثات المستخدمين.",

      };

    }



    const flat = navGroups.flatMap((g) => g.items);

    const active = flat.find((it) => it.href === pathname);

    return { title: active?.label ?? "لوحة الأدمن", description: "" };

  }, [pathname]);



  return (

    <div

      className={shellCls}

      dir="rtl"

    >

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">

        <div className="mx-auto w-full max-w-[560px] px-4">

          <div className="flex h-14 items-center justify-between">

            <div ref={userMenuRef} className="relative">

              <button

                type="button"

                onClick={() => setUserMenuOpen((v) => !v)}

                className="flex h-10 items-center gap-2 rounded-2xl bg-slate-100 px-2.5 text-slate-800 transition hover:bg-slate-200"

                disabled={signingOut}

                aria-haspopup="menu"

                aria-expanded={userMenuOpen}

              >

                <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-bold shadow-sm">

                  A

                </span>

                <span className="max-w-[120px] truncate text-sm font-medium">{userLabel}</span>

              </button>



              {userMenuOpen ? (

                <div

                  role="menu"

                  className="absolute right-0 z-50 mt-2 w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"

                >

                  <button

                    type="button"

                    onClick={() => {

                      void logout();

                    }}

                    disabled={signingOut}

                    className="w-full px-4 py-3 text-right text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"

                    role="menuitem"

                  >

                    تسجيل خروج

                  </button>

                </div>

              ) : null}

            </div>



            <div className="min-w-0 px-2 text-center">

              <div className="truncate text-sm font-semibold text-slate-900">{pageMeta.title}</div>

            </div>



            <div className="flex items-center gap-2">

              <div className="rounded-2xl">

                <ThemeToggle

                  className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"

                  iconClassName="h-5 w-5"

                />

              </div>

              <button

                type="button"

                className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"

                aria-label="الإشعارات"

              >

                <IconBell className="h-6 w-6" />

              </button>

              <button

                type="button"

                onClick={() => setDrawerOpen(true)}

                className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"

                aria-label="القائمة"

              >

                <IconMenu className="h-6 w-6" />

              </button>

            </div>

          </div>

        </div>

      </header>



      {drawerOpen ? (

        <div className="fixed inset-0 z-50">

          <div

            className="absolute inset-0 bg-black/40"

            onClick={() => {

              setDrawerOpen(false);

            }}

          />

          <div className="absolute inset-y-0 right-0 w-[300px] max-w-[85vw] bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">

              <div>

                <div className="text-sm font-semibold text-slate-900">أدمن النظام</div>

                <div className="mt-1 text-xs text-slate-500">لوحة التحكم</div>

              </div>

              <button

                type="button"

                onClick={() => setDrawerOpen(false)}

                className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"

                aria-label="إغلاق"

              >

                <span className="text-xl leading-none">×</span>

              </button>

            </div>



            <nav className="px-3 py-3" aria-label="Admin navigation" dir="rtl">

              {navGroups.map((group) => (

                <div key={group.label} className="mb-2">

                  <div className="px-3 pb-2 pt-3 text-[11px] font-semibold text-slate-500">{group.label}</div>

                  {group.items

                    .filter((it) => Boolean(it.href))

                    .map((it) => {

                      const href = it.href as string;

                      const active =

                        href === "/admin/courses"

                          ? pathname === "/admin/courses" || pathname?.startsWith("/admin/courses/")

                          : pathname === href;

                      const Icon = it.icon;



                      return (

                        <Link

                          key={href}

                          href={href}

                          onClick={() => setDrawerOpen(false)}

                          className={cn(

                            "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",

                            active ? "bg-slate-900 text-white" : "text-slate-800 hover:bg-slate-100",

                            it.disabled && "pointer-events-none opacity-40",

                          )}

                          aria-current={active ? "page" : undefined}

                        >

                          <span

                            className={cn(

                              "grid h-10 w-10 place-items-center rounded-2xl",

                              active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700",

                            )}

                          >

                            <Icon className="h-5 w-5" />

                          </span>

                          <span className="min-w-0 truncate">{it.label}</span>

                        </Link>

                      );

                    })}

                </div>

              ))}



              <div className="mt-3 border-t border-slate-200 pt-3">

                <Link

                  href="/"

                  onClick={() => setDrawerOpen(false)}

                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"

                >

                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">🏠</span>

                  <span>الموقع</span>

                </Link>

              </div>

            </nav>

          </div>

        </div>

      ) : null}



      <div className="mx-auto w-full max-w-[560px] px-3 sm:px-4 pb-8 pt-5">

        <main className="min-w-0 overflow-x-hidden">{children}</main>

      </div>

    </div>

  );

}

