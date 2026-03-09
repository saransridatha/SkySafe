import { NextRequest } from "next/server";
import { flightSearchQuerySchema } from "@/lib/schemas";
import { searchFlight } from "@/lib/services/flightData";
import { errorResponse, ok } from "@/lib/utils/http";
import { getRequestIp } from "@/lib/utils/request";
import { checkRateLimit } from "@/lib/utils/rateLimit";

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  if (!checkRateLimit(`flight-search:${ip}`, 30)) {
    return errorResponse("Rate limit exceeded", 429, 429);
  }

  const raw = request.nextUrl.searchParams.get("q") ?? "";
  const parsed = flightSearchQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse("Invalid query parameter q", 400);
  }

  try {
    const flight = await searchFlight(parsed.data);
    return ok(flight);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resolve flight";
    return errorResponse(message, 404, 404);
  }
}
