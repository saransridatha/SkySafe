import flights from "@/data/flights.json";
import { TTLCache } from "@/lib/cache/lru";
import { FlightDetails, Coordinate } from "@/lib/types";
import { getPersistentFlight, setPersistentFlight } from "@/lib/cache/mariadb";
import { getMongoFlight, setMongoFlight, isMongoAvailable } from "@/lib/db/mongodb";

type FlightRecord = FlightDetails & { queryKeys: string[] };

const cache = new TTLCache<FlightDetails>(200);
const FLIGHT_TTL_MS = 6 * 60 * 60 * 1000;

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
  TK: { code: "THY", name: "Turkish Airlines" },
  THY: { code: "THY", name: "Turkish Airlines" },
  ET: { code: "ETH", name: "Ethiopian Airlines" },
  ETH: { code: "ETH", name: "Ethiopian Airlines" },
  QF: { code: "QFA", name: "Qantas" },
  QFA: { code: "QFA", name: "Qantas" },
  NH: { code: "ANA", name: "All Nippon Airways" },
  ANA: { code: "ANA", name: "All Nippon Airways" },
  CX: { code: "CPA", name: "Cathay Pacific" },
  CPA: { code: "CPA", name: "Cathay Pacific" },
};

// Extended airport database with coordinates and country codes
const AIRPORT_COORDS: Record<string, Coordinate> = {
  DEL: [77.1025, 28.5562], LHR: [-0.4543, 51.4700], JFK: [-73.7781, 40.6413],
  DXB: [55.3644, 25.2532], SIN: [103.9893, 1.3644], SYD: [151.1772, -33.9461],
  FRA: [8.5706, 50.0333], CDG: [2.5479, 49.0097], HND: [139.7798, 35.5494],
  SFO: [-122.3790, 37.6213], AMS: [4.7683, 52.3105], JNB: [28.2411, -26.1367],
  IAH: [-95.3368, 29.9902], HYD: [78.4294, 17.2403],
  BOM: [72.8679, 19.0896], MAA: [80.1699, 12.9941], BLR: [77.7068, 13.1986],
  CCU: [88.4467, 22.6520], DOH: [51.5654, 25.2609], KWI: [47.9790, 29.2266],
  IST: [28.8141, 40.9769], CAI: [31.4056, 30.1219], NBO: [36.9278, -1.3192],
  ADD: [38.7993, 8.9778], ACC: [- 0.1667, 5.6050], LOS: [3.3210, 6.5774],
  CPT: [-18.6024, -33.9715], PEK: [116.5975, 40.0725], PVG: [121.8052, 31.1443],
  HKG: [113.9150, 22.3080], ICN: [126.4505, 37.4602], NRT: [140.3860, 35.7647],
  BKK: [100.7501, 13.6900], KUL: [101.7099, 2.7456], CGK: [-106.6558, -6.1256],
  LAX: [-118.4085, 33.9425], ORD: [-87.9073, 41.9742], ATL: [-84.4281, 33.6407],
  MIA: [-80.2870, 25.7959], YYZ: [-79.6306, 43.6777], YVR: [-123.1840, 49.1967],
  GRU: [-46.4731, -23.4356], EZE: [-58.5357, -34.8222], LIM: [-77.1143, -12.0219],
  BOG: [-74.1469, 4.7016], SCL: [-70.7857, -33.3930], MEX: [-99.0721, 19.4363],
  FCO: [12.2389, 41.8003], MAD: [-3.5668, 40.4722], BCN: [2.0785, 41.2971],
  MUC: [11.7861, 48.3537], ZRH: [8.5492, 47.4582], VIE: [16.5697, 48.1103],
  CPH: [12.6561, 55.6180], ARN: [17.9186, 59.6519], HEL: [24.9633, 60.3172],
  OSL: [11.1004, 60.1976], DUB: [-6.2701, 53.4213], SVO: [37.4146, 55.9726],
  DME: [37.9063, 55.4088], TLV: [34.8854, 32.0055], RUH: [46.6988, 24.9578],
  JED: [39.1563, 21.6796], MCT: [58.2844, 23.5933], BAH: [50.6336, 26.2708],
  CMB: [79.8841, 7.1824], DAC: [90.3978, 23.8432], KTM: [85.3591, 27.6966],
  RGN: [96.1332, 16.9073], SGN: [106.6520, 10.8189], HAN: [105.8072, 21.2212],
  MNL: [121.0198, 14.5086], CEB: [123.9794, 10.3075],
};

const AIRPORT_COUNTRIES: Record<string, string> = {
  DEL: "IN", LHR: "GB", JFK: "US", DXB: "AE", SIN: "SG", SYD: "AU",
  FRA: "DE", CDG: "FR", HND: "JP", SFO: "US", AMS: "NL", JNB: "ZA",
  IAH: "US", HYD: "IN", BOM: "IN", MAA: "IN", BLR: "IN", CCU: "IN",
  DOH: "QA", KWI: "KW", IST: "TR", CAI: "EG", NBO: "KE", ADD: "ET",
  ACC: "GH", LOS: "NG", CPT: "ZA", PEK: "CN", PVG: "CN", HKG: "HK",
  ICN: "KR", NRT: "JP", BKK: "TH", KUL: "MY", CGK: "ID",
  LAX: "US", ORD: "US", ATL: "US", MIA: "US", YYZ: "CA", YVR: "CA",
  GRU: "BR", EZE: "AR", LIM: "PE", BOG: "CO", SCL: "CL", MEX: "MX",
  FCO: "IT", MAD: "ES", BCN: "ES", MUC: "DE", ZRH: "CH", VIE: "AT",
  CPH: "DK", ARN: "SE", HEL: "FI", OSL: "NO", DUB: "IE", SVO: "RU",
  DME: "RU", TLV: "IL", RUH: "SA", JED: "SA", MCT: "OM", BAH: "BH",
  CMB: "LK", DAC: "BD", KTM: "NP", RGN: "MM", SGN: "VN", HAN: "VN",
  MNL: "PH", CEB: "PH",
};

// Country center coordinates for reverse geocoding waypoints to countries
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
  TZ: { lat: -6.4, lng: 34.9, radius: 5 }, UG: { lat: 1.4, lng: 32.3, radius: 3 },
  CD: { lat: -4.0, lng: 21.8, radius: 9 }, ZA: { lat: -30.6, lng: 25.0, radius: 8 },
  GB: { lat: 54.0, lng: -2.0, radius: 4 }, FR: { lat: 46.0, lng: 2.2, radius: 5 },
  DE: { lat: 51.2, lng: 10.4, radius: 4 }, NL: { lat: 52.1, lng: 5.3, radius: 2 },
  BE: { lat: 50.5, lng: 4.5, radius: 1.5 }, CH: { lat: 46.8, lng: 8.2, radius: 2 },
  AT: { lat: 47.5, lng: 14.5, radius: 2.5 }, IT: { lat: 42.5, lng: 12.5, radius: 5 },
  ES: { lat: 40.0, lng: -4.0, radius: 5 }, PT: { lat: 39.4, lng: -8.2, radius: 3 },
  GR: { lat: 39.1, lng: 21.8, radius: 3 }, BG: { lat: 42.7, lng: 25.5, radius: 2.5 },
  RO: { lat: 45.9, lng: 25.0, radius: 3 }, UA: { lat: 48.4, lng: 31.2, radius: 6 },
  PL: { lat: 52.0, lng: 19.0, radius: 4 }, CZ: { lat: 49.8, lng: 15.5, radius: 2 },
  HU: { lat: 47.2, lng: 19.5, radius: 2 }, SK: { lat: 48.7, lng: 19.7, radius: 1.5 },
  RU: { lat: 61.5, lng: 60.0, radius: 25 }, FI: { lat: 64.0, lng: 26.0, radius: 5 },
  SE: { lat: 62.0, lng: 15.0, radius: 6 }, NO: { lat: 64.0, lng: 12.0, radius: 6 },
  DK: { lat: 56.0, lng: 10.0, radius: 2.5 }, IE: { lat: 53.4, lng: -8.0, radius: 3 },
  IS: { lat: 65.0, lng: -18.0, radius: 3 }, CA: { lat: 56.0, lng: -96.0, radius: 20 },
  US: { lat: 38.0, lng: -97.0, radius: 20 }, MX: { lat: 23.6, lng: -102.5, radius: 10 },
  BR: { lat: -14.2, lng: -51.9, radius: 18 }, AR: { lat: -38.4, lng: -63.6, radius: 12 },
  CL: { lat: -35.7, lng: -71.5, radius: 8 }, CN: { lat: 35.9, lng: 104.2, radius: 15 },
  JP: { lat: 36.2, lng: 138.3, radius: 5 }, KR: { lat: 35.9, lng: 127.8, radius: 3 },
  TH: { lat: 15.9, lng: 101.0, radius: 5 }, MY: { lat: 4.2, lng: 101.9, radius: 4 },
  SG: { lat: 1.4, lng: 103.8, radius: 0.5 }, ID: { lat: -0.8, lng: 113.9, radius: 12 },
  AU: { lat: -25.3, lng: 133.8, radius: 16 }, NZ: { lat: -40.9, lng: 174.9, radius: 5 },
  PH: { lat: 12.9, lng: 121.8, radius: 5 }, VN: { lat: 14.1, lng: 108.3, radius: 5 },
  MM: { lat: 19.8, lng: 96.0, radius: 5 }, BD: { lat: 23.7, lng: 90.4, radius: 3 },
  NP: { lat: 28.4, lng: 84.1, radius: 2.5 }, LK: { lat: 7.9, lng: 80.8, radius: 2 },
  QA: { lat: 25.4, lng: 51.2, radius: 1 }, BH: { lat: 26.1, lng: 50.6, radius: 0.5 },
  KW: { lat: 29.3, lng: 47.5, radius: 1 }, GE: { lat: 42.3, lng: 43.4, radius: 2 },
  AM: { lat: 40.1, lng: 44.5, radius: 1.5 }, AZ: { lat: 40.1, lng: 47.6, radius: 3 },
  TM: { lat: 39.0, lng: 59.6, radius: 5 }, UZ: { lat: 41.4, lng: 64.6, radius: 5 },
  KG: { lat: 41.2, lng: 74.8, radius: 3 }, TJ: { lat: 38.9, lng: 71.3, radius: 2.5 },
  NG: { lat: 9.1, lng: 8.7, radius: 6 }, GH: { lat: 7.9, lng: -1.0, radius: 3 },
  TN: { lat: 34.0, lng: 9.5, radius: 3 }, DZ: { lat: 28.0, lng: 1.7, radius: 10 },
  MA: { lat: 31.8, lng: -7.1, radius: 5 }, CO: { lat: 4.6, lng: -74.3, radius: 6 },
  PE: { lat: -9.2, lng: -75.0, radius: 7 }, HK: { lat: 22.3, lng: 114.2, radius: 0.5 },
};

function getCoord(iata: string): Coordinate {
  if (AIRPORT_COORDS[iata]) return AIRPORT_COORDS[iata];
  const h = hashCode(iata);
  return [(h % 360) - 180, ((h >> 4) % 180) - 90];
}

// ──── Great-circle route generation ────
// Computes intermediate points along the great-circle (shortest path on a sphere)
// Uses the standard spherical interpolation formula from Aviation Formulary
function greatCircleWaypoints(origin: Coordinate, dest: Coordinate, numPoints: number = 20): Coordinate[] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const lng1 = toRad(origin[0]), lat1 = toRad(origin[1]);
  const lng2 = toRad(dest[0]), lat2 = toRad(dest[1]);

  // Central angle using Vincenty formula (numerically stable)
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dLng / 2), 2)
  ));

  if (d < 1e-10) return [origin, dest];

  const points: Coordinate[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    // Proper spherical interpolation using both endpoints' full coordinates
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lng = Math.atan2(y, x);

    points.push([toDeg(lng), toDeg(lat)]);
  }

  return points;
}

// Reverse-geocode a coordinate to a country code using simple distance check
function coordToCountry(coord: Coordinate): string | null {
  const lng = coord[0], lat = coord[1];
  let bestCountry: string | null = null;
  let bestScore = Infinity;

  for (const [code, center] of Object.entries(COUNTRY_CENTERS)) {
    const dLat = lat - center.lat;
    const dLng = lng - center.lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    // Must be within the country's rough radius
    if (dist < center.radius && dist < bestScore) {
      bestScore = dist;
      bestCountry = code;
    }
  }

  return bestCountry;
}

// Determine all countries the great-circle route passes through
function getRouteCountries(waypoints: Coordinate[], originCode: string, destCode: string): string[] {
  const countries: string[] = [];
  const seen = new Set<string>();

  // Always include origin country first
  const originCountry = AIRPORT_COUNTRIES[originCode];
  if (originCountry) {
    countries.push(originCountry);
    seen.add(originCountry);
  }

  // Check each waypoint
  for (const wp of waypoints) {
    const country = coordToCountry(wp);
    if (country && !seen.has(country)) {
      seen.add(country);
      countries.push(country);
    }
  }

  // Always include destination country last
  const destCountry = AIRPORT_COUNTRIES[destCode];
  if (destCountry && !seen.has(destCountry)) {
    countries.push(destCountry);
  }

  return countries;
}

// ──── AviationStack with fallback keys ────
function getAviationStackKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.AVIATIONSTACK_API_KEY;
  if (primary && primary !== "your_aviationstack_api_key_here") {
    keys.push(primary);
  }
  const fallbacks = process.env.AVIATIONSTACK_FALLBACK_KEYS;
  if (fallbacks) {
    for (const k of fallbacks.split(",")) {
      const trimmed = k.trim();
      if (trimmed && trimmed !== "your_aviationstack_api_key_here") {
        keys.push(trimmed);
      }
    }
  }
  return keys;
}

// Track which keys have failed recently (overlimit/error)
const failedKeys = new Map<string, number>();
const KEY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown for failed keys

async function fetchAviationStack(query: string): Promise<FlightDetails | null> {
  const keys = getAviationStackKeys();
  if (keys.length === 0) return null;

  const now = Date.now();

  for (const apiKey of keys) {
    // Skip keys that failed recently
    const failedAt = failedKeys.get(apiKey);
    if (failedAt && now - failedAt < KEY_COOLDOWN_MS) continue;

    try {
      const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${query}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

      if (response.status === 429 || response.status === 403) {
        // Rate limited / over quota – mark key as failed, try next
        console.warn(`AviationStack key ending in ...${apiKey.slice(-4)} hit rate limit`);
        failedKeys.set(apiKey, now);
        continue;
      }

      if (!response.ok) {
        failedKeys.set(apiKey, now);
        continue;
      }

      const data = await response.json();

      // Check for API-level error responses
      if (data.error) {
        console.warn(`AviationStack API error: ${data.error.message || JSON.stringify(data.error)}`);
        if (data.error.code === "usage_limit_reached" || data.error.code === "rate_limit_reached") {
          failedKeys.set(apiKey, now);
          continue;
        }
        failedKeys.set(apiKey, now);
        continue;
      }

      if (!data.data || data.data.length === 0) return null;

      const f = data.data[0];
      const origin = f.departure?.iata || "UNK";
      const dest = f.arrival?.iata || "UNK";

      const originCoord = getCoord(origin);
      const destCoord = getCoord(dest);

      // Generate realistic great-circle waypoints
      const waypoints = greatCircleWaypoints(originCoord, destCoord, 24);
      const countries = getRouteCountries(waypoints, origin, dest);

      return {
        flightNumber: f.flight?.iata || query,
        airline: f.airline?.icao || "UNK",
        airlineName: f.airline?.name || "Unknown Airline",
        aircraftType: f.aircraft?.icao || "B788",
        origin,
        destination: dest,
        departureTime: f.departure?.scheduled || new Date().toISOString(),
        arrivalTime: f.arrival?.scheduled || new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
        waypoints,
        countries,
      };
    } catch (error) {
      console.error(`AviationStack error with key ...${apiKey.slice(-4)}:`, error);
      failedKeys.set(apiKey, now);
      continue;
    }
  }

  return null;
}

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

  // Pick origin/dest from the airport database based on hash
  const airportCodes = Object.keys(AIRPORT_COORDS);
  const originCode = airportCodes[hash % airportCodes.length];
  const destCode = airportCodes[(hash >> 3) % airportCodes.length] === originCode
    ? airportCodes[((hash >> 3) + 1) % airportCodes.length]
    : airportCodes[(hash >> 3) % airportCodes.length];

  const originCoord = AIRPORT_COORDS[originCode];
  const destCoord = AIRPORT_COORDS[destCode];
  const waypoints = greatCircleWaypoints(originCoord, destCoord, 24);
  const countries = getRouteCountries(waypoints, originCode, destCode);

  return {
    flightNumber: normalized,
    airline: airlineInfo.code,
    airlineName: airlineInfo.name,
    aircraftType,
    origin: originCode,
    destination: destCode,
    departureTime: new Date().toISOString(),
    arrivalTime: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    waypoints,
    countries,
  };
}

// Cache to both SQLite and MongoDB for maximum durability
async function persistFlight(key: string, flight: FlightDetails): Promise<void> {
  await setPersistentFlight(key, flight);
  try {
    if (await isMongoAvailable()) {
      await setMongoFlight(key, flight);
    }
  } catch (e) {
    console.error("MongoDB persist error (non-fatal):", e);
  }
}

export async function searchFlight(query: string): Promise<FlightDetails> {
  const key = normalizeQuery(query);

  const isFlightNumber = /^[A-Z]{2,3}\d{1,4}$/.test(key);
  const isRoute = /^[A-Z]{3}[^A-Z0-9]*[A-Z]{3}$/.test(key) && key.length >= 6 && key.length <= 8;

  if (!isFlightNumber && !isRoute) {
    throw new Error("Invalid flight code or route format. Please enter a valid flight number (e.g., AI 101) or a 3-letter airport route (e.g., DEL-LHR).");
  }

  // 1. Memory cache
  const cached = cache.get(key);
  if (cached) return cached;

  // 2. MariaDB persistent cache
  const persistent = await getPersistentFlight(key);
  if (persistent) {
    // Re-compute waypoints/countries if the cached data has few waypoints (old format)
    if (persistent.waypoints.length <= 6) {
      const originCoord = getCoord(persistent.origin);
      const destCoord = getCoord(persistent.destination);
      persistent.waypoints = greatCircleWaypoints(originCoord, destCoord, 24);
      persistent.countries = getRouteCountries(persistent.waypoints, persistent.origin, persistent.destination);
      await persistFlight(key, persistent);
    }
    cache.set(key, persistent, FLIGHT_TTL_MS);
    return persistent;
  }

  // 3. MongoDB cache
  try {
    if (await isMongoAvailable()) {
      const mongoFlight = await getMongoFlight(key);
      if (mongoFlight) {
        if (mongoFlight.waypoints.length <= 6) {
          const originCoord = getCoord(mongoFlight.origin);
          const destCoord = getCoord(mongoFlight.destination);
          mongoFlight.waypoints = greatCircleWaypoints(originCoord, destCoord, 24);
          mongoFlight.countries = getRouteCountries(mongoFlight.waypoints, mongoFlight.origin, mongoFlight.destination);
        }
        await setPersistentFlight(key, mongoFlight);
        cache.set(key, mongoFlight, FLIGHT_TTL_MS);
        return mongoFlight;
      }
    }
  } catch (e) {
    console.error("MongoDB read error (non-fatal):", e);
  }

  // 4. AviationStack API (with fallback keys)
  const realTime = await fetchAviationStack(key);
  if (realTime) {
    await persistFlight(key, realTime);
    cache.set(key, realTime, FLIGHT_TTL_MS);
    return realTime;
  }

  // 5. Static JSON data
  const all = flights as FlightRecord[];
  const found = all.find((item) =>
    item.queryKeys.map(normalizeQuery).includes(key)
  );

  if (found) {
    const originCoord = getCoord(found.origin);
    const destCoord = getCoord(found.destination);
    const waypoints = greatCircleWaypoints(originCoord, destCoord, 24);
    const countries = getRouteCountries(waypoints, found.origin, found.destination);

    const result: FlightDetails = {
      flightNumber: found.flightNumber,
      airline: found.airline,
      airlineName: found.airlineName,
      aircraftType: found.aircraftType,
      origin: found.origin,
      destination: found.destination,
      departureTime: found.departureTime,
      arrivalTime: found.arrivalTime,
      waypoints,
      countries,
    };
    await persistFlight(key, result);
    cache.set(key, result, FLIGHT_TTL_MS);
    return result;
  }

  // 6. Deterministic mock generator (also with great-circle routing)
  const result = generateMockFlight(query);
  cache.set(key, result, FLIGHT_TTL_MS);
  return result;
}
