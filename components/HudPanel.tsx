"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface HudPanelProps {
  children: ReactNode;
  className?: string;
  hexId?: string;
  label?: string;
  delay?: number;
}

export function HudPanel({ 
  children, 
  className = "", 
  hexId = "0x7A91", 
  label = "SYS-A12", 
  delay = 0 
}: HudPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={`hud-panel crosshair-corners glow-blue relative p-4 ${className}`}
    >
      {/* Top decoration bar */}
      <div className="absolute top-0 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-electric/30" />
          <span className="font-mono-label text-[9px] text-electric/50 tracking-widest uppercase">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono-data text-[8px] text-neon/40">{hexId}</span>
          <div className="h-px w-6 bg-electric/30" />
        </div>
      </div>

      {/* Bottom barcode decoration */}
      <div className="absolute bottom-1 left-4 flex gap-[2px]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-electric/10" style={{ width: i % 3 === 0 ? 3 : 1, height: 6 }} />
        ))}
      </div>

      <div className="mt-3">{children}</div>
    </motion.div>
  );
}
