import { NextRequest } from "next/server";
import { countriesQuerySchema } from "@/lib/schemas";
import { getNewsIntel } from "@/lib/services/newsIntel";
import { errorResponse, ok, parseCountries } from "@/lib/utils/http";
import { getRequestIp } from "@/lib/utils/request";
import { checkRateLimit } from "@/lib/utils/rateLimit";

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  if (!checkRateLimit(`news:${ip}`, 30)) {
    return errorResponse("Rate limit exceeded", 429, 429);
  }

  const raw = request.nextUrl.searchParams.get("countries") ?? "";
  const parsed = countriesQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse("Invalid countries query", 400);
  }

  const countries = parseCountries(parsed.data);
  if (!countries.length) {
    return errorResponse("No valid country codes provided", 400);
  }

  try {
    const intel = await getNewsIntel(countries);
    return ok(intel);
  } catch (error) {
    const message = error instanceof Error ? error.message : "News lookup failed";
    return errorResponse(message, 500, 500);
  }
}
