import countryRisk from "@/data/country_risk.json";
import conflictZones from "@/data/conflict_zones.json";
import { TTLCache } from "@/lib/cache/lru";
import { Coordinate, PathAnalysis, RiskBand } from "@/lib/types";
import { maxRisk, riskBandFromWeight } from "@/lib/utils/risk";

type CountryRiskRow = {
  country: string;
  baselineRisk: RiskBand;
  riskWeight: number;
};

type AnalyzeInput = {
  origin: Coordinate;
  destination: Coordinate;
  waypoints: Coordinate[];
  countries: string[];
};

const cache = new TTLCache<PathAnalysis>(300);
const TTL_MS = 6 * 60 * 60 * 1000;

function toKey(input: AnalyzeInput): string {
  return JSON.stringify(input);
}

function pointInPolygon(point: Coordinate, polygon: number[][][]): boolean {
  const x = point[0], y = point[1];
  let inside = false;
  const ring = polygon[0];
  if (!ring) return false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function intersectsConflictZone(country: string, p1?: Coordinate, p2?: Coordinate): boolean {
  const features = (conflictZones as any).features;
  
  if (p1 || p2) {
    for (const f of features) {
      if (f.geometry?.type === "Polygon") {
        if ((p1 && pointInPolygon(p1, f.geometry.coordinates)) || (p2 && pointInPolygon(p2, f.geometry.coordinates))) {
          return true;
        }
      }
    }
  }
  return features.some((f: any) => f.properties?.country === country);
}

export async function analyzePath(input: AnalyzeInput): Promise<PathAnalysis> {
  const cacheKey = toKey(input);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const riskRows = countryRisk as CountryRiskRow[];
  const points: Coordinate[] = input.waypoints;

  const segments = points.slice(0, -1).map((from, idx) => {
    const to = points[idx + 1];
    // Map segments to countries. If we have N waypoints, we have N-1 segments.
    // If we have N countries (one for each waypoint), the segment between waypoint i and i+1
    // is best represented by countries[i+1] (the country it's entering/traversing).
    const country = input.countries[idx + 1] ?? input.countries[idx] ?? "UN";
    const baseline = riskRows.find((r) => r.country === country);
    const baseWeight = baseline?.riskWeight ?? 1;
    const conflictBoost = intersectsConflictZone(country, from, to) ? 1 : 0;

    return {
      from,
      to,
      country,
      riskLevel: riskBandFromWeight(baseWeight + conflictBoost)
    };
  });

  const conflictZonesMatched = Array.from(
    new Set(segments.filter((s) => intersectsConflictZone(s.country, s.from, s.to)).map((s) => s.country))
  );

  const overallPathRisk = segments.reduce<RiskBand>((acc, seg) => maxRisk(acc, seg.riskLevel), "LOW");

  const output: PathAnalysis = {
    segments,
    conflictZones: conflictZonesMatched,
    overallPathRisk
  };

  cache.set(cacheKey, output, TTL_MS);
  return output;
}
