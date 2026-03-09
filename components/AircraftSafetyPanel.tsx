"use client";

import type { AircraftProfile } from "@/lib/types";

interface AircraftSafetyPanelProps {
  aircraft: AircraftProfile;
}

function RiskBadge({ band }: { band: string }) {
  return <span className={`risk-badge risk-${band.toLowerCase()}`}>{band}</span>;
}

export function AircraftSafetyPanel({ aircraft }: AircraftSafetyPanelProps) {
  const lossRateLabel =
    aircraft.hullLossRate === 0
      ? "Zero"
      : aircraft.hullLossRate < 0.005
        ? "Very Low"
        : aircraft.hullLossRate < 0.01
          ? "Low"
          : "Elevated";

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-title-icon">🛩️</span>
          Aircraft Safety
        </div>
        <RiskBadge band={aircraft.riskBand} />
      </div>

      <div className="info-row">
        <span className="info-label">Type</span>
        <span className="info-value mono">{aircraft.icaoType}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Name</span>
        <span className="info-value">{aircraft.displayName}</span>
      </div>

      <div className="stat-grid">
        <div className="stat-item">
          <div className="stat-label">Fleet Size</div>
          <div className="stat-value">{aircraft.fleetSize.toLocaleString()}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Avg Age</div>
          <div className="stat-value">{aircraft.averageFleetAgeYears}</div>
          <div className="stat-unit">years</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Hull Losses</div>
          <div className="stat-value">{aircraft.hullLosses}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Incidents</div>
          <div className="stat-value">{aircraft.incidents}</div>
        </div>
      </div>

      <div className="section-title">Safety Metrics</div>
      <div className="info-row">
        <span className="info-label">Hull Loss Rate</span>
        <span className="info-value" style={{ color: aircraft.hullLossRate === 0 ? "var(--green)" : "var(--text)" }}>
          {lossRateLabel}
        </span>
      </div>
    </div>
  );
}
