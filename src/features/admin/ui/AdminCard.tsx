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
    orange: "border-r-2 border-r-[#FF2424]",
  };

  return (
    <div
      className={cn(
        "rounded-2xl bg-white/90 p-5 shadow-[0_12px_40px_-28px_rgba(2,6,23,0.45)] border border-slate-200/70 backdrop-blur",
        glow ? accentMap[glow] : null,
        className,
      )}
    >
      {children}
    </div>
  );
}
