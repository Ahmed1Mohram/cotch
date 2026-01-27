"use client";

import { cn } from "@/lib/cn";

export type TabItem<T extends string> = {
  key: T;
  label: string;
};

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: Array<TabItem<T>>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-full overflow-x-auto whitespace-nowrap rounded-2xl bg-slate-100/80 p-1 border border-slate-200",
        className,
      )}
    >
      <div className="inline-flex items-center gap-1">
      {items.map((it) => {
        const active = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className={cn(
              "h-10 rounded-2xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              active
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-700 hover:bg-white/70 hover:text-slate-900",
            )}
          >
            {it.label}
          </button>
        );
      })}
      </div>
    </div>
  );
}
