"use client";

import type { RiskScore } from "@/lib/types";

interface GeminiRiskScoreWidgetProps {
  riskScore: RiskScore;
}

function scoreColor(score: number): string {
  if (score <= 3) return "var(--green)";
  if (score <= 5) return "var(--yellow)";
  if (score <= 7) return "var(--orange)";
  return "var(--red)";
}

function scoreLabel(score: number): string {
  if (score <= 2) return "VERY LOW RISK";
  if (score <= 4) return "LOW RISK";
  if (score <= 6) return "MODERATE RISK";
  if (score <= 8) return "HIGH RISK";
  return "CRITICAL RISK";
}

export function GeminiRiskScoreWidget({ riskScore }: GeminiRiskScoreWidgetProps) {
  const color = scoreColor(riskScore.score);
  const pct = (riskScore.score / 10) * 100;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-title-icon">⭐</span>
          AI Risk Assessment
        </div>
        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
          Powered by Gemini
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2rem", alignItems: "start" }}>
        {/* Score */}
        <div className="score-display">
          <div className="score-number" style={{ color }}>{riskScore.score.toFixed(1)}</div>
          <div className="score-label" style={{ color }}>{scoreLabel(riskScore.score)}</div>
        </div>

        {/* Details */}
        <div>
          <div className="score-bar-track">
            <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
          </div>

          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: "0.75rem 0" }}>
            {riskScore.explanation}
          </p>

          {riskScore.topRisks && riskScore.topRisks.length > 0 && (
            <>
              <div className="section-title" style={{ borderTop: "none", paddingTop: 0 }}>Key Risk Factors</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {riskScore.topRisks.map((risk, i) => (
                  <li key={i} style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", padding: "0.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    {risk}
                  </li>
                ))}
              </ul>
            </>
          )}

          {riskScore.confidence !== undefined && (
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
              Confidence: {(riskScore.confidence * 100).toFixed(0)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
