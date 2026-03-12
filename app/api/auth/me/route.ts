import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/services/auth";
import { errorResponse, ok } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse("Missing or invalid authorization header", 401, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    return ok({ user: { id: payload.userId, email: payload.email, name: payload.name } });
  } catch {
    return errorResponse("Invalid or expired token", 401, 401);
  }
}
