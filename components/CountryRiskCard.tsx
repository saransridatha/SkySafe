"use client";

import type { NewsIntelligence } from "@/lib/types";

interface CountryRiskCardProps {
  countryData: NewsIntelligence["results"][number];
}

const COUNTRY_FLAGS: Record<string, string> = {
  IN: "🇮🇳", PK: "🇵🇰", AF: "🇦🇫", IR: "🇮🇷", TR: "🇹🇷", UA: "🇺🇦",
  SY: "🇸🇾", IQ: "🇮🇶", YE: "🇾🇪", SO: "🇸🇴", SD: "🇸🇩", DE: "🇩🇪",
  GB: "🇬🇧", FR: "🇫🇷", US: "🇺🇸", CA: "🇨🇦", RU: "🇷🇺", FI: "🇫🇮",
  SE: "🇸🇪", NO: "🇳🇴",
};

function ThreatBadge({ level }: { level: string }) {
  const cls =
    level === "HIGH" ? "risk-high" :
      level === "MEDIUM" ? "risk-medium" :
        level === "LOW" ? "risk-low" :
          "risk-low";
  if (level === "NONE") {
    return <span className="risk-badge risk-low" style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}>NONE</span>;
  }
  return <span className={`risk-badge ${cls}`}>{level}</span>;
}

export function CountryRiskCard({ countryData }: CountryRiskCardProps) {
  const flag = COUNTRY_FLAGS[countryData.country] || "🏳️";
  const relativeTime = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const hours = Math.floor(diff / 3600000);
      if (hours < 1) return "just now";
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    } catch { return ""; }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span>{flag}</span>
          {countryData.country}
        </div>
        <ThreatBadge level={countryData.threatLevel} />
      </div>

      {countryData.threatKeywords.length > 0 && (
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
          Keywords: {countryData.threatKeywords.join(", ")}
        </div>
      )}

      {countryData.headlines.length > 0 && (
        <div>
          {countryData.headlines.slice(0, 3).map((h, i) => (
            <div key={i} className="headline-item">
              <a
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                className="headline-title"
              >
                {h.title}
              </a>
              <div className="headline-meta">
                {h.source} · {relativeTime(h.publishedAt)}
              </div>
            </div>
          ))}
        </div>
      )}
      {countryData.headlines.length === 0 && (
        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          No recent security-relevant headlines.
        </div>
      )}
    </div>
  );
}
