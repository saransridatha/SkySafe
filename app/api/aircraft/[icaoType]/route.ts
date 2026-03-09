import { NextRequest } from "next/server";
import { getAircraftSafety } from "@/lib/services/aircraftSafety";
import { errorResponse, ok } from "@/lib/utils/http";
import { getRequestIp } from "@/lib/utils/request";
import { checkRateLimit } from "@/lib/utils/rateLimit";

export async function GET(
  request: NextRequest,
  { params }: { params: { icaoType: string } }
) {
  const ip = getRequestIp(request);
  if (!checkRateLimit(`aircraft:${ip}`, 30)) {
    return errorResponse("Rate limit exceeded", 429, 429);
  }

  try {
    const profile = await getAircraftSafety(params.icaoType);
    return ok(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Aircraft lookup failed";
    return errorResponse(message, 404, 404);
  }
}
