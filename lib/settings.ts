import { db } from "./supabase";
import { decryptValue, encryptValue } from "./crypto";

export const DEFAULT_LINK_TTL_MINUTES = 60;

export async function settingGet(key: string): Promise<string | null> {
  const { data } = await db().from("admin_settings").select("value_cipher").eq("key", key).maybeSingle();
  if (!data?.value_cipher) return null;
  try {
    return decryptValue(data.value_cipher as string);
  } catch {
    return null;
  }
}

export async function settingSet(key: string, value: string): Promise<void> {
  await db()
    .from("admin_settings")
    .upsert({ key, value_cipher: encryptValue(value), updated_at: new Date().toISOString() }, { onConflict: "key" });
}

export async function settingUpdatedAt(key: string): Promise<string | null> {
  const { data } = await db().from("admin_settings").select("updated_at").eq("key", key).maybeSingle();
  return (data?.updated_at as string) ?? null;
}

export async function linkTtlMinutes(): Promise<number> {
  const raw = await settingGet("link_ttl_minutes");
  const n = Number(raw ?? 0);
  if (!Number.isInteger(n) || n < 5 || n > 10080) return DEFAULT_LINK_TTL_MINUTES;
  return n;
}

export async function showAmountInput(): Promise<boolean> {
  return (await settingGet("show_customer_amount_input")) === "1";
}
