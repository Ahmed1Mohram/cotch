"use client";

import { motion } from "framer-motion";

export function WatermarkOverlay({
  name,
  phone,
}: {
  name: string;
  phone: string;
}) {
  const text = `${name} • ${phone}`;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <motion.div
        initial={{ x: "-20%", y: "20%" }}
        animate={{ x: "120%", y: "-30%" }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 top-0 whitespace-nowrap rounded-xl bg-black/20 px-4 py-2 text-xs font-heading uppercase tracking-[0.18em] text-white/40 backdrop-blur-sm"
      >
        {text}
      </motion.div>

      <motion.div
        initial={{ x: "110%", y: "70%" }}
        animate={{ x: "-30%", y: "10%" }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 top-0 whitespace-nowrap rounded-xl bg-black/20 px-4 py-2 text-xs font-heading uppercase tracking-[0.18em] text-white/35 backdrop-blur-sm"
      >
        {text}
      </motion.div>
    </motion.div>
  );
}
