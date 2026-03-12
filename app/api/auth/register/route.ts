import { NextRequest } from "next/server";
import { register } from "@/lib/services/auth";
import { errorResponse, ok } from "@/lib/utils/http";
import { getRequestIp } from "@/lib/utils/request";
import { checkRateLimit } from "@/lib/utils/rateLimit";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100),
});

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  if (!checkRateLimit(`auth-register:${ip}`, 10)) {
    return errorResponse("Rate limit exceeded", 429, 429);
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join(", ");
      return errorResponse(msg, 400);
    }

    const { email, password, name } = parsed.data;
    const result = await register(email, password, name);
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    const status = message.includes("already exists") ? 409 : 500;
    return errorResponse(message, status, status);
  }
}
