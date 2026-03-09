"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { AggregatedRiskReport } from "@/lib/types";
import { FlightSummaryCard } from "@/components/FlightSummaryCard";
import { AircraftSafetyPanel } from "@/components/AircraftSafetyPanel";
import { AirlineReportPanel } from "@/components/AirlineReportPanel";
import { GeminiRiskScoreWidget } from "@/components/GeminiRiskScoreWidget";
import { FlightPathMap } from "@/components/FlightPathMap";
import { CountryRiskCard } from "@/components/CountryRiskCard";

function ReportContent() {
    const searchParams = useSearchParams();
    const flightQuery = searchParams.get("flight") || "";

    const [report, setReport] = useState<AggregatedRiskReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = useCallback(async (query: string) => {
        if (!query) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/risk/report?flight=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Failed to fetch: ${response.statusText}`);
            }
            setReport(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (flightQuery) {
            fetchReport(flightQuery);
        }
    }, [flightQuery, fetchReport]);

    if (!flightQuery) {
        return (
            <div className="report-page">
                <div className="container">
                    <div className="error-state">
                        <div className="error-state-title">No flight specified</div>
                        <div className="error-state-message">
                            Use the search bar or go to the <Link href="/">homepage</Link> to search for a flight.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="report-page">
            <div className="container">
                {/* Header */}
                <div className="report-header">
                    <div className="report-header-inner">
                        <Link href="/" className="report-back">← Back</Link>
                        <h1 className="report-flight-title">
                            Flight <span className="mono">{flightQuery.toUpperCase()}</span>
                        </h1>
                    </div>
                    <div className="report-meta">
                        {isLoading
                            ? "Analyzing flight data..."
                            : report
                                ? `Report generated ${new Date(report.generatedAt).toLocaleString()}`
                                : ""}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="error-state">
                        <div className="error-state-title">Analysis Failed</div>
                        <div className="error-state-message">{error}</div>
                        <button
                            className="retry-button"
                            onClick={() => fetchReport(flightQuery)}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="loading-state">
                        <div className="loading-card">
                            <div className="skeleton skeleton-line" />
                            <div className="skeleton skeleton-line short" />
                            <div className="skeleton skeleton-line small" />
                        </div>
                        <div className="loading-card">
                            <div className="skeleton skeleton-block" />
                        </div>
                        <div className="loading-card">
                            <div className="skeleton skeleton-line" />
                            <div className="skeleton skeleton-line" />
                            <div className="skeleton skeleton-line short" />
                        </div>
                    </div>
                )}

                {/* Results */}
                {!isLoading && report && (
                    <>
                        {/* Top row: Flight + Aircraft + Airline in a grid */}
                        <div className="results-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                            <FlightSummaryCard flight={report.flight} />
                            <AircraftSafetyPanel aircraft={report.aircraft} />
                            <AirlineReportPanel airline={report.airline} />
                        </div>

                        {/* Gemini Score — full width */}
                        <div className="results-grid-full">
                            <GeminiRiskScoreWidget riskScore={report.riskScore} />
                        </div>

                        {/* Map — full width */}
                        <div className="results-grid-full" style={{ padding: 0, overflow: "hidden" }}>
                            <FlightPathMap
                                pathAnalysis={report.pathAnalysis}
                                waypoints={report.flight.waypoints}
                            />
                        </div>

                        {/* Country cards */}
                        {report.news.results.length > 0 && (
                            <>
                                <h3 style={{ margin: "1.5rem 0 0.75rem", fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
                                    Route Intelligence by Country
                                </h3>
                                <div className="country-cards-row">
                                    {report.news.results.map((countryData) => (
                                        <CountryRiskCard key={countryData.country} countryData={countryData} />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function ReportPage() {
    return (
        <Suspense fallback={
            <div className="report-page">
                <div className="container">
                    <div className="loading-state">
                        <div className="loading-card">
                            <div className="skeleton skeleton-line" />
                            <div className="skeleton skeleton-line short" />
                        </div>
                    </div>
                </div>
            </div>
        }>
            <ReportContent />
        </Suspense>
    );
}
