import type { RiskBand, ThreatLevel } from "@/lib/types";

/**
 * Get CSS class name for a risk band color
 */
export function getRiskBandColor(riskBand: RiskBand): string {
  const colorMap: Record<RiskBand, string> = {
    LOW: "var(--color-risk-low)",
    MEDIUM: "var(--color-risk-medium)",
    HIGH: "var(--color-risk-high)",
    CRITICAL: "var(--color-risk-critical)",
  };
  return colorMap[riskBand];
}

/**
 * Get CSS class name for a risk band
 */
export function getRiskBandClass(riskBand: RiskBand): string {
  const classMap: Record<RiskBand, string> = {
    LOW: "risk-low",
    MEDIUM: "risk-medium",
    HIGH: "risk-high",
    CRITICAL: "risk-critical",
  };
  return classMap[riskBand];
}

/**
 * Get threat level color
 */
export function getThreatLevelColor(threatLevel: ThreatLevel): string {
  const colorMap: Record<ThreatLevel, string> = {
    NONE: "var(--color-risk-low)",
    LOW: "var(--color-risk-low)",
    MEDIUM: "var(--color-risk-medium)",
    HIGH: "var(--color-risk-high)",
  };
  return colorMap[threatLevel];
}

/**
 * Get risk band display label with icon
 */
export function getRiskBandLabel(riskBand: RiskBand): string {
  const labelMap: Record<RiskBand, string> = {
    LOW: "✓ LOW",
    MEDIUM: "⚠ MEDIUM",
    HIGH: "⚠ HIGH",
    CRITICAL: "✕ CRITICAL",
  };
  return labelMap[riskBand];
}

/**
 * Format ISO date string to readable display format
 * @example "2025-03-09T14:30:00Z" -> "14:30 (UTC)"
 */
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes} (UTC)`;
  } catch {
    return isoString;
  }
}

/**
 * Format ISO date string to date only
 * @example "2025-03-09T14:30:00Z" -> "09 Mar 2025"
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

/**
 * Calculate flight duration from two ISO strings
 * @example ("2025-03-09T14:30:00Z", "2025-03-10T02:00:00Z") -> "11h 30m"
 */
export function formatDuration(departureISO: string, arrivalISO: string): string {
  try {
    const departure = new Date(departureISO);
    const arrival = new Date(arrivalISO);
    const diffMs = arrival.getTime() - departure.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  } catch {
    return "N/A";
  }
}

/**
 * Get relative time ago string
 * @example new Date(timestamp) from 5 minutes ago -> "5m ago"
 */
export function getTimeAgo(timestamp: string): string {
  try {
    const now = new Date();
    const then = new Date(timestamp);
    const diffSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffSeconds < 60) return "just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w ago`;
  } catch {
    return timestamp;
  }
}
