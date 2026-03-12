import { NextRequest } from "next/server";
import { login } from "@/lib/services/auth";
import { errorResponse, ok } from "@/lib/utils/http";
import { getRequestIp } from "@/lib/utils/request";
import { checkRateLimit } from "@/lib/utils/rateLimit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  if (!checkRateLimit(`auth-login:${ip}`, 20)) {
    return errorResponse("Rate limit exceeded", 429, 429);
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join(", ");
      return errorResponse(msg, 400);
    }

    const { email, password } = parsed.data;
    const result = await login(email, password);
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return errorResponse("Invalid email or password", 401, 401);
  }
}
