import { NextRequest } from "next/server";
import { pathAnalyzeBodySchema } from "@/lib/schemas";
import { analyzePath } from "@/lib/services/pathRisk";
import { errorResponse, ok } from "@/lib/utils/http";
import { getRequestIp } from "@/lib/utils/request";
import { checkRateLimit } from "@/lib/utils/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  if (!checkRateLimit(`path-analyze:${ip}`, 30)) {
    return errorResponse("Rate limit exceeded", 429, 429);
  }

  const json = await request.json().catch(() => null);
  const parsed = pathAnalyzeBodySchema.safeParse(json);

  if (!parsed.success) {
    return errorResponse("Invalid body for path analysis", 400);
  }

  try {
    const output = await analyzePath(parsed.data);
    return ok(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Path analysis failed";
    return errorResponse(message, 500, 500);
  }
}
