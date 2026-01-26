"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { IconLock } from "./icons";

export function Lockable({
  locked,
  label,
  children,
  className,
}: {
  locked: boolean;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div className={cn(locked && "pointer-events-none select-none opacity-40")}> 
        {children}
      </div>

      {locked ? (
        <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/40">
          <div className="admin-surface flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-sm border border-slate-200">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700">
              <IconLock className="h-6 w-6" />
            </span>
            <span className="text-center font-heading text-xs tracking-[0.14em] text-slate-800">
              {label ?? "مغلق"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
