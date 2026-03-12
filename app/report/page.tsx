"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plane, Building2, AlertTriangle, MapPin, Clock, Shield, ArrowLeft } from "lucide-react";
import type { AggregatedRiskReport } from "@/lib/types";
import { HudPanel } from "@/components/HudPanel";
import { DataRow } from "@/components/DataRow";
import { RiskGauge } from "@/components/RiskGauge";
import { FlightPathMap } from "@/components/FlightPathMap";

const bootDelay = (i: number) => 0.3 + i * 0.2;

function makeStableCode(seed: string, length: number) {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return hash.toString(36).toUpperCase().padStart(length, "0").slice(0, length);
}

function LoadingSkeleton() {
    return (
        <div className="min-h-screen micro-grid pt-16 pb-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-12 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="col-span-12 md:col-span-4">
                            <div className="hud-panel p-4 animate-pulse">
                                <div className="h-4 bg-electric/10 rounded w-3/4 mb-3" />
                                <div className="h-3 bg-electric/10 rounded w-1/2 mb-2" />
                                <div className="h-3 bg-electric/10 rounded w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ReportContent() {
    const searchParams = useSearchParams();
    const flightQuery = searchParams.get("flight") || "";

    const [report, setReport] = useState<AggregatedRiskReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const reportRef = `SKS-${makeStableCode(`${flightQuery}:report`, 4)}`;
    const sessionRef = `SKS-${makeStableCode(`${flightQuery}:session`, 8)}`;
    const generatedDate = report ? new Date(report.generatedAt).toISOString().split("T")[0] : "PENDING";

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
            <div className="min-h-screen micro-grid pt-16 pb-8 px-4 flex items-center justify-center">
                <HudPanel hexId="0xERR0" label="SYS-ERR" className="max-w-md">
                    <AlertTriangle className="w-8 h-8 text-warning mb-4" />
                    <h2 className="font-heading text-lg font-bold text-foreground tracking-wider mb-2">NO FLIGHT SPECIFIED</h2>
                    <p className="font-mono-label text-xs text-muted-foreground mb-4">
                        Use the search bar or go to the{" "}
                        <Link href="/" className="text-electric hover:text-neon transition-colors">command interface</Link>
                        {" "}to search for a flight.
                    </p>
                </HudPanel>
            </div>
        );
    }

    return (
        <div className="min-h-screen micro-grid pt-16 pb-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-muted-foreground hover:text-electric transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <Plane className="w-5 h-5 text-electric" />
                        <div>
                            <h1 className="font-heading text-lg font-bold text-foreground tracking-wider">
                                FLIGHT {flightQuery.toUpperCase()} — RISK REPORT
                            </h1>
                            <p className="font-mono-label text-[9px] text-muted-foreground tracking-widest mt-0.5">
                                {report ? `${report.flight.origin} → ${report.flight.destination}` : "LOADING..."} • 
                                GENERATED {generatedDate} • 
                                REF: {reportRef}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="font-mono-data text-[9px] text-muted-foreground">
                            {isLoading ? "ANALYZING..." : report ? `GENERATED: ${new Date(report.generatedAt).toLocaleTimeString()}` : ""}
                        </span>
                    </div>
                </motion.div>

                {/* Error State */}
                {error && (
                    <HudPanel hexId="0xERR1" label="SYS-ERR" className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            <span className="font-heading text-xs font-bold text-destructive tracking-wider">ANALYSIS FAILED</span>
                        </div>
                        <p className="font-mono-data text-xs text-muted-foreground mb-4">{error}</p>
                        <button
                            onClick={() => fetchReport(flightQuery)}
                            className="font-mono-label text-[10px] text-electric border border-electric/40 px-4 py-2 hover:bg-electric/10 transition-colors tracking-wider"
                        >
                            RETRY ANALYSIS
                        </button>
                    </HudPanel>
                )}

                {/* Loading State */}
                {isLoading && <LoadingSkeleton />}

                {/* Results */}
                {!isLoading && report && (
                    <>
                        {/* Main Grid */}
                        <div className="grid grid-cols-12 gap-3">
                            {/* Risk Score - Center */}
                            <div className="col-span-12 md:col-span-4 md:col-start-5">
                                <HudPanel hexId="0xRISK" label="RISK-CORE" delay={bootDelay(0)}>
                                    <RiskGauge 
                                        score={report.riskScore.score} 
                                        label={report.riskScore.score > 7 ? "HIGH RISK" : report.riskScore.score > 5 ? "MODERATE RISK" : "LOW RISK"}
                                    />
                                    <p className="font-mono-label text-[9px] text-muted-foreground text-center mt-3 leading-relaxed">
                                        {report.riskScore.explanation.length > 150 ? `${report.riskScore.explanation.substring(0, 150)}...` : report.riskScore.explanation}
                                    </p>
                                </HudPanel>
                            </div>

                            {/* Flight Panel */}
                            <div className="col-span-12 md:col-span-4 md:col-start-1 md:row-start-1">
                                <HudPanel hexId="0xF101" label="FLT-DAT" delay={bootDelay(1)}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Plane className="w-4 h-4 text-neon" />
                                        <span className="font-heading text-xs font-bold text-foreground tracking-wider">FLIGHT DATA</span>
                                    </div>
                                    <DataRow label="Flight" value={report.flight.flightNumber} highlight />
                                    <DataRow label="Route" value={`${report.flight.origin} → ${report.flight.destination}`} />
                                    <DataRow label="Aircraft" value={report.flight.aircraftType} />
                                    <DataRow label="Airline" value={report.flight.airlineName} />
                                    <DataRow label="Status" value="SCHEDULED" highlight />
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="h-1 flex-1 bg-electric/30" />
                                        <span className="font-mono-data text-[8px] text-electric/40">
                                            WAYPOINTS: {report.flight.waypoints.length}
                                        </span>
                                    </div>
                                </HudPanel>
                            </div>

                            {/* Aircraft Panel */}
                            <div className="col-span-12 md:col-span-4 md:col-start-9 md:row-start-1">
                                <HudPanel hexId="0xAC77" label="ACF-INT" delay={bootDelay(2)}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 className="w-4 h-4 text-neon" />
                                        <span className="font-heading text-xs font-bold text-foreground tracking-wider">AIRCRAFT INTEL</span>
                                    </div>
                                    <DataRow label="Type" value={report.aircraft.displayName} />
                                    <DataRow label="Hull Loss Rate" value={`${report.aircraft.hullLossRate.toFixed(3)} / 1M`} />
                                    <DataRow label="Fleet Size" value={report.aircraft.fleetSize} />
                                    <DataRow label="Incidents" value={report.aircraft.incidents} />
                                    <DataRow label="Risk Band" value={report.aircraft.riskBand} highlight />
                                </HudPanel>
                            </div>

                            {/* Airline Panel */}
                            <div className="col-span-12 md:col-span-4">
                                <HudPanel hexId="0xAL09" label="ARL-SAF" delay={bootDelay(3)}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Shield className="w-4 h-4 text-neon" />
                                        <span className="font-heading text-xs font-bold text-foreground tracking-wider">AIRLINE SAFETY</span>
                                    </div>
                                    <DataRow label="Airline" value={report.airline.name} />
                                    <DataRow label="Safety Rank" value={`#${report.airline.safetyRank}`} highlight />
                                    <DataRow label="IOSA Certified" value={report.airline.iosa ? "YES" : "NO"} highlight={report.airline.iosa} />
                                    <DataRow label="Incidents (10y)" value={report.airline.incidentsLast10Y} />
                                    <DataRow label="EU Ban Status" value={report.airline.bannedInEU ? "BANNED" : "NOT BANNED"} />
                                    <div className="mt-3 flex items-center gap-1">
                                        {Array.from({ length: 7 }).map((_, i) => {
                                            const filledBars = Math.max(0, 7 - Math.floor((report.airline.safetyRank - 1) / 8));
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`h-2 flex-1 ${i < filledBars ? 'bg-electric' : 'bg-electric/20'}`} 
                                                    style={{ opacity: 0.3 + i * 0.1 }} 
                                                />
                                            );
                                        })}
                                    </div>
                                    <span className="font-mono-label text-[8px] text-electric/50 mt-1 block text-right">
                                        RANK: #{report.airline.safetyRank}
                                    </span>
                                </HudPanel>
                            </div>

                            {/* Threat Panel */}
                            <div className="col-span-12 md:col-span-4">
                                <HudPanel hexId="0xTH42" label="THR-INT" delay={bootDelay(4)}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle className="w-4 h-4 text-warning" />
                                        <span className="font-heading text-xs font-bold text-warning tracking-wider">THREAT INTELLIGENCE</span>
                                    </div>
                                    {report.news.results.length > 0 ? (
                                        <>
                                            <div className="border border-warning/20 bg-warning/5 p-3 mb-3">
                                                <p className="font-mono-data text-[10px] text-warning leading-relaxed">
                                                    &quot;{report.news.results[0]?.headlines[0]?.title || 'Monitoring active threats in route corridor'}&quot;
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="font-mono-label text-[8px] text-muted-foreground">SRC: NEWS-FEED</span>
                                                    <span className="font-mono-label text-[8px] text-muted-foreground">
                                                        LEVEL: {report.news.results[0]?.threatLevel || 'LOW'}
                                                    </span>
                                                </div>
                                            </div>
                                            <DataRow label="Countries Scanned" value={report.news.results.length} />
                                            <DataRow label="Active Alerts" value={report.news.results.reduce((acc, r) => acc + r.headlines.length, 0)} />
                                        </>
                                    ) : (
                                        <p className="font-mono-label text-[10px] text-muted-foreground">No active threats detected in route corridor.</p>
                                    )}
                                </HudPanel>
                            </div>

                            {/* Map Panel */}
                            <div className="col-span-12 md:col-span-4">
                                <HudPanel hexId="0xRAD1" label="ARS-MAP" delay={bootDelay(5)}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="w-4 h-4 text-neon" />
                                        <span className="font-heading text-xs font-bold text-foreground tracking-wider">ROUTE PREVIEW</span>
                                    </div>
                                    <DataRow label="Path Segments" value={report.pathAnalysis.segments.length} />
                                    <DataRow label="Risk Zones" value={report.pathAnalysis.segments.filter(s => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL').length} />
                                    <DataRow label="Conflict Zones" value={report.pathAnalysis.conflictZones.length} />
                                </HudPanel>
                            </div>
                        </div>

                        {/* Full-width Map */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.5, duration: 0.5 }}
                            className="mt-4"
                        >
                            <HudPanel hexId="0xMAP1" label="GEO-VIS" className="p-0 overflow-hidden">
                                <div className="h-[400px]">
                                    <FlightPathMap
                                        pathAnalysis={report.pathAnalysis}
                                        waypoints={report.flight.waypoints}
                                    />
                                </div>
                            </HudPanel>
                        </motion.div>

                        {/* Bottom telemetry bar */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2 }}
                            className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 font-mono-data text-[8px] text-muted-foreground"
                        >
                            <span>SESSION: {sessionRef}</span>
                            <span>ENCRYPTION: AES-256-GCM</span>
                            <span>CLASSIFICATION: UNCLASSIFIED // FOUO</span>
                            <span>NODE: {report.generatedAt ? 'EU-WEST-2' : 'PENDING'}</span>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function ReportPage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <ReportContent />
        </Suspense>
    );
}
