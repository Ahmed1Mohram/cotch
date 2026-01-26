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
        "admin-surface-subtle max-w-full overflow-x-auto whitespace-nowrap rounded-xl bg-slate-100 p-1 border border-slate-200",
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
              "h-10 rounded-lg px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              active
                ? "bg-violet-50 text-violet-700 shadow-sm border border-violet-100"
                : "admin-hover text-slate-700 hover:bg-slate-50 hover:text-slate-900",
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
