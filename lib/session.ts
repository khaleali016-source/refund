import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 8;

type SessionData = { username: string; at: number };

function secret(): string {
  const value = process.env["ADMIN_SESSION_SECRET"];
  if (!value) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return value;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function serializeSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parseSession(token: string | undefined): SessionData | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (expected.length !== signature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionData;
    if (!data?.username || Date.now() - data.at > MAX_AGE * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

export const sessionCookieName = COOKIE;
export const sessionMaxAge = MAX_AGE;

export async function currentAdmin(): Promise<string | null> {
  const store = await cookies();
  return parseSession(store.get(COOKIE)?.value)?.username ?? null;
}

/** يرمي استثناءً عند عدم وجود جلسة مدير صالحة. */
export async function requireAdmin(): Promise<string> {
  const admin = await currentAdmin();
  if (!admin) throw new Error("Unauthorized");
  return admin;
}
