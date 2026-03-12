"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Radar, Plane, Building2, ShieldAlert, Filter, ArrowUpDown } from "lucide-react";
import aircraftData from "@/data/aircraft_profiles.json";
import airlineData from "@/data/airline_profiles.json";

type AircraftRow = {
    icaoType: string;
    displayName: string;
    fleetSize: number;
    averageFleetAgeYears: number;
    incidents: number;
    hullLosses: number;
    riskBand: string;
};

type AirlineRow = {
    code: string;
    name: string;
    safetyRank: number;
    iosa: boolean;
    bannedInEU: boolean;
    incidentsLast10Y: number;
    averageFleetAgeYears: number;
    riskBand: string;
};

function RiskBadge({ band }: { band: string }) {
    const tone = {
        LOW: "border-neon/40 bg-neon/10 text-neon",
        MEDIUM: "border-warning/40 bg-warning/10 text-warning",
        HIGH: "border-destructive/40 bg-destructive/10 text-destructive",
    }[band] || "border-electric/30 bg-electric/10 text-electric";

    return (
        <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono-label text-[9px] tracking-widest ${tone}`}>
            {band}
        </span>
    );
}

export default function ExplorePage() {
    const [tab, setTab] = useState<"aircraft" | "airlines">("aircraft");
    const [query, setQuery] = useState("");
    const [riskFilter, setRiskFilter] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL");
    const [sortBy, setSortBy] = useState<"risk" | "name" | "size" | "incidents">("risk");

    const aircraftRows = useMemo(() => {
        const rows = (aircraftData as AircraftRow[])
            .filter((a) => {
                const q = query.trim().toLowerCase();
                const matchesQuery =
                    q.length === 0 ||
                    a.icaoType.toLowerCase().includes(q) ||
                    a.displayName.toLowerCase().includes(q);
                const matchesRisk = riskFilter === "ALL" || a.riskBand === riskFilter;
                return matchesQuery && matchesRisk;
            })
            .sort((a, b) => {
                if (sortBy === "name") return a.displayName.localeCompare(b.displayName);
                if (sortBy === "size") return b.fleetSize - a.fleetSize;
                if (sortBy === "incidents") return b.incidents - a.incidents;
                const order = { HIGH: 3, MEDIUM: 2, LOW: 1 } as Record<string, number>;
                return (order[b.riskBand] || 0) - (order[a.riskBand] || 0);
            });

        return rows;
    }, [query, riskFilter, sortBy]);

    const airlineRows = useMemo(() => {
        const rows = (airlineData as AirlineRow[])
            .filter((a) => {
                const q = query.trim().toLowerCase();
                const matchesQuery =
                    q.length === 0 ||
                    a.code.toLowerCase().includes(q) ||
                    a.name.toLowerCase().includes(q);
                const matchesRisk = riskFilter === "ALL" || a.riskBand === riskFilter;
                return matchesQuery && matchesRisk;
            })
            .sort((a, b) => {
                if (sortBy === "name") return a.name.localeCompare(b.name);
                if (sortBy === "size") return b.averageFleetAgeYears - a.averageFleetAgeYears;
                if (sortBy === "incidents") return b.incidentsLast10Y - a.incidentsLast10Y;
                const order = { HIGH: 3, MEDIUM: 2, LOW: 1 } as Record<string, number>;
                return (order[b.riskBand] || 0) - (order[a.riskBand] || 0);
            });

        return rows;
    }, [query, riskFilter, sortBy]);

    const totalAircraft = (aircraftData as AircraftRow[]).length;
    const totalAirlines = (airlineData as AirlineRow[]).length;
    const highRiskAircraft = (aircraftData as AircraftRow[]).filter((a) => a.riskBand === "HIGH").length;
    const highRiskAirlines = (airlineData as AirlineRow[]).filter((a) => a.riskBand === "HIGH").length;

    return (
        <main className="min-h-screen micro-grid pt-16 pb-10 px-4">
            <div className="mx-auto w-full max-w-6xl">
                <div className="mb-6 flex items-center gap-2">
                    <Radar className="h-4 w-4 text-electric" />
                    <span className="font-mono-label text-[9px] tracking-[0.28em] text-muted-foreground">SAFETY DATA EXPLORER</span>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="hud-panel glow-blue crosshair-corners mb-4 p-5"
                >
                    <h1 className="font-heading text-2xl font-bold tracking-[0.08em] text-foreground md:text-3xl">
                        EXPLORE OPERATIONAL SAFETY INTELLIGENCE
                    </h1>
                    <p className="mt-2 max-w-3xl font-mono-label text-[11px] leading-relaxed tracking-wider text-muted-foreground">
                        Query aircraft and airline risk profiles, isolate high-risk entities, and inspect incident density from the tactical data registry.
                    </p>
                </motion.div>

                <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="hud-panel p-3">
                        <div className="mb-1 flex items-center gap-2 text-electric">
                            <Plane className="h-3.5 w-3.5" />
                            <span className="font-mono-label text-[9px] tracking-widest">AIRCRAFT TYPES</span>
                        </div>
                        <p className="font-mono-data text-xl text-foreground">{totalAircraft}</p>
                    </div>
                    <div className="hud-panel p-3">
                        <div className="mb-1 flex items-center gap-2 text-electric">
                            <Building2 className="h-3.5 w-3.5" />
                            <span className="font-mono-label text-[9px] tracking-widest">AIRLINES</span>
                        </div>
                        <p className="font-mono-data text-xl text-foreground">{totalAirlines}</p>
                    </div>
                    <div className="hud-panel p-3">
                        <div className="mb-1 flex items-center gap-2 text-warning">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span className="font-mono-label text-[9px] tracking-widest">HIGH-RISK A/C</span>
                        </div>
                        <p className="font-mono-data text-xl text-warning">{highRiskAircraft}</p>
                    </div>
                    <div className="hud-panel p-3">
                        <div className="mb-1 flex items-center gap-2 text-warning">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span className="font-mono-label text-[9px] tracking-widest">HIGH-RISK AIRLINES</span>
                        </div>
                        <p className="font-mono-data text-xl text-warning">{highRiskAirlines}</p>
                    </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                    <button
                        className={`border px-3 py-1.5 font-mono-label text-[10px] tracking-[0.18em] transition-colors ${
                            tab === "aircraft"
                                ? "border-electric/50 bg-electric/15 text-electric"
                                : "border-border bg-background text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setTab("aircraft")}
                    >
                        AIRCRAFT
                    </button>
                    <button
                        className={`border px-3 py-1.5 font-mono-label text-[10px] tracking-[0.18em] transition-colors ${
                            tab === "airlines"
                                ? "border-electric/50 bg-electric/15 text-electric"
                                : "border-border bg-background text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setTab("airlines")}
                    >
                        AIRLINES
                    </button>
                </div>

                <div className="hud-panel mb-4 p-3">
                    <div className="grid gap-3 md:grid-cols-3">
                        <label className="flex flex-col gap-1">
                            <span className="flex items-center gap-1 font-mono-label text-[9px] tracking-widest text-muted-foreground">
                                <Radar className="h-3 w-3" /> QUERY
                            </span>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={tab === "aircraft" ? "ICAO or aircraft name..." : "Code or airline name..."}
                                className="border border-border bg-background px-2 py-2 font-mono-data text-xs tracking-wider text-foreground outline-none focus:border-electric/60"
                            />
                        </label>

                        <label className="flex flex-col gap-1">
                            <span className="flex items-center gap-1 font-mono-label text-[9px] tracking-widest text-muted-foreground">
                                <Filter className="h-3 w-3" /> RISK FILTER
                            </span>
                            <select
                                value={riskFilter}
                                onChange={(e) => setRiskFilter(e.target.value as "ALL" | "LOW" | "MEDIUM" | "HIGH")}
                                className="border border-border bg-background px-2 py-2 font-mono-data text-xs tracking-wider text-foreground outline-none focus:border-electric/60"
                            >
                                <option value="ALL">ALL</option>
                                <option value="LOW">LOW</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HIGH">HIGH</option>
                            </select>
                        </label>

                        <label className="flex flex-col gap-1">
                            <span className="flex items-center gap-1 font-mono-label text-[9px] tracking-widest text-muted-foreground">
                                <ArrowUpDown className="h-3 w-3" /> SORT
                            </span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as "risk" | "name" | "size" | "incidents")}
                                className="border border-border bg-background px-2 py-2 font-mono-data text-xs tracking-wider text-foreground outline-none focus:border-electric/60"
                            >
                                <option value="risk">RISK</option>
                                <option value="name">NAME</option>
                                <option value="size">SIZE / AGE</option>
                                <option value="incidents">INCIDENTS</option>
                            </select>
                        </label>
                    </div>
                </div>

                <p className="mb-3 font-mono-label text-[9px] tracking-widest text-muted-foreground">
                    DISPLAYING {tab === "aircraft" ? aircraftRows.length : airlineRows.length} RECORDS
                </p>

                {tab === "aircraft" && (
                    <>
                        <div className="hidden overflow-hidden border border-border md:block">
                            <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] bg-muted/20 px-4 py-2 font-mono-label text-[9px] tracking-[0.2em] text-muted-foreground">
                                <span>ICAO</span>
                                <span>AIRCRAFT</span>
                                <span>FLEET</span>
                                <span>AVG AGE</span>
                                <span>INCIDENTS</span>
                                <span>RISK</span>
                            </div>
                            {aircraftRows.map((a) => (
                                <div
                                    key={a.icaoType}
                                    className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] items-center border-t border-border/60 px-4 py-2.5 font-mono-data text-xs transition-colors hover:bg-electric/5"
                                >
                                    <span className="text-electric">{a.icaoType}</span>
                                    <span className="text-foreground">{a.displayName}</span>
                                    <span>{a.fleetSize.toLocaleString()}</span>
                                    <span>{a.averageFleetAgeYears.toFixed(1)}y</span>
                                    <span>{a.incidents}</span>
                                    <RiskBadge band={a.riskBand} />
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-3 md:hidden">
                            {aircraftRows.map((a) => (
                                <div key={a.icaoType} className="hud-panel p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="font-mono-data text-sm text-electric">{a.icaoType}</span>
                                        <RiskBadge band={a.riskBand} />
                                    </div>
                                    <p className="font-heading text-sm tracking-wide text-foreground">{a.displayName}</p>
                                    <div className="mt-2 grid grid-cols-3 gap-2 font-mono-label text-[10px] text-muted-foreground">
                                        <span>FLEET: <span className="text-foreground">{a.fleetSize}</span></span>
                                        <span>AGE: <span className="text-foreground">{a.averageFleetAgeYears}y</span></span>
                                        <span>INC: <span className="text-foreground">{a.incidents}</span></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {tab === "airlines" && (
                    <>
                        <div className="hidden overflow-hidden border border-border md:block">
                            <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] bg-muted/20 px-4 py-2 font-mono-label text-[9px] tracking-[0.2em] text-muted-foreground">
                                <span>CODE</span>
                                <span>AIRLINE</span>
                                <span>RANK</span>
                                <span>IOSA</span>
                                <span>INCIDENTS</span>
                                <span>RISK</span>
                            </div>
                            {airlineRows.map((a) => (
                                <div
                                    key={a.code}
                                    className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] items-center border-t border-border/60 px-4 py-2.5 font-mono-data text-xs transition-colors hover:bg-electric/5"
                                >
                                    <span className="text-electric">{a.code}</span>
                                    <span className="text-foreground">{a.name}</span>
                                    <span>#{a.safetyRank}</span>
                                    <span className={a.iosa ? "text-neon" : "text-warning"}>{a.iosa ? "YES" : "NO"}</span>
                                    <span>{a.incidentsLast10Y}</span>
                                    <RiskBadge band={a.riskBand} />
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-3 md:hidden">
                            {airlineRows.map((a) => (
                                <div key={a.code} className="hud-panel p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="font-mono-data text-sm text-electric">{a.code}</span>
                                        <RiskBadge band={a.riskBand} />
                                    </div>
                                    <p className="font-heading text-sm tracking-wide text-foreground">{a.name}</p>
                                    <div className="mt-2 grid grid-cols-3 gap-2 font-mono-label text-[10px] text-muted-foreground">
                                        <span>RANK: <span className="text-foreground">#{a.safetyRank}</span></span>
                                        <span>IOSA: <span className={a.iosa ? "text-neon" : "text-warning"}>{a.iosa ? "YES" : "NO"}</span></span>
                                        <span>INC: <span className="text-foreground">{a.incidentsLast10Y}</span></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {((tab === "aircraft" && aircraftRows.length === 0) || (tab === "airlines" && airlineRows.length === 0)) && (
                    <div className="hud-panel mt-4 p-6 text-center">
                        <p className="font-mono-data text-sm text-warning">NO MATCHING RECORDS</p>
                        <p className="mt-1 font-mono-label text-[10px] text-muted-foreground">Adjust your query, risk filter, or sort option.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
