"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

import { IconBook, IconGrid, IconSpark, IconUsers } from "./icons";

type NavItem = {
  label: string;
  href?: string;
  icon: (props: { className?: string }) => JSX.Element;
  disabled?: boolean;
};

const nav: NavItem[] = [
  { label: "لوحة التحكم", href: "/admin", icon: IconGrid },
  { label: "الباقات", href: "/admin/packages", icon: IconSpark },
  { label: "الكورسات", href: "/admin/courses", icon: IconBook },
  { label: "أكواد الكروت", href: "/admin/card-codes", icon: IconSpark },
  { label: "المشتركين", href: "/admin/subscribers", icon: IconUsers },
  { label: "المستخدمين", href: "/admin/users", icon: IconUsers },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userLabel, setUserLabel] = useState("حسابي");
  const [signingOut, setSigningOut] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adminTheme, setAdminTheme] = useState<"dark" | "light">("dark");
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("fitcoach_admin_theme");
      if (raw === "dark" || raw === "light") setAdminTheme(raw);
    } catch {
      // ignore
    }
  }, []);

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
  }, [pathname]);

  const isDark = adminTheme === "dark";
  const shellCls = cn(
    "min-h-screen bg-slate-50 text-slate-900 font-sans antialiased [&_.font-heading]:font-sans [&_.font-heading]:tracking-normal [&_.rounded-2xl]:rounded-xl",
    isDark && "admin-theme-dark bg-[#070A0F] text-slate-100",
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

    const active = nav.find((it) => it.href === pathname);
    return { title: active?.label ?? "لوحة الأدمن", description: "" };
  }, [pathname]);

  return (
    <div
      className={shellCls}
      dir="rtl"
    >
      <div
        className={cn(
          "admin-surface-subtle sticky top-0 z-40 border-b border-slate-200 bg-slate-50 backdrop-blur",
          isDark && "border-slate-800 bg-slate-950",
        )}
      >
        <div className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6">
          <div
            className={cn(
              "admin-surface rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm",
              isDark && "border-slate-800 bg-slate-900",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">لوحة الأدمن</div>
                <div className="mt-1 text-xl font-semibold text-slate-900">{pageMeta.title}</div>
                {pageMeta.description ? (
                  <div className="mt-1 text-sm text-slate-600">{pageMeta.description}</div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <div ref={userMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className={cn(
                      "inline-flex h-10 max-w-[220px] items-center justify-center rounded-xl px-4 text-sm font-medium transition disabled:opacity-60",
                      isDark
                        ? "bg-violet-600 text-white shadow-sm hover:bg-violet-700"
                        : "bg-slate-900 text-white hover:bg-slate-800",
                    )}
                    disabled={signingOut}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                  >
                    <span className="min-w-0 truncate">{userLabel}</span>
                  </button>

                  {userMenuOpen ? (
                    <div
                      role="menu"
                      className={cn(
                        "admin-surface absolute right-0 z-50 mt-2 w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg",
                        isDark && "border-slate-800 bg-slate-950",
                      )}
                      dir="rtl"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          void logout();
                        }}
                        disabled={signingOut}
                        className={cn(
                          "admin-hover w-full px-4 py-3 text-right text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:opacity-60",
                          isDark && "text-slate-100 hover:bg-slate-900",
                        )}
                        role="menuitem"
                      >
                        تسجيل خروج
                      </button>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = isDark ? "light" : "dark";
                    setAdminTheme(next);
                    try {
                      window.localStorage.setItem("fitcoach_admin_theme", next);
                    } catch {
                      // ignore
                    }
                  }}
                  className={cn(
                    "inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition",
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                  aria-pressed={isDark}
                >
                  {isDark ? "وضع عادي" : "وضع ليلي"}
                </button>
                <Link
                  href="/"
                  className="admin-hover inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  الموقع
                </Link>
                <div className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-50 px-4 text-sm font-medium text-violet-700 border border-violet-100">
                  مباشر
                </div>
              </div>
            </div>

            <nav className="mt-4 flex flex-wrap items-center gap-2 lg:hidden" aria-label="Admin navigation" dir="rtl">
              {nav
                .filter((it) => Boolean(it.href))
                .map((it) => {
                  const href = it.href as string;
                  const active =
                    href === "/admin/courses"
                      ? pathname === "/admin/courses" || pathname?.startsWith("/admin/courses/")
                      : pathname === href;

                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition",
                        active
                          ? "border-violet-100 bg-violet-50 text-violet-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        isDark &&
                          (active
                            ? "border-violet-500/20 bg-violet-500/10 text-violet-200"
                            : "border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"),
                        it.disabled && "pointer-events-none opacity-40",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {it.label}
                    </Link>
                  );
                })}
            </nav>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-[1440px] flex-row gap-6 px-4 pb-6 pt-6 sm:px-6">
        <aside className="hidden w-[240px] flex-none lg:block">
          <div
            className={cn(
              "admin-surface sticky top-[104px] h-[calc(100vh-128px)] overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col",
              isDark && "border-slate-800 bg-slate-900",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">لوحة الأدمن</div>
                <div className="mt-1 text-xs text-slate-500">منصة التدريب</div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-sm">
                A
              </div>
            </div>

            <nav className="mt-5 min-h-0 flex-1 space-y-1 overflow-auto">
              {nav.map((it) => {
                const active = it.href ? pathname === it.href : false;
                const itemCls = cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-right text-sm font-medium transition",
                  active
                    ? isDark
                      ? "border-violet-500/20 bg-violet-500/10 text-violet-200"
                      : "border-violet-100 bg-violet-50 text-violet-800"
                    : isDark
                      ? "border-transparent text-slate-300 hover:bg-slate-900 hover:text-slate-100"
                      : "border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                  it.disabled && "pointer-events-none opacity-40",
                );

                const Icon = it.icon;

                if (it.href) {
                  return (
                    <Link key={it.label} href={it.href} className={itemCls} aria-current={active ? "page" : undefined}>
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-lg",
                          active
                            ? "bg-violet-600 text-white"
                            : isDark
                              ? "bg-slate-900 text-slate-200"
                              : "bg-slate-100 text-slate-700",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 truncate">{it.label}</span>
                    </Link>
                  );
                }

                return (
                  <div key={it.label} className={itemCls}>
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-lg",
                        isDark ? "bg-slate-900 text-slate-200" : "bg-slate-100 text-slate-700",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 truncate">{it.label}</span>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
