"use client";

import { useState } from "react";
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
    const cls = `risk-badge risk-${band.toLowerCase()}`;
    return <span className={cls}>{band}</span>;
}

export default function ExplorePage() {
    const [tab, setTab] = useState<"aircraft" | "airlines">("aircraft");

    return (
        <main className="explore-page">
            <div className="container">
                <div className="explore-header">
                    <h1 className="explore-title">Explore Safety Data</h1>
                    <p className="explore-desc">
                        Browse aircraft type profiles and airline safety records from our curated database.
                    </p>
                </div>

                <div className="explore-tabs">
                    <button
                        className={`explore-tab${tab === "aircraft" ? " active" : ""}`}
                        onClick={() => setTab("aircraft")}
                    >
                        Aircraft Types
                    </button>
                    <button
                        className={`explore-tab${tab === "airlines" ? " active" : ""}`}
                        onClick={() => setTab("airlines")}
                    >
                        Airlines
                    </button>
                </div>

                {tab === "aircraft" && (
                    <div className="data-grid">
                        <div className="data-grid-header aircraft-cols">
                            <span>ICAO Code</span>
                            <span>Aircraft</span>
                            <span>Fleet Size</span>
                            <span className="hide-sm">Avg Age</span>
                            <span className="hide-sm">Incidents</span>
                            <span className="hide-md">Hull Losses</span>
                            <span>Risk</span>
                        </div>
                        {(aircraftData as AircraftRow[]).map((a) => (
                            <div key={a.icaoType} className="data-grid-row aircraft-cols">
                                <span className="data-cell-mono">{a.icaoType}</span>
                                <span>{a.displayName}</span>
                                <span>{a.fleetSize.toLocaleString()}</span>
                                <span className="hide-sm">{a.averageFleetAgeYears}y</span>
                                <span className="hide-sm">{a.incidents}</span>
                                <span className="hide-md">{a.hullLosses}</span>
                                <span><RiskBadge band={a.riskBand} /></span>
                            </div>
                        ))}
                    </div>
                )}

                {tab === "airlines" && (
                    <div className="data-grid">
                        <div className="data-grid-header airline-cols">
                            <span>Code</span>
                            <span>Airline</span>
                            <span>Rank</span>
                            <span className="hide-sm">IOSA</span>
                            <span className="hide-sm">Incidents</span>
                            <span className="hide-md">Fleet Age</span>
                            <span>Risk</span>
                        </div>
                        {(airlineData as AirlineRow[]).map((a) => (
                            <div key={a.code} className="data-grid-row airline-cols">
                                <span className="data-cell-mono">{a.code}</span>
                                <span>{a.name}</span>
                                <span>#{a.safetyRank}</span>
                                <span className="hide-sm">{a.iosa ? "✓" : "✗"}</span>
                                <span className="hide-sm">{a.incidentsLast10Y}</span>
                                <span className="hide-md">{a.averageFleetAgeYears}y</span>
                                <span><RiskBadge band={a.riskBand} /></span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
