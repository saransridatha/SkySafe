"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function TerminalInput() {
  const [value, setValue] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      router.push(`/report?flight=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleQuickSearch = (query: string) => {
    setValue(query);
    router.push(`/report?flight=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
      <div className="hud-panel glow-cyan flex items-center gap-3 px-4 py-3">
        <span className="font-mono-data text-neon text-sm">{">"}</span>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ENTER FLIGHT OR ROUTE CODE..."
            className="flex-1 bg-transparent border-none outline-none font-mono-data text-sm text-foreground placeholder:text-muted-foreground tracking-wider"
          />
        <span className="w-2 h-5 bg-neon/80 cursor-blink" />
        <button type="submit" className="ml-2">
          <Search className="w-4 h-4 text-electric hover:text-neon transition-colors" />
        </button>
      </div>
      <div className="mt-1 flex items-center gap-2 px-4">
        <span className="font-mono-label text-[8px] text-muted-foreground">TRY:</span>
          {["AI 101", "DEL-LHR", "BA 286"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleQuickSearch(s)}
            className="font-mono-data text-[9px] text-electric/60 hover:text-electric border border-electric/20 px-2 py-0.5 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </form>
  );
}
