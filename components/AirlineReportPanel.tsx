"use client";

import type { AirlineProfile } from "@/lib/types";

interface AirlineReportPanelProps {
  airline: AirlineProfile;
}

function RiskBadge({ band }: { band: string }) {
  return <span className={`risk-badge risk-${band.toLowerCase()}`}>{band}</span>;
}

export function AirlineReportPanel({ airline }: AirlineReportPanelProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-title-icon">🏢</span>
          Airline Profile
        </div>
        <RiskBadge band={airline.riskBand} />
      </div>

      <div className="info-row">
        <span className="info-label">Airline</span>
        <span className="info-value">{airline.name}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Code</span>
        <span className="info-value mono">{airline.code}</span>
      </div>

      <div className="stat-grid">
        <div className="stat-item">
          <div className="stat-label">Safety Rank</div>
          <div className="stat-value">#{airline.safetyRank}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Fleet Age</div>
          <div className="stat-value">{airline.averageFleetAgeYears}</div>
          <div className="stat-unit">years</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Incidents</div>
          <div className="stat-value">{airline.incidentsLast10Y}</div>
          <div className="stat-unit">last 10y</div>
        </div>
      </div>

      <div className="section-title">Certifications</div>
      <div className="info-row">
        <span className="info-label">IOSA Certified</span>
        <span className={`cert-badge ${airline.iosa ? "positive" : "negative"}`}>
          {airline.iosa ? "✓ Yes" : "✗ No"}
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">EU Flight Ban</span>
        <span className={`cert-badge ${airline.bannedInEU ? "negative" : "positive"}`}>
          {airline.bannedInEU ? "✗ Banned" : "✓ Approved"}
        </span>
      </div>
    </div>
  );
}
