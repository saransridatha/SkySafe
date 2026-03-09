import flights from "@/data/flights.json";
import { TTLCache } from "@/lib/cache/lru";
import { FlightDetails, Coordinate } from "@/lib/types";
import { getPersistentFlight, setPersistentFlight } from "@/lib/cache/sqlite";

type FlightRecord = FlightDetails & { queryKeys: string[] };

const cache = new TTLCache<FlightDetails>(200);
const FLIGHT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours memory cache

function normalizeQuery(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const AIRLINE_MAP: Record<string, { code: string; name: string }> = {
  KL: { code: "KLM", name: "KLM Royal Dutch Airlines" },
  KLM: { code: "KLM", name: "KLM Royal Dutch Airlines" },
  AI: { code: "AIC", name: "Air India" },
  AIC: { code: "AIC", name: "Air India" },
  BA: { code: "BAW", name: "British Airways" },
  BAW: { code: "BAW", name: "British Airways" },
  EK: { code: "UAE", name: "Emirates" },
  UAE: { code: "UAE", name: "Emirates" },
  LH: { code: "DLH", name: "Lufthansa" },
  DLH: { code: "DLH", name: "Lufthansa" },
  SQ: { code: "SIA", name: "Singapore Airlines" },
  SIA: { code: "SIA", name: "Singapore Airlines" },
  QR: { code: "QTR", name: "Qatar Airways" },
  QTR: { code: "QTR", name: "Qatar Airways" },
  AF: { code: "AFR", name: "Air France" },
  AFR: { code: "AFR", name: "Air France" },
};

const AIRPORT_COORDS: Record<string, Coordinate> = {
  DEL: [77.1025, 28.5562],
  LHR: [-0.4543, 51.4700],
  JFK: [-73.7781, 40.6413],
  DXB: [55.3644, 25.2532],
  SIN: [103.9893, 1.3644],
  SYD: [151.1772, -33.9461],
  FRA: [8.5706, 50.0333],
  CDG: [2.5479, 49.0097],
  HND: [139.7798, 35.5494],
  SFO: [-122.3790, 37.6213],
  AMS: [4.7683, 52.3105],
  JNB: [28.2411, -26.1367],
  IAH: [-95.3368, 29.9902],
  HYD: [78.4294, 17.2403]
};

const AIRPORT_COUNTRIES: Record<string, string> = {
  DEL: "IN", LHR: "GB", JFK: "US", DXB: "AE", SIN: "SG", SYD: "AU",
  FRA: "DE", CDG: "FR", HND: "JP", SFO: "US", AMS: "NL", JNB: "ZA",
  IAH: "US", HYD: "IN"
};

function getCoord(iata: string): Coordinate {
  if (AIRPORT_COORDS[iata]) return AIRPORT_COORDS[iata];
  // Hash to a pseudo-random coordinate across the globe if unknown
  const h = hashCode(iata);
  return [(h % 360) - 180, ((h >> 4) % 180) - 90];
}

async function fetchAviationStack(query: string): Promise<FlightDetails | null> {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey || apiKey === "your_aviationstack_api_key_here") return null;

  try {
    const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${query}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.data || data.data.length === 0) return null;

    const f = data.data[0];
    const origin = f.departure.iata || "UNK";
    const dest = f.arrival.iata || "UNK";

    const originCoord = getCoord(origin);
    const destCoord = getCoord(dest);

    // Generate simple interpolated waypoints
    const w1: Coordinate = [originCoord[0] + (destCoord[0] - originCoord[0]) * 0.33, originCoord[1] + (destCoord[1] - originCoord[1]) * 0.33];
    const w2: Coordinate = [originCoord[0] + (destCoord[0] - originCoord[0]) * 0.66, originCoord[1] + (destCoord[1] - originCoord[1]) * 0.66];
    const waypoints: Coordinate[] = [originCoord, w1, w2, destCoord];

    // Use actual departure and arrival countries for the risk intelligence
    const c1 = AIRPORT_COUNTRIES[origin] || "US";
    const c2 = AIRPORT_COUNTRIES[dest] || "GB";
    const mockCountries = Array.from(new Set([c1, c2]));

    return {
      flightNumber: f.flight.iata || query,
      airline: f.airline.icao || "UNK",
      airlineName: f.airline.name || "Unknown Airline",
      aircraftType: f.aircraft?.icao || "B788",
      origin: origin,
      destination: dest,
      departureTime: f.departure.scheduled || new Date().toISOString(),
      arrivalTime: f.arrival.scheduled || new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      waypoints,
      countries: mockCountries
    };
  } catch (error) {
    console.error("AviationStack error:", error);
    return null;
  }
}

const MOCK_ROUTES = [
  { origin: "DEL", destination: "LHR", waypoints: [[77.1025, 28.5562], [69.2, 34.5], [51.3, 35.6], [13.4, 52.5], [-0.4543, 51.47]], countries: ["IN", "PK", "IR", "TR", "DE", "GB"] },
  { origin: "JFK", destination: "LHR", waypoints: [[-73.7781, 40.6413], [-60.0, 45.0], [-40.0, 50.0], [-20.0, 52.0], [-0.4543, 51.47]], countries: ["US", "CA", "IE", "GB"] },
  { origin: "DXB", destination: "CDG", waypoints: [[55.3644, 25.2532], [45.0, 32.0], [35.0, 38.0], [20.0, 45.0], [2.5479, 49.0097]], countries: ["AE", "SA", "IQ", "TR", "IT", "FR"] },
  { origin: "SIN", destination: "SYD", waypoints: [[103.9893, 1.3644], [115.0, -10.0], [130.0, -20.0], [140.0, -28.0], [151.1772, -33.9461]], countries: ["SG", "ID", "AU"] },
  { origin: "HND", destination: "SFO", waypoints: [[139.7798, 35.5494], [160.0, 42.0], [180.0, 45.0], [-140.0, 40.0], [-122.3790, 37.6213]], countries: ["JP", "US"] },
  { origin: "AMS", destination: "JNB", waypoints: [[4.7683, 52.3105], [5.0, 45.0], [8.0, 35.0], [15.0, 10.0], [25.0, -10.0], [28.2411, -26.1367]], countries: ["NL", "FR", "IT", "TN", "CD", "ZA"] }
];

function generateMockFlight(query: string): FlightDetails {
  const normalized = normalizeQuery(query);
  const hash = hashCode(normalized);
  const match = normalized.match(/^([A-Z]{2,3})/);
  const prefix = match ? match[1] : "";
  const airlineInfo = AIRLINE_MAP[prefix] || {
    code: ["AIC", "BAW", "DLH", "UAE", "QTR", "AFR", "KLM", "SIA"][hash % 8],
    name: "Global Airways"
  };

  const aircrafts = ["B788", "A35K", "B77W", "A388", "B738", "A320"];
  const aircraftType = aircrafts[(hash >> 2) % aircrafts.length];

  const route = MOCK_ROUTES[hash % MOCK_ROUTES.length];

  return {
    flightNumber: normalized,
    airline: airlineInfo.code,
    airlineName: airlineInfo.name,
    aircraftType,
    origin: route.origin,
    destination: route.destination,
    departureTime: new Date().toISOString(),
    arrivalTime: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    waypoints: route.waypoints as Coordinate[],
    countries: route.countries
  };
}

export async function searchFlight(query: string): Promise<FlightDetails> {
  const key = normalizeQuery(query);

  // Validate format before proceeding to avoid generating fallbacks for invalid inputs like "KL"
  const isFlightNumber = /^[A-Z]{2,3}\d{1,4}$/.test(key);
  const isRoute = /^[A-Z]{3}[^A-Z0-9]*[A-Z]{3}$/.test(key) && key.length >= 6 && key.length <= 8;

  if (!isFlightNumber && !isRoute) {
    throw new Error("Invalid flight code or route format. Please enter a valid flight number (e.g., AI 101) or a 3-letter airport route (e.g., DEL-LHR).");
  }

  // 1. Memory cache check
  // const cached = cache.get(key);
  // if (cached) return cached;

  // 2. Persistent SQLite cache check (Avoids API calls)
  const persistent = getPersistentFlight(key);
  if (persistent) {
    // cache.set(key, persistent, FLIGHT_TTL_MS);
    return persistent;
  }

  // 3. Real-time API
  const realTime = await fetchAviationStack(key);
  if (realTime) {
    setPersistentFlight(key, realTime); // Store permanently
    cache.set(key, realTime, FLIGHT_TTL_MS);
    return realTime;
  }

  // 4. Static mock data
  const all = flights as FlightRecord[];
  const found = all.find((item) =>
    item.queryKeys.map(normalizeQuery).includes(key)
  );

  if (found) {
    const result: FlightDetails = {
      flightNumber: found.flightNumber,
      airline: found.airline,
      airlineName: found.airlineName,
      aircraftType: found.aircraftType,
      origin: found.origin,
      destination: found.destination,
      departureTime: found.departureTime,
      arrivalTime: found.arrivalTime,
      waypoints: found.waypoints,
      countries: found.countries
    };
    cache.set(key, result, FLIGHT_TTL_MS);
    return result;
  }

  // 5. Deterministic fallback generator
  const result = generateMockFlight(query);
  cache.set(key, result, FLIGHT_TTL_MS);
  return result;
}
