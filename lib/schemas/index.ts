import { z } from "zod";

const coordinateSchema = z.tuple([z.number(), z.number()]);

export const flightSearchQuerySchema = z
  .string()
  .min(2)
  .max(20)
  .regex(/^[A-Za-z0-9\-\s]+$/);

export const countriesQuerySchema = z.string().min(2).max(200);

export const pathAnalyzeBodySchema = z.object({
  origin: coordinateSchema,
  destination: coordinateSchema,
  waypoints: z.array(coordinateSchema),
  countries: z.array(z.string().length(2)).min(1)
});

export const riskScoreBodySchema = z.object({
  flight: z.object({
    flightNumber: z.string(),
    airline: z.string(),
    airlineName: z.string(),
    aircraftType: z.string(),
    origin: z.string(),
    destination: z.string(),
    departureTime: z.string(),
    arrivalTime: z.string(),
    waypoints: z.array(coordinateSchema),
    countries: z.array(z.string().length(2))
  }),
  aircraft: z.object({
    icaoType: z.string(),
    displayName: z.string(),
    fleetSize: z.number(),
    averageFleetAgeYears: z.number(),
    incidents: z.number(),
    hullLosses: z.number(),
    hullLossRate: z.number(),
    riskBand: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
  }),
  airline: z.object({
    code: z.string(),
    name: z.string(),
    safetyRank: z.number(),
    iosa: z.boolean(),
    bannedInEU: z.boolean(),
    incidentsLast10Y: z.number(),
    averageFleetAgeYears: z.number(),
    riskBand: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
  }),
  pathAnalysis: z.object({
    segments: z.array(
      z.object({
        from: coordinateSchema,
        to: coordinateSchema,
        country: z.string(),
        riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
      })
    ),
    conflictZones: z.array(z.string()),
    overallPathRisk: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
  }),
  news: z.object({
    results: z.array(
      z.object({
        country: z.string(),
        headlines: z.array(
          z.object({
            title: z.string(),
            source: z.string(),
            url: z.string().url(),
            publishedAt: z.string()
          })
        ),
        threatLevel: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]),
        threatKeywords: z.array(z.string())
      })
    )
  })
});
