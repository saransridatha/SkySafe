"use client";

import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
}

export function AnimatedNumber({ 
  value, 
  duration = 1500, 
  decimals = 0, 
  prefix = "", 
  suffix = "", 
  delay = 0 
}: AnimatedNumberProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(eased * value);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timeout);
  }, [value, duration, delay]);

  return (
    <span className="font-mono-data tabular-nums">
      {prefix}{current.toFixed(decimals)}{suffix}
    </span>
  );
}
