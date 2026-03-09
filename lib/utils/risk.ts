import { RiskBand, ThreatLevel } from "@/lib/types";

const rank: Record<RiskBand, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

export function maxRisk(a: RiskBand, b: RiskBand): RiskBand {
  return rank[a] >= rank[b] ? a : b;
}

export function riskBandFromWeight(weight: number): RiskBand {
  if (weight >= 4) return "CRITICAL";
  if (weight >= 3) return "HIGH";
  if (weight >= 2) return "MEDIUM";
  return "LOW";
}

export function threatFromKeywords(count: number): ThreatLevel {
  if (count >= 4) return "HIGH";
  if (count >= 2) return "MEDIUM";
  if (count >= 1) return "LOW";
  return "NONE";
}
