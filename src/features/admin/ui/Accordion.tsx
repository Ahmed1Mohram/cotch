"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

import { IconChevronDown } from "./icons";

export function Accordion({
  title,
  subtitle,
  defaultOpen,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

  return (
    <div className="rounded-2xl bg-white/90 border border-slate-200/70 shadow-[0_12px_40px_-28px_rgba(2,6,23,0.45)] backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-right transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-900">
            {title}
          </span>
          {subtitle ? (
            <span className="mt-1 block truncate text-xs text-slate-500">
              {subtitle}
            </span>
          ) : null}
        </span>
        <IconChevronDown
          className={cn(
            "h-5 w-5 flex-none text-slate-500 transition",
            open ? "rotate-180" : "rotate-0",
          )}
        />
      </button>

      {open ? <div className="px-5 pb-5">{children}</div> : null}
    </div>
  );
}
