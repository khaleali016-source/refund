import { settingGet } from "./settings";

const TOKEN_RE = /^\d{6,12}:[A-Za-z0-9_-]{30,50}$/;

export async function telegramCreds() {
  const [botToken, chatId] = await Promise.all([
    settingGet("telegram_bot_token"),
    settingGet("telegram_chat_id"),
  ]);
  return { botToken: botToken ?? "", chatId: chatId ?? "" };
}

/** الوجهة ثابتة والقيم من التخزين المشفّر — لا مدخلات مستخدم تؤثر على الطلب. */
export async function telegramSend(text: string): Promise<boolean> {
  const { botToken, chatId } = await telegramCreds();
  if (!botToken || !chatId || !TOKEN_RE.test(botToken)) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 3500) }),
    });
    const result = (await response.json()) as { ok?: boolean };
    return Boolean(result.ok);
  } catch {
    return false;
  }
}
