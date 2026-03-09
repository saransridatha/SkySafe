import { NextRequest } from "next/server";
import { flightSearchQuerySchema } from "@/lib/schemas";
import { buildRiskReport } from "@/lib/services/reportOrchestrator";
import { errorResponse, ok } from "@/lib/utils/http";
import { getRequestIp } from "@/lib/utils/request";
import { checkRateLimit } from "@/lib/utils/rateLimit";

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  if (!checkRateLimit(`risk-report:${ip}`, 30)) {
    return errorResponse("Rate limit exceeded", 429, 429);
  }

  const flight = request.nextUrl.searchParams.get("flight") ?? "";
  const parsed = flightSearchQuerySchema.safeParse(flight);

  if (!parsed.success) {
    return errorResponse("Invalid flight query", 400);
  }

  try {
    const report = await buildRiskReport(parsed.data);
    return ok(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build report";
    return errorResponse(message, 500, 500);
  }
}
