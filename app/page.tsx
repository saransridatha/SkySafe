"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FEATURES = [
  { icon: "✈️", name: "Aircraft Safety", desc: "Crash rates, hull losses, fleet age, and incidents for every aircraft type in service." },
  { icon: "🏢", name: "Airline Reliability", desc: "IOSA certification, safety rankings, EU ban status, and historical incident data." },
  { icon: "🗺️", name: "Flight Path Risk", desc: "Route analysis through conflict zones, restricted airspace, and geopolitical hotspots." },
  { icon: "📰", name: "Threat Intelligence", desc: "Real-time news scanning for security events along your flight path countries." },
  { icon: "🤖", name: "AI Risk Scoring", desc: "Gemini AI synthesizes all factors into a single 1–10 risk score with explanation." },
  { icon: "🌍", name: "Interactive Maps", desc: "Leaflet-powered route visualization with conflict zone overlays and risk segments." },
];

const STATS = [
  { number: "15+", label: "Aircraft Types" },
  { number: "20+", label: "Airlines Tracked" },
  { number: "8", label: "Conflict Zones" },
  { number: "6", label: "Risk Pillars" },
];

const STEPS = [
  { title: "Enter Your Flight", desc: "Type a flight number like AI 101 or a route like DEL → LHR." },
  { title: "We Analyze Everything", desc: "Aircraft records, airline history, route risk, live news, and geopolitical data — all in parallel." },
  { title: "Get Your Risk Report", desc: "A complete dashboard with AI-scored risk, interactive map, and actionable intelligence." },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/report?flight=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <main className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Flight Risk Intelligence
          </div>
          <h1 className="hero-title">
            Know your flight<br />
            <span className="hero-title-accent">before you board.</span>
          </h1>
          <p className="hero-subtitle">
            SkySafe analyzes aircraft safety records, airline reliability, flight path risk through conflict zones, live news intelligence, and delivers an AI-powered risk score — all in seconds.
          </p>
          <form onSubmit={handleSearch} className="hero-search">
            <div className="hero-search-row">
              <input
                type="text"
                className="hero-search-input"
                placeholder="Flight number (AI 101) or route (DEL → LHR)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              <button
                type="submit"
                className="hero-search-btn"
                disabled={!query.trim()}
              >
                Analyze
              </button>
            </div>
            <p className="hero-search-hint">
              Press <kbd>/</kbd> to search from anywhere
            </p>
          </form>
        </div>
      </section>

      {/* Trusted data strip */}
      <section className="trusted-strip">
        <div className="container">
          <div className="trusted-label">Data Sources</div>
          <div className="trusted-items">
            <span className="trusted-item">OpenSky Network</span>
            <span className="trusted-dot" />
            <span className="trusted-item">AviationStack</span>
            <span className="trusted-dot" />
            <span className="trusted-item">Aviation Safety Network</span>
            <span className="trusted-dot" />
            <span className="trusted-item">GNews API</span>
            <span className="trusted-dot" />
            <span className="trusted-item">Google Gemini AI</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="features-header">
            <div className="features-overline">Capabilities</div>
            <h2 className="features-title">Six pillars of flight intelligence</h2>
            <p className="features-desc">
              Every dimension that matters for your flight safety, analyzed and scored.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.name} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <div className="feature-name">{f.name}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-number">{s.number}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-section">
        <div className="container">
          <div className="how-header">
            <div className="how-overline">How It Works</div>
            <h2 className="how-title">Three steps to flight intelligence</h2>
          </div>
          <div className="how-steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className="how-step">
                <div className="how-step-num">{i + 1}</div>
                <div className="how-step-title">{s.title}</div>
                <div className="how-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-copy">
              © 2026 SkySafe. Flight risk intelligence platform.
            </div>
            <ul className="footer-links">
              <li><Link href="/explore">Explore Data</Link></li>
              <li><Link href="/about">Methodology</Link></li>
              <li><a href="https://github.com" target="_blank" rel="noopener">GitHub</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
