"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

const TacticalGlobeCanvas = dynamic(() => import("./TacticalGlobeCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 opacity-60 flex items-center justify-center">
      <div className="w-32 h-32 border border-electric/20 rounded-full animate-pulse" />
    </div>
  ),
});

class GlobeErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="absolute inset-0 opacity-30 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 rounded-full border border-electric/30 animate-pulse" />
            <div className="absolute inset-4 rounded-full border border-electric/20" style={{ animationDelay: "0.5s" }} />
            <div className="absolute inset-8 rounded-full border border-electric/15" />
            {/* Latitude lines */}
            {[20, 40, 60, 80, 100, 120, 140].map((top) => (
              <div key={top} className="absolute left-4 right-4 h-px bg-electric/10" style={{ top }} />
            ))}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function TacticalGlobe() {
  return (
    <GlobeErrorBoundary>
      <TacticalGlobeCanvas />
    </GlobeErrorBoundary>
  );
}
