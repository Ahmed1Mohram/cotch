"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";

type NavigationLoadingBarProps = {
  className?: string;
  durationMs?: number;
};

export function NavigationLoadingBar({ className, durationMs = 2000 }: NavigationLoadingBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [progress, setProgress] = useState(0);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastKeyRef = useRef<string | null>(null);

  const clearTimers = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const start = (d: number) => {
    clearTimers();

    setVisible(true);
    setClosing(false);
    setProgress(0);

    rafRef.current = requestAnimationFrame(() => {
      setProgress(100);
    });

    closeTimerRef.current = setTimeout(() => {
      setClosing(true);
    }, Math.max(0, d));

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setClosing(false);
      setProgress(0);
    }, Math.max(0, d) + 250);
  };

  const currentPkg = useMemo(() => {
    try {
      const v = searchParams?.get("pkg") ?? "";
      return String(v).trim().toLowerCase();
    } catch {
      return "";
    }
  }, [searchParams]);

  useEffect(() => {
    const path = typeof pathname === "string" ? pathname : "";

    const isProgramCoursePage = /^\/programs\/[^/]+$/.test(path);
    if (!isProgramCoursePage) {
      lastKeyRef.current = `${path}|${currentPkg}`;
      return;
    }

    const key = `${path}|${currentPkg}`;
    if (lastKeyRef.current === null) {
      lastKeyRef.current = key;
      return;
    }

    const [prevPath, prevPkg] = lastKeyRef.current.split("|");
    lastKeyRef.current = key;

    if (prevPath === path && prevPkg !== currentPkg) {
      start(durationMs);
    }
  }, [currentPkg, durationMs, pathname]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-[9998] h-1.5 overflow-hidden bg-transparent",
        closing ? "opacity-0 transition-opacity duration-200" : "opacity-100",
        className,
      )}
      aria-hidden
    >
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-[#FF2424] via-[#FF6A00] to-[#FFB35A]"
        style={{
          width: `${progress}%`,
          transitionProperty: "width",
          transitionDuration: `${durationMs}ms`,
          transitionTimingFunction: "ease-out",
        }}
      />
    </div>
  );
}
