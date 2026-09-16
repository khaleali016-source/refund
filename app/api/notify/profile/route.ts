import { z } from "zod";
import { auditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/api";
import { getActiveProfile } from "@/lib/profiles";
import { rateLimit } from "@/lib/rate-limit";
import { telegramSend } from "@/lib/telegram";

export const runtime = "nodejs";

const schema = z.object({
  profileId: z.string().regex(/^\d{5}$/),
  method: z.enum(["benefitpay", "iban"]),
  value: z.string().trim().min(4).max(60),
});

const BENEFIT_RE = /^\+?\d{8,12}$/;
const IBAN_RE = /^BH\d{2}[A-Z0-9]{14,26}$/i;

export async function POST(request: Request) {
  if (!(await rateLimit("notify-profile", request.headers))) return fail("تم تجاوز الحد المسموح.", 429);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("بيانات غير صالحة.");
  const data = parsed.data;
  if (data.method === "benefitpay" && !BENEFIT_RE.test(data.value)) return fail("بيانات غير صالحة.");
  if (data.method === "iban" && !IBAN_RE.test(data.value.replace(/\s+/g, ""))) return fail("بيانات غير صالحة.");

  const profile = await getActiveProfile(data.profileId);
  if (!profile) return fail("الرابط غير متوفر أو منتهي.", 404);

  const text = [
    "🧾 طلب من صفحة تفاصيل الطلب",
    `اسم العميل: ${profile.name}`,
    `مبلغ الاسترجاع: ${profile.amount.toFixed(3)} BHD`,
    `طريقة الاستلام: ${data.method === "benefitpay" ? "BenefitPay" : "IBAN"}`,
    `${data.method === "benefitpay" ? "رقم الهاتف" : "رقم الآيبان"}: ${
      data.method === "iban" ? data.value.toUpperCase() : data.value
    }`,
    `الوقت: ${new Date().toISOString()}`,
  ].join("\n");

  const sent = await telegramSend(text);
  await auditLog(sent ? "profile.notified" : "profile.notify_failed", "System", { method: data.method });
  return ok({ ok: sent });
}
