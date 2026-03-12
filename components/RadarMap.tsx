"use client";

export function RadarMap() {
  return (
    <div className="relative w-full aspect-square max-w-[240px] mx-auto">
      {/* Concentric rings */}
      {[1, 0.75, 0.5, 0.25].map((s, i) => (
        <div
          key={i}
          className="absolute border border-electric/10 rounded-full"
          style={{
            width: `${s * 100}%`,
            height: `${s * 100}%`,
            top: `${(1 - s) * 50}%`,
            left: `${(1 - s) * 50}%`,
          }}
        />
      ))}

      {/* Crosshair lines */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-electric/10" />
      <div className="absolute left-0 right-0 top-1/2 h-px bg-electric/10" />

      {/* Sweep */}
      <div className="absolute inset-0 rounded-full radar-sweep" />

      {/* Blips */}
      {[
        { top: "30%", left: "60%", size: 4 },
        { top: "55%", left: "35%", size: 3 },
        { top: "40%", left: "70%", size: 5 },
        { top: "65%", left: "55%", size: 3 },
      ].map((blip, i) => (
        <div
          key={i}
          className="absolute bg-neon pulse-glow rounded-full"
          style={{ top: blip.top, left: blip.left, width: blip.size, height: blip.size }}
        />
      ))}

      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-electric rounded-full" />

      {/* Labels */}
      <span className="absolute top-1 left-1/2 -translate-x-1/2 font-mono-label text-[7px] text-muted-foreground">N</span>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono-label text-[7px] text-muted-foreground">S</span>
      <span className="absolute left-1 top-1/2 -translate-y-1/2 font-mono-label text-[7px] text-muted-foreground">W</span>
      <span className="absolute right-1 top-1/2 -translate-y-1/2 font-mono-label text-[7px] text-muted-foreground">E</span>
    </div>
  );
}
