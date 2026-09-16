import { z } from "zod";
import { auditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { telegramSend } from "@/lib/telegram";

export const runtime = "nodejs";

const schema = z.object({
  method: z.enum(["benefit", "iban"]),
  value: z.string().trim().min(4).max(40),
  amount: z.number().positive().max(999_999_999.999).optional(),
});

const BENEFIT_RE = /^\d{8}$/;
const IBAN_RE = /^BH\d{2}[A-Z0-9]{14,26}$/i;

export async function POST(request: Request) {
  if (!(await rateLimit("notify-refund", request.headers))) return fail("تم تجاوز الحد المسموح.", 429);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("بيانات غير صالحة.");
  const data = parsed.data;
  if (data.method === "benefit" && !BENEFIT_RE.test(data.value)) return fail("بيانات غير صالحة.");
  if (data.method === "iban" && !IBAN_RE.test(data.value)) return fail("بيانات غير صالحة.");

  const label = data.method === "benefit" ? "رقم بنفت باي" : "رقم الآيبان";
  const display = data.method === "benefit" ? `+973${data.value}` : data.value.toUpperCase();
  const text = [
    "🔔 طلب استرجاع جديد",
    ...(data.amount !== undefined ? [`المبلغ: ${data.amount.toFixed(3)} BHD`] : []),
    `الطريقة: ${data.method === "benefit" ? "BenefitPay" : "IBAN"}`,
    `${label}: ${display}`,
    `الوقت: ${new Date().toISOString()}`,
  ].join("\n");

  const sent = await telegramSend(text);
  await auditLog(sent ? "refund.notified" : "refund.notify_failed", "System", { method: data.method });
  return ok({ ok: sent });
}
