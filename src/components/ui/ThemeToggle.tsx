"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

type Theme = "light" | "dark";

const STORAGE_KEY = "fitcoach-theme";

function readStoredTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
    return null;
  } catch {
    return null;
  }
}

function prefersDark(): boolean {
  try {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return true;
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") root.classList.add("theme-light");
  else root.classList.remove("theme-light");

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
  }

  window.dispatchEvent(new Event("fitcoach-theme-changed"));
}

function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("theme-light") ? "light" : "dark";
}

function IconSun(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconMoon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden="true"
    >
      <path d="M21 12.8A8.8 8.8 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

export function ThemeToggle({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = readStoredTheme();
    const initial = stored ?? (prefersDark() ? "dark" : "light");
    applyTheme(initial);
    setTheme(getCurrentTheme());

    const onThemeChange = () => setTheme(getCurrentTheme());
    window.addEventListener("fitcoach-theme-changed", onThemeChange);
    window.addEventListener("storage", onThemeChange);
    return () => {
      window.removeEventListener("fitcoach-theme-changed", onThemeChange);
      window.removeEventListener("storage", onThemeChange);
    };
  }, []);

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
      className={cn(
        "grid place-items-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        className,
      )}
      aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
    >
      {theme === "dark" ? (
        <IconSun className={cn("h-5 w-5", iconClassName)} />
      ) : (
        <IconMoon className={cn("h-5 w-5", iconClassName)} />
      )}
    </button>
  );
}
