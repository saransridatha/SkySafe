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

// Approximate bounding boxes for country detection from coordinates
const COUNTRY_REGIONS: { code: string; bounds: [number, number, number, number] }[] = [
  // [minLng, minLat, maxLng, maxLat] — conflict zones checked first
  { code: "AF", bounds: [60.5, 29, 75, 39] },
  { code: "IQ", bounds: [38.8, 29, 48.6, 37.5] },
  { code: "SY", bounds: [35.5, 32, 42.5, 37.5] },
  { code: "UA", bounds: [22, 44.3, 40.2, 52.4] },
  { code: "YE", bounds: [42, 12, 54.5, 19] },
  { code: "SO", bounds: [41, -2, 51.5, 12] },
  { code: "SD", bounds: [22, 8.5, 39, 22.2] },
  { code: "LY", bounds: [9, 19, 25, 33] },
  { code: "IR", bounds: [44, 25, 64, 40] },
  { code: "PK", bounds: [61, 23, 77.5, 37] },
  { code: "TR", bounds: [26, 36, 45, 42] },
  { code: "IN", bounds: [68, 6, 97, 36] },
  { code: "SA", bounds: [34, 16, 56, 32] },
  { code: "DE", bounds: [5.9, 47, 15, 55] },
  { code: "FR", bounds: [-5, 42, 8.5, 51] },
  { code: "GB", bounds: [-8, 50, 2, 59] },
  { code: "IT", bounds: [6.5, 36, 18.5, 47] },
  { code: "GR", bounds: [19, 35, 30, 42] },
  { code: "US", bounds: [-125, 24, -66, 50] },
  { code: "JP", bounds: [129, 30, 146, 46] },
  { code: "CN", bounds: [73, 18, 135, 54] },
  { code: "AU", bounds: [112, -44, 154, -10] },
  { code: "ID", bounds: [95, -11, 141, 6] },
  { code: "AE", bounds: [51, 22.5, 56.5, 26.5] },
  { code: "OM", bounds: [52, 16.5, 60, 26.5] },
  { code: "NL", bounds: [3, 50.5, 7.5, 54] },
  { code: "SG", bounds: [103.5, 1.1, 104.1, 1.5] },
  { code: "CD", bounds: [12, -14, 31.5, 5.5] },
  { code: "TN", bounds: [7.5, 30, 11.5, 37.5] },
  { code: "EG", bounds: [24.7, 22, 37, 31.7] },
  { code: "IE", bounds: [-11, 51, -5.5, 55.5] },
  { code: "CA", bounds: [-141, 42, -52, 84] },
  { code: "ZA", bounds: [16, -35, 33, -22] },
  { code: "BG", bounds: [22, 41, 29, 44.5] },
  { code: "RO", bounds: [20, 43.5, 30, 48.5] },
  { code: "RU", bounds: [28, 41, 180, 82] },
];

// Known realistic flight routes with proper waypoints and country mappings
const KNOWN_ROUTES: Record<string, { waypoints: Coordinate[]; countries: string[] }> = {
  "DEL-LHR": {
    waypoints: [[77.1025, 28.5562], [74.3, 31.5], [69.2, 34.5], [51.4, 35.7], [32.9, 39.9], [11.8, 48.1], [-0.4543, 51.47]],
    countries: ["IN", "PK", "AF", "IR", "TR", "DE", "GB"]
  },
  "JFK-LHR": {
    waypoints: [[-73.7781, 40.6413], [-55.0, 47.0], [-35.0, 51.0], [-15.0, 53.0], [-5.0, 52.0], [-0.4543, 51.47]],
    countries: ["US", "US", "US", "IE", "IE", "GB"]
  },
  "DXB-CDG": {
    waypoints: [[55.3644, 25.2532], [50.0, 29.0], [44.0, 33.0], [35.0, 38.0], [20.0, 42.0], [10.0, 45.5], [2.5479, 49.0097]],
    countries: ["AE", "IR", "IQ", "TR", "GR", "IT", "FR"]
  },
  "DXB-LHR": {
    waypoints: [[55.3644, 25.2532], [50.0, 29.0], [44.0, 33.0], [35.0, 38.0], [25.0, 42.0], [10.0, 47.0], [-0.4543, 51.47]],
    countries: ["AE", "IR", "IQ", "TR", "GR", "FR", "GB"]
  },
  "SIN-SYD": {
    waypoints: [[103.9893, 1.3644], [110.0, -5.0], [120.0, -12.0], [130.0, -20.0], [140.0, -28.0], [151.1772, -33.9461]],
    countries: ["SG", "ID", "ID", "AU", "AU", "AU"]
  },
  "HND-SFO": {
    waypoints: [[139.7798, 35.5494], [155.0, 40.0], [170.0, 43.0], [-170.0, 45.0], [-150.0, 42.0], [-135.0, 39.0], [-122.3790, 37.6213]],
    countries: ["JP", "JP", "JP", "US", "US", "US", "US"]
  },
  "AMS-JNB": {
    waypoints: [[4.7683, 52.3105], [5.0, 45.0], [8.0, 35.0], [15.0, 20.0], [20.0, 5.0], [25.0, -10.0], [28.2411, -26.1367]],
    countries: ["NL", "FR", "TN", "LY", "CD", "CD", "ZA"]
  },
  "DEL-DXB": {
    waypoints: [[77.1025, 28.5562], [72.0, 26.0], [67.0, 24.5], [60.0, 25.0], [55.3644, 25.2532]],
    countries: ["IN", "IN", "PK", "OM", "AE"]
  },
  "DEL-SIN": {
    waypoints: [[77.1025, 28.5562], [82.0, 22.0], [88.0, 16.0], [95.0, 10.0], [100.0, 5.0], [103.9893, 1.3644]],
    countries: ["IN", "IN", "IN", "MM", "TH", "SG"]
  },
  "DEL-JFK": {
    waypoints: [[77.1025, 28.5562], [60.0, 35.0], [40.0, 42.0], [15.0, 48.0], [-15.0, 52.0], [-45.0, 48.0], [-73.7781, 40.6413]],
    countries: ["IN", "AF", "TR", "DE", "GB", "US", "US"]
  },
  "FRA-JFK": {
    waypoints: [[8.5706, 50.0333], [-5.0, 52.0], [-20.0, 53.0], [-40.0, 50.0], [-60.0, 45.0], [-73.7781, 40.6413]],
    countries: ["DE", "GB", "IE", "US", "US", "US"]
  },
  "DEL-FRA": {
    waypoints: [[77.1025, 28.5562], [69.0, 33.0], [55.0, 36.0], [40.0, 40.0], [25.0, 44.0], [8.5706, 50.0333]],
    countries: ["IN", "AF", "IR", "TR", "BG", "DE"]
  },
  "HYD-LHR": {
    waypoints: [[78.4294, 17.2403], [72.0, 24.0], [65.0, 31.0], [51.0, 35.5], [33.0, 39.5], [12.0, 48.0], [-0.4543, 51.47]],
    countries: ["IN", "IN", "PK", "IR", "TR", "DE", "GB"]
  },
};

function getCoord(iata: string): Coordinate {
  if (AIRPORT_COORDS[iata]) return AIRPORT_COORDS[iata];
  // Hash to a pseudo-random coordinate across the globe if unknown
  const h = hashCode(iata);
  return [(h % 360) - 180, ((h >> 4) % 180) - 90];
}

function mapCoordinateToCountry(coord: Coordinate): string | null {
  const [lng, lat] = coord;
  for (const region of COUNTRY_REGIONS) {
    const [minLng, minLat, maxLng, maxLat] = region.bounds;
    if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
      return region.code;
    }
  }
  return null;
}

function generateRoute(origin: string, dest: string): { waypoints: Coordinate[]; countries: string[] } {
  const originCoord = getCoord(origin);
  const destCoord = getCoord(dest);
  const originCountry = AIRPORT_COUNTRIES[origin] || "US";
  const destCountry = AIRPORT_COUNTRIES[dest] || "US";

  // Handle date-line crossing for routes that span the International Date Line
  // (e.g. HND→SFO goes eastward across the Pacific, not westward through Europe)
  let lngDiff = destCoord[0] - originCoord[0];
  if (Math.abs(lngDiff) > 180) {
    lngDiff = lngDiff > 0 ? lngDiff - 360 : lngDiff + 360;
  }

  const numWaypoints = 7;
  const waypoints: Coordinate[] = [];
  const countries: string[] = [];

  for (let i = 0; i < numWaypoints; i++) {
    const t = i / (numWaypoints - 1);
    let lng = originCoord[0] + t * lngDiff;
    const lat = originCoord[1] + t * (destCoord[1] - originCoord[1]);

    // Normalize longitude to [-180, 180]
    if (lng > 180) lng -= 360;
    if (lng < -180) lng += 360;

    waypoints.push([lng, lat]);

    if (i === 0) {
      countries.push(originCountry);
    } else if (i === numWaypoints - 1) {
      countries.push(destCountry);
    } else {
      const mapped = mapCoordinateToCountry([lng, lat]);
      countries.push(mapped || (t < 0.5 ? originCountry : destCountry));
    }
  }

  return { waypoints, countries };
}

function getRouteForAirports(origin: string, dest: string): { waypoints: Coordinate[]; countries: string[] } {
  const key = `${origin}-${dest}`;
  if (KNOWN_ROUTES[key]) return KNOWN_ROUTES[key];

  // Try reverse route
  const reverseKey = `${dest}-${origin}`;
  if (KNOWN_ROUTES[reverseKey]) {
    const reverse = KNOWN_ROUTES[reverseKey];
    return {
      waypoints: [...reverse.waypoints].reverse(),
      countries: [...reverse.countries].reverse()
    };
  }

  // Generate route with intermediate waypoints and country mapping
  return generateRoute(origin, dest);
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

    // Use known route or generate realistic waypoints with intermediate countries
    const route = getRouteForAirports(origin, dest);

    return {
      flightNumber: f.flight.iata || query,
      airline: f.airline.icao || "UNK",
      airlineName: f.airline.name || "Unknown Airline",
      aircraftType: f.aircraft?.icao || "B788",
      origin: origin,
      destination: dest,
      departureTime: f.departure.scheduled || new Date().toISOString(),
      arrivalTime: f.arrival.scheduled || new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      waypoints: route.waypoints,
      countries: route.countries
    };
  } catch (error) {
    console.error("AviationStack error:", error);
    return null;
  }
}

async function fetchAirLabsAPI(query: string): Promise<FlightDetails | null> {
  const apiKey = process.env.AIRLABS_API_KEY;
  if (!apiKey || apiKey === "your_airlabs_api_key_here") return null;

  try {
    const url = `https://airlabs.co/api/v9/flights?api_key=${apiKey}&flight_iata=${query}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.response || data.response.length === 0) return null;

    const f = data.response[0];
    const origin = f.dep_iata || "UNK";
    const dest = f.arr_iata || "UNK";

    const route = getRouteForAirports(origin, dest);

    return {
      flightNumber: f.flight_iata || query,
      airline: f.airline_icao || "UNK",
      airlineName: f.airline_icao || "Unknown Airline",
      aircraftType: f.aircraft_icao || "B788",
      origin,
      destination: dest,
      departureTime: f.dep_time || new Date().toISOString(),
      arrivalTime: f.arr_time || new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      waypoints: route.waypoints,
      countries: route.countries
    };
  } catch (error) {
    console.error("AirLabs API error:", error);
    return null;
  }
}

const MOCK_ROUTES = [
  { origin: "DEL", destination: "LHR", waypoints: [[77.1025, 28.5562], [74.3, 31.5], [69.2, 34.5], [51.4, 35.7], [32.9, 39.9], [11.8, 48.1], [-0.4543, 51.47]], countries: ["IN", "PK", "AF", "IR", "TR", "DE", "GB"] },
  { origin: "JFK", destination: "LHR", waypoints: [[-73.7781, 40.6413], [-55.0, 47.0], [-35.0, 51.0], [-15.0, 53.0], [-5.0, 52.0], [-0.4543, 51.47]], countries: ["US", "US", "US", "IE", "IE", "GB"] },
  { origin: "DXB", destination: "CDG", waypoints: [[55.3644, 25.2532], [50.0, 29.0], [44.0, 33.0], [35.0, 38.0], [20.0, 42.0], [10.0, 45.5], [2.5479, 49.0097]], countries: ["AE", "IR", "IQ", "TR", "GR", "IT", "FR"] },
  { origin: "SIN", destination: "SYD", waypoints: [[103.9893, 1.3644], [110.0, -5.0], [120.0, -12.0], [130.0, -20.0], [140.0, -28.0], [151.1772, -33.9461]], countries: ["SG", "ID", "ID", "AU", "AU", "AU"] },
  { origin: "HND", destination: "SFO", waypoints: [[139.7798, 35.5494], [155.0, 40.0], [170.0, 43.0], [-170.0, 45.0], [-150.0, 42.0], [-135.0, 39.0], [-122.3790, 37.6213]], countries: ["JP", "JP", "JP", "US", "US", "US", "US"] },
  { origin: "AMS", destination: "JNB", waypoints: [[4.7683, 52.3105], [5.0, 45.0], [8.0, 35.0], [15.0, 20.0], [20.0, 5.0], [25.0, -10.0], [28.2411, -26.1367]], countries: ["NL", "FR", "TN", "LY", "CD", "CD", "ZA"] }
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

  // 3. Primary real-time API (AviationStack)
  const realTime = await fetchAviationStack(key);
  if (realTime) {
    setPersistentFlight(key, realTime); // Store permanently
    cache.set(key, realTime, FLIGHT_TTL_MS);
    return realTime;
  }

  // 4. Fallback real-time API (AirLabs)
  const fallback = await fetchAirLabsAPI(key);
  if (fallback) {
    setPersistentFlight(key, fallback);
    cache.set(key, fallback, FLIGHT_TTL_MS);
    return fallback;
  }

  // 5. Static mock data
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

  // 6. Deterministic fallback generator
  const result = generateMockFlight(query);
  cache.set(key, result, FLIGHT_TTL_MS);
  return result;
}
