import { NextRequest } from "next/server";
import { getAirlineReliability } from "@/lib/services/airlineReliability";
import { errorResponse, ok } from "@/lib/utils/http";
import { getRequestIp } from "@/lib/utils/request";
import { checkRateLimit } from "@/lib/utils/rateLimit";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const ip = getRequestIp(request);
  if (!checkRateLimit(`airline:${ip}`, 30)) {
    return errorResponse("Rate limit exceeded", 429, 429);
  }

  try {
    const profile = await getAirlineReliability(params.code);
    return ok(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Airline lookup failed";
    return errorResponse(message, 404, 404);
  }
}
