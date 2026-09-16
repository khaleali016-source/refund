import { z } from "zod";
import { adminOr401, fail, ok } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { maskSecret } from "@/lib/crypto";
import { settingGet, settingSet, settingUpdatedAt } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  botToken: z.string().trim().regex(/^\d{6,12}:[A-Za-z0-9_-]{30,50}$/),
  chatId: z.string().trim().regex(/^-?\d{4,20}$|^@[A-Za-z0-9_]{4,32}$/),
});

export async function GET() {
  const auth = await adminOr401();
  if ("response" in auth) return auth.response;
  const [botToken, chatId, updatedAt] = await Promise.all([
    settingGet("telegram_bot_token"),
    settingGet("telegram_chat_id"),
    settingUpdatedAt("telegram_bot_token"),
  ]);
  return ok({
    configured: Boolean(botToken && chatId),
    botTokenMasked: maskSecret(botToken ?? ""),
    chatId: chatId ?? "",
    updatedAt,
  });
}

export async function POST(request: Request) {
  const auth = await adminOr401();
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("قيم غير صالحة. راجع التوكن ومعرّف المحادثة.");
  await settingSet("telegram_bot_token", parsed.data.botToken);
  await settingSet("telegram_chat_id", parsed.data.chatId);
  await auditLog("settings.updated", auth.actor, { keys: ["telegram_bot_token", "telegram_chat_id"] });
  return ok({ ok: true });
}
