"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRef, useState } from "react";

import { cn } from "@/lib/cn";

export function CoursesMarquee({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const [paused, setPaused] = useState(false);
  const pointerIdRef = useRef<number | null>(null);

  return (
    <div
      className={cn("courses-marquee", className)}
      style={style}
      data-paused={paused ? "true" : "false"}
      onPointerDown={(e) => {
        pointerIdRef.current = e.pointerId;
        setPaused(true);
        try {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        } catch {}
      }}
      onPointerUp={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        pointerIdRef.current = null;
        setPaused(false);
      }}
      onPointerCancel={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        pointerIdRef.current = null;
        setPaused(false);
      }}
      onPointerLeave={() => {
        pointerIdRef.current = null;
        setPaused(false);
      }}
    >
      {children}
    </div>
  );
}
