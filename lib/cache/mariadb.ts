import mysql from "mysql2/promise";
import { AggregatedRiskReport, FlightDetails } from "@/lib/types";

// Create the connection pool
let pool: mysql.Pool | null = null;
let initialized = false;

async function getPool(): Promise<mysql.Pool> {
    if (pool) return pool;

    const uri = process.env.MARIADB_URI;
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

    if (!uri || uri === "your_mariadb_connection_string_here") {
        if (isBuildPhase) {
            console.warn("MARIADB_URI (cache) is not available during build phase.");
            return null as any;
        }
        console.error("MARIADB_URI (cache) check failed. Value:", uri ? (uri.substring(0, 10) + "...") : "undefined/empty");
        throw new Error("MARIADB_URI is not configured");
    }

    // Strip quotes
    const cleanUri = uri.startsWith('"') && uri.endsWith('"') ? uri.slice(1, -1) : uri;

    // Create pool
    pool = mysql.createPool(cleanUri);
    return pool;
}

// Ensure the tables and indexes exist
async function initializeDatabase() {
    if (initialized) return;

    const p = await getPool();
    if (!p) {
        console.warn("Skipping database initialization: MariaDB pool not available.");
        return;
    }

    try {
        await p.execute(`
      CREATE TABLE IF NOT EXISTS risk_reports (
        cache_key VARCHAR(255) PRIMARY KEY,
        report_json JSON NOT NULL,
        created_at DATETIME NOT NULL
      )
    `);

        await p.execute(`
      CREATE TABLE IF NOT EXISTS flight_cache (
        query_key VARCHAR(255) PRIMARY KEY,
        flight_json JSON NOT NULL,
        created_at DATETIME NOT NULL
      )
    `);

        await p.execute(`
      CREATE INDEX IF NOT EXISTS idx_risk_reports_created_at ON risk_reports(created_at)
    `);

        await p.execute(`
      CREATE INDEX IF NOT EXISTS idx_flight_cache_created_at ON flight_cache(created_at)
    `);

        initialized = true;
    } catch (err) {
        console.error("MariaDB Initialization Error:", err);
    }
}

// ---------------------------------------------------------
// Risk Report Cache (Full Aggregated Data)
// ---------------------------------------------------------

export async function getRiskReport(cacheKey: string): Promise<AggregatedRiskReport | null> {
    await initializeDatabase();
    const p = await getPool();

    try {
        const [rows]: any = await p.execute(
            "SELECT report_json FROM risk_reports WHERE cache_key = ?",
            [cacheKey]
        );

        if (!rows || rows.length === 0) return null;

        // MariaDB/MySQL2 automatically parses JSON columns, but just in case it's stringified
        const data = rows[0].report_json;
        return typeof data === 'string' ? JSON.parse(data) : data as AggregatedRiskReport;
    } catch (err) {
        console.error("MariaDB getRiskReport error:", err);
        return null;
    }
}

export async function setRiskReport(cacheKey: string, report: AggregatedRiskReport): Promise<void> {
    await initializeDatabase();
    const p = await getPool();

    try {
        await p.execute(
            `INSERT INTO risk_reports (cache_key, report_json, created_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       report_json = VALUES(report_json), 
       created_at = VALUES(created_at)`,
            [cacheKey, JSON.stringify(report)]
        );
    } catch (err) {
        console.error("MariaDB setRiskReport error:", err);
    }
}

// ---------------------------------------------------------
// Permanent Flight Search Cache (AviationStack results)
// ---------------------------------------------------------

export async function getPersistentFlight(queryKey: string): Promise<FlightDetails | null> {
    await initializeDatabase();
    const p = await getPool();

    try {
        const [rows]: any = await p.execute(
            "SELECT flight_json FROM flight_cache WHERE query_key = ?",
            [queryKey]
        );

        if (!rows || rows.length === 0) return null;

        // Auto parsed JSON
        const data = rows[0].flight_json;
        return typeof data === 'string' ? JSON.parse(data) : data as FlightDetails;
    } catch (err) {
        console.error("MariaDB getPersistentFlight error:", err);
        return null;
    }
}

export async function setPersistentFlight(queryKey: string, flight: FlightDetails): Promise<void> {
    await initializeDatabase();
    const p = await getPool();

    try {
        await p.execute(
            `INSERT INTO flight_cache (query_key, flight_json, created_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       flight_json = VALUES(flight_json), 
       created_at = VALUES(created_at)`,
            [queryKey, JSON.stringify(flight)]
        );
    } catch (err) {
        console.error("MariaDB setPersistentFlight error:", err);
    }
}

export async function cleanupOldReports(days = 30): Promise<void> {
    await initializeDatabase();
    const p = await getPool();

    try {
        await p.execute(
            `DELETE FROM risk_reports WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [days]
        );
    } catch (err) {
        console.error("MariaDB cleanupOldReports error:", err);
    }
}
