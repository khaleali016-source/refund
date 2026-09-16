import crypto from "node:crypto";
import { db } from "./supabase";

export function clientIp(headers: Headers): string {
  const raw =
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0] ??
    "0.0.0.0";
  return raw.trim().slice(0, 45);
}

/** true = مسموح، false = تجاوز الحد. */
export async function rateLimit(
  bucket: string,
  headers: Headers,
  limit = 20,
  windowSeconds = 300,
): Promise<boolean> {
  const key = `${bucket}|${crypto.createHash("sha256").update(clientIp(headers)).digest("hex")}`.slice(0, 160);
  const client = db();
  const { data } = await client
    .from("rate_limits")
    .select("hits, window_start")
    .eq("bucket_key", key)
    .maybeSingle();
  const now = Date.now();
  if (data && now - new Date(data.window_start as string).getTime() < windowSeconds * 1000) {
    if ((data.hits as number) >= limit) return false;
    await client.from("rate_limits").update({ hits: (data.hits as number) + 1 }).eq("bucket_key", key);
    return true;
  }
  await client
    .from("rate_limits")
    .upsert({ bucket_key: key, hits: 1, window_start: new Date().toISOString() }, { onConflict: "bucket_key" });
  return true;
}
