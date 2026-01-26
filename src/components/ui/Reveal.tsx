"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/cn";

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [lowPerf, setLowPerf] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    try {
      const mq = window.matchMedia("(max-width: 640px)");
      const update = () => {
        const saveData = typeof navigator !== "undefined" && (navigator as any)?.connection?.saveData;
        setLowPerf(Boolean(mq.matches || saveData));
      };
      update();
      mq.addEventListener?.("change", update);
      return () => mq.removeEventListener?.("change", update);
    } catch {
      setLowPerf(false);
    }
  }, [mounted]);

  const animate = mounted && !reduce && !lowPerf;

  if (!animate) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
