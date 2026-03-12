"use client";

interface DataRowProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export function DataRow({ label, value, highlight = false }: DataRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
      <span className="font-mono-label text-[10px] text-muted-foreground tracking-wider uppercase">{label}</span>
      <span className={`font-mono-data text-xs ${highlight ? "text-neon text-glow-cyan" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
