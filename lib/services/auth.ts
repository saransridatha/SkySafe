import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  findUserByEmail,
  createUser,
  initUserTable,
} from "@/lib/db/mariadb";

const SALT_ROUNDS = 12;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "your_jwt_secret_here") {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export interface AuthPayload {
  userId: number;
  email: string;
  name: string;
}

export interface AuthResult {
  token: string;
  user: { id: number; email: string; name: string };
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  await initUserTable();

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const userId = await createUser(email, passwordHash, name);

  const token = jwt.sign(
    { userId, email, name } as AuthPayload,
    getJwtSecret(),
    { expiresIn: "7d" }
  );

  return {
    token,
    user: { id: userId, email, name },
  };
}

export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  await initUserTable();

  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name } as AuthPayload,
    getJwtSecret(),
    { expiresIn: "7d" }
  );

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, getJwtSecret()) as AuthPayload;
}
