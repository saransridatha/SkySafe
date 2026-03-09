import Link from "next/link";

const PILLARS = [
    {
        name: "Aircraft Safety",
        desc: "We analyze each aircraft type using historical incident data from the Aviation Safety Network. Metrics include total incidents, hull losses, fleet size, average fleet age, and a computed hull loss rate. Types with zero hull losses and fewer incidents relative to fleet size receive LOW risk; older types with higher loss ratios receive MEDIUM or HIGH.",
    },
    {
        name: "Airline Reliability",
        desc: "Airline profiles include IOSA (IATA Operational Safety Audit) certification status, EU banned airline list cross-referencing, JACDEC safety ranking position, fleet age averages, and incident counts over the last 10 years. Airlines with active IOSA, no EU ban, low incident count, and top-50 ranking receive LOW risk.",
    },
    {
        name: "Flight Path Risk",
        desc: "We compute waypoints along the flight route and test each segment against our conflict zone GeoJSON dataset using ray-casting polygon intersection. Countries in active conflict (Afghanistan, Ukraine, Syria, Yemen, Iraq, Somalia, Sudan, Iran) are tagged with risk weights. Segments traversing these zones receive boosted risk scores.",
    },
    {
        name: "News Intelligence",
        desc: "For each country along the flight path, we fetch recent headlines from GNews and NewsAPI, scanning for threat keywords: war, missile, airspace closure, military, sanctions, terrorism, security. Countries with 4+ keyword matches receive HIGH threat; 2+ get MEDIUM. Headlines are displayed with source attribution.",
    },
    {
        name: "AI Risk Scoring",
        desc: "All collected data is aggregated into a structured prompt sent to Google Gemini (gemini-2.0-flash model). The AI weighs aircraft safety, airline reliability, path risk, and news intelligence to produce a 1–10 score, a plain-English explanation, and the top 3 risk factors. When the API is unavailable, a deterministic fallback algorithm provides consistent scoring.",
    },
    {
        name: "Caching Strategy",
        desc: "Results are cached at two levels: an in-memory LRU cache with TTL (6 hours for flights/reports, 1 hour for news, 24 hours for static profiles) and a persistent SQLite database for long-term storage. This ensures minimal external API usage and fast repeat queries.",
    },
];

const SOURCES = [
    { name: "Aviation Safety Network", url: "https://aviation-safety.net/", usage: "Aircraft & airline incident data" },
    { name: "OpenSky Network", url: "https://opensky-network.org/", usage: "Live aircraft positions" },
    { name: "AviationStack", url: "https://aviationstack.com/", usage: "Flight schedules" },
    { name: "GNews API", url: "https://gnews.io/", usage: "News headlines by country" },
    { name: "NewsAPI", url: "https://newsapi.org/", usage: "Supplementary news" },
    { name: "Google Gemini", url: "https://ai.google.dev/", usage: "AI risk scoring" },
    { name: "ACLED", url: "https://acleddata.com/", usage: "Conflict zone data" },
    { name: "OpenStreetMap + CARTO", url: "https://www.openstreetmap.org/", usage: "Map tiles" },
];

export default function AboutPage() {
    return (
        <main className="explore-page">
            <div className="container-narrow">
                <div className="explore-header" style={{ marginBottom: "2.5rem" }}>
                    <h1 className="explore-title">Methodology</h1>
                    <p className="explore-desc">
                        How SkySafe analyzes and scores flight risk across six dimensions.
                    </p>
                </div>

                {/* Risk Pillars */}
                <div style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "1rem" }}>
                        Risk Assessment Pillars
                    </h2>
                    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
                        {PILLARS.map((p, i) => (
                            <div
                                key={p.name}
                                style={{
                                    padding: "1.25rem 1.5rem",
                                    borderBottom: i < PILLARS.length - 1 ? "1px solid var(--border-subtle)" : "none",
                                }}
                            >
                                <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.375rem" }}>
                                    {p.name}
                                </h3>
                                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
                                    {p.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Data Sources */}
                <div style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "1rem" }}>
                        Data Sources
                    </h2>
                    <div className="data-grid">
                        <div className="data-grid-header" style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 2fr" }}>
                            <span>Source</span>
                            <span>Usage</span>
                            <span>URL</span>
                        </div>
                        {SOURCES.map((s) => (
                            <div
                                key={s.name}
                                className="data-grid-row"
                                style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 2fr" }}
                            >
                                <span style={{ fontWeight: 500 }}>{s.name}</span>
                                <span style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>{s.usage}</span>
                                <a href={s.url} target="_blank" rel="noopener" style={{ fontSize: "0.8125rem" }}>
                                    {s.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Back */}
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    <Link href="/">← Back to SkySafe</Link>
                </p>
            </div>
        </main>
    );
}
