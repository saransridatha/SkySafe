import { TTLCache } from "@/lib/cache/lru";
import { AirlineProfile, AircraftProfile, FlightDetails, NewsIntelligence, PathAnalysis, RiskScore } from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

type ScoringInput = {
  flight: FlightDetails;
  aircraft: AircraftProfile;
  airline: AirlineProfile;
  pathAnalysis: PathAnalysis;
  news: NewsIntelligence;
};

const cache = new TTLCache<RiskScore>(200);
const TTL_MS = 6 * 60 * 60 * 1000;

function keyOf(input: ScoringInput): string {
  return `${input.flight.flightNumber}:${new Date().toISOString().slice(0, 10)}`;
}

function fallbackScore(input: ScoringInput): RiskScore {
  const pathScore = input.pathAnalysis.overallPathRisk === "CRITICAL" ? 4 : input.pathAnalysis.overallPathRisk === "HIGH" ? 3 : input.pathAnalysis.overallPathRisk === "MEDIUM" ? 2 : 1;
  const airlineScore = input.airline.riskBand === "CRITICAL" ? 3 : input.airline.riskBand === "HIGH" ? 2 : input.airline.riskBand === "MEDIUM" ? 1 : 0;
  const aircraftScore = input.aircraft.riskBand === "CRITICAL" ? 2 : input.aircraft.riskBand === "HIGH" ? 1.5 : input.aircraft.riskBand === "MEDIUM" ? 1 : 0;
  const newsScore = input.news.results.reduce((acc, r) => {
    if (r.threatLevel === "HIGH") return acc + 1;
    if (r.threatLevel === "MEDIUM") return acc + 0.6;
    if (r.threatLevel === "LOW") return acc + 0.2;
    return acc;
  }, 0);

  const raw = Math.min(10, 1 + pathScore + airlineScore + aircraftScore + newsScore / 2);
  const rounded = Math.max(1, Math.min(10, Math.round(raw * 10) / 10));

  return {
    score: rounded,
    explanation: `[FALLBACK] Risk is driven mainly by ${input.pathAnalysis.overallPathRisk.toLowerCase()} path exposure and current route-country news signals. Airline and aircraft profiles are included to balance operational safety with route-level threat context.`,
    topRisks: [
      `Path risk: ${input.pathAnalysis.overallPathRisk}`,
      `Airline risk band: ${input.airline.riskBand}`,
      `Aircraft risk band: ${input.aircraft.riskBand}`
    ],
    confidence: 0.71
  };
}

export async function scoreRisk(input: ScoringInput): Promise<RiskScore> {
  const cacheKey = keyOf(input);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.warn("Gemini API key not configured, using fallback scoring.");
    const scored = fallbackScore(input);
    cache.set(cacheKey, scored, TTL_MS);
    return scored;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      As an aviation risk analyst, provide a safety score (1-10, where 10 is highest risk) for this flight.
      
      Flight Details:
      - Flight: ${input.flight.flightNumber} (${input.flight.airlineName})
      - Aircraft: ${input.aircraft.displayName} (Hull loss rate: ${input.aircraft.hullLossRate})
      - Path Risk: ${input.pathAnalysis.overallPathRisk} (Conflict zones: ${input.pathAnalysis.conflictZones.join(", ") || "None"})
      - Airline Risk: ${input.airline.riskBand} (Safety rank: ${input.airline.safetyRank})
      
      News Intelligence:
      ${input.news.results.map(r => `- ${r.country}: ${r.threatLevel} threat. Headlines: ${r.headlines.map(h => h.title).join("; ")}`).join("\n")}

      Return ONLY a JSON object with this structure:
      {
        "score": number,
        "explanation": "brief explanation",
        "topRisks": ["risk 1", "risk 2", "risk 3"],
        "confidence": number (0-1)
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleaned = text.replace(/```json|```/g, "").trim();
    const scored = JSON.parse(cleaned) as RiskScore;
    
    cache.set(cacheKey, scored, TTL_MS);
    return scored;
  } catch (error) {
    console.error("Gemini API error:", error);
    const scored = fallbackScore(input);
    cache.set(cacheKey, scored, TTL_MS);
    return scored;
  }
}
