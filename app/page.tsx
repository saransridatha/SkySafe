"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { TacticalGlobe } from "@/components/TacticalGlobe";
import { TerminalInput } from "@/components/TerminalInput";
import { CapabilityPanels } from "@/components/CapabilityPanels";

export default function HomePage() {
  return (
    <div className="min-h-screen micro-grid pt-12">
      {/* Hero */}
      <section className="relative h-[85vh] flex flex-col items-center justify-center overflow-hidden">
        <TacticalGlobe />

        <div className="relative z-10 flex flex-col items-center gap-8 px-4">
          {/* Decorative top line */}
          <div className="flex items-center gap-3">
            <div className="h-px w-16 bg-electric/30" />
            <span className="font-mono-label text-[8px] text-muted-foreground tracking-[0.4em]">SKYSAFE COMMAND INTERFACE</span>
            <div className="h-px w-16 bg-electric/30" />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-heading text-3xl md:text-5xl font-bold text-foreground tracking-[0.1em] text-center text-glow-blue"
          >
            GLOBAL AVIATION
            <br />
            <span className="text-electric">RISK INTELLIGENCE</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="font-mono-label text-xs text-muted-foreground text-center max-w-md tracking-wider"
          >
            REAL-TIME THREAT DETECTION • SAFETY ANALYTICS • PREDICTIVE RISK MODELING
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="w-full max-w-xl"
          >
            <TerminalInput />
          </motion.div>

          {/* Status ticker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap items-center justify-center gap-3 text-center font-mono-data text-[9px] text-muted-foreground md:gap-6"
          >
            <span>FLIGHTS TRACKED: <span className="text-electric">142,847</span></span>
            <span className="text-border">|</span>
            <span>THREATS ACTIVE: <span className="text-warning">23</span></span>
            <span className="text-border">|</span>
            <span>LAST SCAN: <span className="text-neon">00:04:12 AGO</span></span>
          </motion.div>
        </div>
      </section>

      {/* Capabilities */}
      <CapabilityPanels />

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span className="font-mono-label text-[9px] text-muted-foreground tracking-widest">© 2026 SKYSAFE SYSTEMS</span>
          <div className="flex flex-wrap gap-4 font-mono-label text-[8px] text-muted-foreground tracking-wider md:gap-6">
            <Link href="/explore" className="hover:text-electric transition-colors">EXPLORE DATA</Link>
            <Link href="/about" className="hover:text-electric transition-colors">METHODOLOGY</Link>
            <span>BUILD: 4.2.1-RC3</span>
            <span>CLASSIFICATION: UNCLASSIFIED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
