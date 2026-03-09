import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(error: string, code: number, status = 400) {
  return NextResponse.json({ error, code }, { status });
}

export function parseCountries(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim().toUpperCase())
    .filter((v) => /^[A-Z]{2}$/.test(v));
}
