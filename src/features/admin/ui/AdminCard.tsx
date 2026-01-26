import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function AdminCard({
  children,
  className,
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: "green" | "blue" | "orange";
}) {
  const accentMap: Record<NonNullable<typeof glow>, string> = {
    green: "border-r-2 border-r-emerald-500",
    blue: "border-r-2 border-r-sky-500",
    orange: "border-r-2 border-r-violet-500",
  };

  return (
    <div
      className={cn(
        "admin-surface rounded-xl bg-white p-5 shadow-sm border border-slate-200/80",
        glow ? accentMap[glow] : null,
        className,
      )}
    >
      {children}
    </div>
  );
}
