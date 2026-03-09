import { NextRequest } from "next/server";
import { riskScoreBodySchema } from "@/lib/schemas";
import { scoreRisk } from "@/lib/services/geminiScorer";
import { errorResponse, ok } from "@/lib/utils/http";
import { getRequestIp } from "@/lib/utils/request";
import { checkRateLimit } from "@/lib/utils/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  if (!checkRateLimit(`risk-score:${ip}`, 30)) {
    return errorResponse("Rate limit exceeded", 429, 429);
  }

  const json = await request.json().catch(() => null);
  const parsed = riskScoreBodySchema.safeParse(json);

  if (!parsed.success) {
    return errorResponse("Invalid body for risk score", 400);
  }

  try {
    const score = await scoreRisk(parsed.data);
    return ok(score);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scoring failed";
    return errorResponse(message, 500, 500);
  }
}
