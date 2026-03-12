"use client";

import { motion } from "framer-motion";
import { Radar, ShieldCheck, BrainCircuit } from "lucide-react";
import { HudPanel } from "./HudPanel";

const capabilities = [
  {
    icon: Radar,
    title: "REAL-TIME THREAT DETECTION",
    desc: "AI-powered geopolitical & meteorological risk scanning across 4,200+ global airspace sectors.",
    hexId: "0x3F2A",
    label: "MOD-THR",
  },
  {
    icon: ShieldCheck,
    title: "SAFETY INTELLIGENCE ENGINE",
    desc: "Aggregated airline & aircraft safety data from 47 regulatory authorities. Updated every 60 seconds.",
    hexId: "0x8B14",
    label: "MOD-SAF",
  },
  {
    icon: BrainCircuit,
    title: "PREDICTIVE RISK MODELING",
    desc: "Neural network risk scoring using 200+ dimensional feature vectors. 94.7% prediction accuracy.",
    hexId: "0xC7E9",
    label: "MOD-PRM",
  },
];

const variants = [
  { x: -60, y: 20 },
  { x: 0, y: 40 },
  { x: 60, y: 20 },
];

export function CapabilityPanels() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono-label text-[10px] text-muted-foreground tracking-[0.3em]">CAPABILITY MODULES</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.hexId}
              initial={{ opacity: 0, x: variants[i].x, y: variants[i].y }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <HudPanel hexId={cap.hexId} label={cap.label} delay={0}>
                <cap.icon className="w-6 h-6 text-neon mb-3" />
                <h3 className="font-heading text-xs font-bold text-foreground tracking-wider mb-2">{cap.title}</h3>
                <p className="font-mono-label text-[10px] text-muted-foreground leading-relaxed">{cap.desc}</p>
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <div key={j} className="h-1 flex-1 bg-electric/20" style={{ opacity: 0.2 + j * 0.1 }} />
                  ))}
                </div>
              </HudPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
