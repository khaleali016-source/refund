import { NextResponse } from "next/server";
import { z } from "zod";
import { auditLog } from "@/lib/audit";
import { fail } from "@/lib/api";
import { hashPassword, randomSaltHex, timingSafeEqual } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { sessionCookieName, sessionMaxAge, serializeSession } from "@/lib/session";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";

const schema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
});

async function ensureDefaultAdmin() {
  const username = process.env["ADMIN_USERNAME"];
  const password = process.env["ADMIN_PASSWORD"];
  if (!username || !password) return;
  const { data } = await db().from("admin_users").select("id").ilike("username", username).maybeSingle();
  if (data) return;
  const salt = randomSaltHex();
  await db()
    .from("admin_users")
    .insert({ username, password_salt: salt, password_hash: hashPassword(password, salt) });
}

export async function POST(request: Request) {
  if (!(await rateLimit("admin-login", request.headers, 10, 600))) {
    return fail("محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.", 429);
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("يرجى إدخال اسم المستخدم وكلمة المرور.");

  await ensureDefaultAdmin();
  const { data: account } = await db()
    .from("admin_users")
    .select("username, password_hash, password_salt")
    .ilike("username", parsed.data.username)
    .maybeSingle();

  const valid =
    account &&
    timingSafeEqual(
      account.password_hash as string,
      hashPassword(parsed.data.password, account.password_salt as string),
    );

  if (!valid) {
    await auditLog("admin.login_failed", "Guest", { username: parsed.data.username });
    return fail("بيانات الدخول غير صحيحة.", 401);
  }

  const username = account.username as string;
  await auditLog("admin.login_success", username);
  const response = NextResponse.json({ ok: true, username });
  response.cookies.set(sessionCookieName, serializeSession({ username, at: Date.now() }), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge,
  });
  return response;
}
