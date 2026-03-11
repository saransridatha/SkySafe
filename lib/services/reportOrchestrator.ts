import { getAirlineReliability } from "@/lib/services/airlineReliability";
import { getAircraftSafety } from "@/lib/services/aircraftSafety";
import { searchFlight } from "@/lib/services/flightData";
import { scoreRisk } from "@/lib/services/geminiScorer";
import { getNewsIntel } from "@/lib/services/newsIntel";
import { analyzePath } from "@/lib/services/pathRisk";
import { getRiskReport, setRiskReport, cleanupOldReports } from "@/lib/cache/sqlite";
import { AggregatedRiskReport } from "@/lib/types";

export async function buildRiskReport(flightQuery: string): Promise<AggregatedRiskReport> {
  const flight = await searchFlight(flightQuery);
  const cacheKey = `${flight.flightNumber}:${new Date().toISOString().slice(0, 10)}`;

  const cached = getRiskReport(cacheKey);
  if (cached) return cached;

  const origin = flight.waypoints[0] ?? [0, 0];
  const destination = flight.waypoints[flight.waypoints.length - 1] ?? [0, 0];

  const [aircraft, airline, pathAnalysis, news] = await Promise.all([
    getAircraftSafety(flight.aircraftType),
    getAirlineReliability(flight.airline, flight.airlineName),
    analyzePath({
      origin,
      destination,
      waypoints: flight.waypoints,
      countries: flight.countries
    }),
    getNewsIntel(Array.from(new Set(flight.countries)))
  ]);

  const riskScore = await scoreRisk({
    flight,
    aircraft,
    airline,
    pathAnalysis,
    news
  });

  const report: AggregatedRiskReport = {
    flight,
    aircraft,
    airline,
    pathAnalysis,
    news,
    riskScore,
    generatedAt: new Date().toISOString()
  };

  setRiskReport(cacheKey, report);
  
  // Background cleanup
  setTimeout(() => {
    try {
      cleanupOldReports(30);
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }, 0);

  return report;
}
