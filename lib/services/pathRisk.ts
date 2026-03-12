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

// Country center coordinates for waypoint-to-country mapping
const COUNTRY_CENTERS: Record<string, { lat: number; lng: number; radius: number }> = {
  IN: { lat: 22.0, lng: 78.0, radius: 12 }, PK: { lat: 30.4, lng: 69.3, radius: 7 },
  AF: { lat: 33.9, lng: 67.7, radius: 5 }, IR: { lat: 32.4, lng: 53.7, radius: 8 },
  IQ: { lat: 33.2, lng: 43.7, radius: 5 }, TR: { lat: 39.0, lng: 35.2, radius: 7 },
  SY: { lat: 35.0, lng: 38.0, radius: 3 }, JO: { lat: 31.2, lng: 36.8, radius: 2 },
  IL: { lat: 31.5, lng: 34.8, radius: 1.5 }, LB: { lat: 33.9, lng: 35.9, radius: 1 },
  SA: { lat: 24.0, lng: 45.0, radius: 10 }, AE: { lat: 24.5, lng: 54.5, radius: 3 },
  OM: { lat: 21.5, lng: 57.0, radius: 5 }, YE: { lat: 15.6, lng: 48.5, radius: 5 },
  EG: { lat: 27.0, lng: 30.0, radius: 7 }, LY: { lat: 27.0, lng: 17.2, radius: 8 },
  SD: { lat: 15.5, lng: 30.0, radius: 7 }, SO: { lat: 5.2, lng: 46.2, radius: 6 },
  ET: { lat: 9.0, lng: 39.5, radius: 6 }, KE: { lat: -0.5, lng: 37.9, radius: 5 },
  DE: { lat: 51.2, lng: 10.4, radius: 4 }, GB: { lat: 54.0, lng: -2.0, radius: 4 },
  FR: { lat: 46.0, lng: 2.2, radius: 5 }, NL: { lat: 52.1, lng: 5.3, radius: 2 },
  UA: { lat: 48.4, lng: 31.2, radius: 6 }, RU: { lat: 61.5, lng: 60.0, radius: 25 },
  US: { lat: 38.0, lng: -97.0, radius: 20 }, CA: { lat: 56.0, lng: -96.0, radius: 20 },
};

function toKey(input: AnalyzeInput): string {
  return JSON.stringify({ o: input.origin, d: input.destination, c: input.countries });
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

// Map a waypoint to the closest country from the provided countries list
function waypointToCountry(wp: Coordinate, countries: string[]): string {
  const lng = wp[0], lat = wp[1];
  let best: string | null = null;
  let bestDist = Infinity;

  for (const code of countries) {
    const center = COUNTRY_CENTERS[code];
    if (!center) continue;
    const dist = Math.sqrt(Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2));
    if (dist < bestDist) {
      bestDist = dist;
      best = code;
    }
  }

  return best || countries[0] || "UN";
}

export async function analyzePath(input: AnalyzeInput): Promise<PathAnalysis> {
  const cacheKey = toKey(input);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const riskRows = countryRisk as CountryRiskRow[];
  const points: Coordinate[] = input.waypoints;

  // Build segments by grouping consecutive waypoints by their country
  // This creates one segment per country traversal
  const countrySegments: { from: Coordinate; to: Coordinate; country: string }[] = [];

  if (points.length >= 2) {
    let prevCountry = waypointToCountry(points[0], input.countries);
    let segStart = points[0];

    for (let i = 1; i < points.length; i++) {
      const country = waypointToCountry(points[i], input.countries);
      if (country !== prevCountry) {
        // Country changed — close current segment and start new one
        countrySegments.push({ from: segStart, to: points[i - 1], country: prevCountry });
        segStart = points[i - 1]; // overlap at border
        prevCountry = country;
      }
    }
    // Close the final segment
    countrySegments.push({ from: segStart, to: points[points.length - 1], country: prevCountry });
  }

  const segments = countrySegments.map((seg) => {
    const baseline = riskRows.find((r) => r.country === seg.country);
    const baseWeight = baseline?.riskWeight ?? 1;
    const conflictBoost = intersectsConflictZone(seg.country, seg.from, seg.to) ? 1 : 0;

    return {
      from: seg.from,
      to: seg.to,
      country: seg.country,
      riskLevel: riskBandFromWeight(baseWeight + conflictBoost),
    };
  });

  const conflictZonesMatched = Array.from(
    new Set(segments.filter((s) => intersectsConflictZone(s.country, s.from, s.to)).map((s) => s.country))
  );

  const overallPathRisk = segments.reduce<RiskBand>((acc, seg) => maxRisk(acc, seg.riskLevel), "LOW");

  const output: PathAnalysis = {
    segments,
    conflictZones: conflictZonesMatched,
    overallPathRisk,
  };

  cache.set(cacheKey, output, TTL_MS);
  return output;
}
