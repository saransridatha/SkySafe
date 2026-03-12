"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface RiskGaugeProps {
  score?: number;
  label?: string;
}

export function RiskGauge({ score: targetScore = 6.8, label = "MODERATE RISK" }: RiskGaugeProps) {
  const [score, setScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setScore(targetScore), 500);
    return () => clearTimeout(timer);
  }, [targetScore]);

  const circumference = 2 * Math.PI * 70;
  const progress = (score / 10) * circumference;

  // Determine color based on score
  const color = score > 7 ? "hsl(348 100% 58%)" : score > 5 ? "hsl(30 100% 64%)" : "hsl(217 91% 60%)";
  const riskText = score > 7 ? "HIGH RISK" : score > 5 ? "MODERATE RISK" : "LOW RISK";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="180" height="180" viewBox="0 0 180 180" className="drop-shadow-lg">
        {/* Background ring segments */}
        {Array.from({ length: 40 }).map((_, i) => {
          const angle = (i * 9 - 135) * (Math.PI / 180);
          const x1 = 90 + 75 * Math.cos(angle);
          const y1 = 90 + 75 * Math.sin(angle);
          const x2 = 90 + 82 * Math.cos(angle);
          const y2 = 90 + 82 * Math.sin(angle);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(217 91% 60%)" strokeOpacity={0.15} strokeWidth={1} />
          );
        })}

        {/* Track */}
        <circle cx="90" cy="90" r="70" fill="none" stroke="hsl(217 40% 20%)" strokeWidth="4" strokeDasharray="4 4" />

        {/* Progress arc */}
        <motion.circle
          cx="90" cy="90" r="70"
          fill="none"
          strokeWidth="4"
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          transform="rotate(-90 90 90)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
          style={{
            stroke: color,
            filter: `drop-shadow(0 0 6px ${color.replace(")", " / 0.5)")})`,
          }}
        />

        {/* Center text */}
        <text x="90" y="78" textAnchor="middle" className="font-mono-data" fill="hsl(210 40% 85%)" fontSize="28" fontWeight="bold">
          <motion.tspan
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {score.toFixed(1)}
          </motion.tspan>
        </text>
        <text x="90" y="98" textAnchor="middle" className="font-mono-label" fill="hsl(215 20% 50%)" fontSize="9" letterSpacing="2">
          / 10.0
        </text>
        <text x="90" y="120" textAnchor="middle" className="font-mono-label" fill={color} fontSize="9" letterSpacing="3">
          {label || riskText}
        </text>
      </svg>

      <div className="flex items-center gap-2 mt-1">
        <div className="w-2 h-2 bg-warning pulse-glow" />
        <span className="font-mono-label text-[9px] text-warning tracking-widest">RISK LEVEL ELEVATED</span>
      </div>
    </div>
  );
}
