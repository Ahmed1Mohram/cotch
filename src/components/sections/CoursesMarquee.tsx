"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRef, useState, useEffect } from "react";

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
  const [isMobile, setIsMobile] = useState(false);
  const pointerIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const scrollStartX = useRef<number>(0);
  const scrollLeft = useRef<number>(0);
  const isDown = useRef<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Enable momentum scrolling on mobile
  useEffect(() => {
    if (!isMobile || !containerRef.current) return;
    const container = containerRef.current;
    
    // Add smooth scrolling and momentum
    container.style.overflowX = "auto";
    container.style.scrollBehavior = "smooth";
    container.style.WebkitOverflowScrolling = "touch";
    container.style.scrollSnapType = "x proximity";
    
    // Prevent default scroll chaining
    container.addEventListener("touchstart", (e) => {
      if (container.scrollLeft === 0) {
        container.scrollLeft = 1;
      } else if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 1) {
        container.scrollLeft = container.scrollWidth - container.clientWidth - 1;
      }
    }, { passive: true });
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "courses-marquee",
        isMobile && "overflow-x-auto overscroll-x-contain scrollbar-hide",
        className
      )}
      style={{
        ...style,
        ...(isMobile && {
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x proximity",
        }),
      }}
      data-paused={paused ? "true" : "false"}
      data-mobile={isMobile ? "true" : "false"}
      onPointerDown={(e) => {
        pointerIdRef.current = e.pointerId;
        setPaused(true);
        
        if (isMobile && containerRef.current) {
          isDown.current = true;
          scrollStartX.current = e.pageX - containerRef.current.offsetLeft;
          scrollLeft.current = containerRef.current.scrollLeft;
        }
        
        try {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        } catch {}
      }}
      onPointerMove={(e) => {
        if (!isMobile || !isDown.current || !containerRef.current) return;
        e.preventDefault();
        const x = e.pageX - containerRef.current.offsetLeft;
        const walk = (x - scrollStartX.current) * 1.5; // Scroll speed multiplier
        containerRef.current.scrollLeft = scrollLeft.current - walk;
      }}
      onPointerUp={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        pointerIdRef.current = null;
        isDown.current = false;
        setPaused(false);
      }}
      onPointerCancel={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        pointerIdRef.current = null;
        isDown.current = false;
        setPaused(false);
      }}
      onPointerLeave={() => {
        pointerIdRef.current = null;
        isDown.current = false;
        setPaused(false);
      }}
    >
      <div
        ref={trackRef}
        className={cn(
          "courses-marquee-track",
          isMobile && "flex w-max gap-7"
        )}
      >
        {children}
      </div>
    </div>
  );
}
