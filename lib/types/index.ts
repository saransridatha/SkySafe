export type RiskBand = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ThreatLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export type Coordinate = [number, number]; // [lng, lat]

export interface FlightDetails {
  flightNumber: string;
  airline: string;
  airlineName: string;
  aircraftType: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  waypoints: Coordinate[];
  countries: string[];
}

export interface AircraftProfile {
  icaoType: string;
  displayName: string;
  fleetSize: number;
  averageFleetAgeYears: number;
  incidents: number;
  hullLosses: number;
  hullLossRate: number;
  riskBand: RiskBand;
}

export interface AirlineProfile {
  code: string;
  name: string;
  safetyRank: number;
  iosa: boolean;
  bannedInEU: boolean;
  incidentsLast10Y: number;
  averageFleetAgeYears: number;
  riskBand: RiskBand;
}

export interface PathSegmentRisk {
  from: Coordinate;
  to: Coordinate;
  country: string;
  riskLevel: RiskBand;
}

export interface PathAnalysis {
  segments: PathSegmentRisk[];
  conflictZones: string[];
  overallPathRisk: RiskBand;
}

export interface NewsHeadline {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface NewsCountryResult {
  country: string;
  headlines: NewsHeadline[];
  threatLevel: ThreatLevel;
  threatKeywords: string[];
}

export interface NewsIntelligence {
  results: NewsCountryResult[];
}

export interface RiskScore {
  score: number;
  explanation: string;
  topRisks: string[];
  confidence: number;
}

export interface AggregatedRiskReport {
  flight: FlightDetails;
  aircraft: AircraftProfile;
  airline: AirlineProfile;
  pathAnalysis: PathAnalysis;
  news: NewsIntelligence;
  riskScore: RiskScore;
  generatedAt: string;
}
