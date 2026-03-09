import Database from "better-sqlite3";
import path from "node:path";
import { AggregatedRiskReport, FlightDetails } from "@/lib/types";

const dbPath = path.join(process.cwd(), "skysafe.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS risk_reports (
    cache_key TEXT PRIMARY KEY,
    report_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS flight_cache (
    query_key TEXT PRIMARY KEY,
    flight_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_risk_reports_created_at ON risk_reports(created_at);
  CREATE INDEX IF NOT EXISTS idx_flight_cache_created_at ON flight_cache(created_at);
`);

// Risk Report Cache (Full Aggregated Data)
export function getRiskReport(cacheKey: string): AggregatedRiskReport | null {
  const row = db
    .prepare("SELECT report_json FROM risk_reports WHERE cache_key = ?")
    .get(cacheKey) as { report_json: string } | undefined;

  if (!row) return null;
  return JSON.parse(row.report_json) as AggregatedRiskReport;
}

export function setRiskReport(cacheKey: string, report: AggregatedRiskReport): void {
  db.prepare(
    `INSERT INTO risk_reports(cache_key, report_json, created_at)
     VALUES (@cache_key, @report_json, @created_at)
     ON CONFLICT(cache_key)
     DO UPDATE SET report_json = excluded.report_json, created_at = excluded.created_at`
  ).run({
    cache_key: cacheKey,
    report_json: JSON.stringify(report),
    created_at: new Date().toISOString()
  });
}

// Permanent Flight Search Cache (AviationStack results)
export function getPersistentFlight(queryKey: string): FlightDetails | null {
  const row = db
    .prepare("SELECT flight_json FROM flight_cache WHERE query_key = ?")
    .get(queryKey) as { flight_json: string } | undefined;

  if (!row) return null;
  return JSON.parse(row.flight_json) as FlightDetails;
}

export function setPersistentFlight(queryKey: string, flight: FlightDetails): void {
  db.prepare(
    `INSERT INTO flight_cache(query_key, flight_json, created_at)
     VALUES (@query_key, @flight_json, @created_at)
     ON CONFLICT(query_key)
     DO UPDATE SET flight_json = excluded.flight_json, created_at = excluded.created_at`
  ).run({
    query_key: queryKey,
    flight_json: JSON.stringify(flight),
    created_at: new Date().toISOString()
  });
}

export function cleanupOldReports(days = 30): void {
  db.prepare(
    `DELETE FROM risk_reports
     WHERE datetime(created_at) < datetime('now', ?)`
  ).run(`-${days} days`);
}
