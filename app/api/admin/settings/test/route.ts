import { adminOr401, ok } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { telegramSend } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST() {
  const auth = await adminOr401();
  if ("response" in auth) return auth.response;
  const sent = await telegramSend(
    `✅ اختبار اتصال ناجح من لوحة التحكم\nالوقت: ${new Date().toISOString()}`,
  );
  await auditLog(sent ? "telegram.test_success" : "telegram.test_failed", auth.actor);
  return ok({
    ok: sent,
    message: sent
      ? "تم إرسال رسالة الاختبار بنجاح."
      : "تعذّر الإرسال. تحقق من التوكن ومعرّف المحادثة.",
  });
}
