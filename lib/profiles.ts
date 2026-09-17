import { db } from "./supabase";
import { auditLog } from "./audit";
import { linkTtlMinutes } from "./settings";

const COLUMNS = "short_code, customer_name, refund_amount, status, expires_at";

export type ProfileDto = {
  id: string;
  name: string;
  amount: number;
  status: string;
  expiresAt: string;
};

type Row = {
  short_code: string;
  customer_name: string;
  refund_amount: number | string;
  status: string;
  expires_at: string;
};

function dto(row: Row): ProfileDto {
  return {
    id: row.short_code,
    name: row.customer_name,
    amount: Number(row.refund_amount),
    status: row.status,
    expiresAt: row.expires_at,
  };
}

export function isShortCode(value: string): boolean {
  return /^\d{5}$/.test(value);
}

async function generateShortCode(): Promise<string> {
  for (let i = 0; i < 40; i += 1) {
    const code = String(Math.floor(10000 + Math.random() * 90000));
    const { data } = await db().from("saved_profiles").select("short_code").eq("short_code", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("تعذّر توليد رقم قصير فريد.");
}

export async function listProfiles(): Promise<ProfileDto[]> {
  const { data, error } = await db()
    .from("saved_profiles")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(dto);
}

export async function createProfile(name: string, amount: number, actor: string): Promise<ProfileDto> {
  const minutes = await linkTtlMinutes();
  const shortCode = await generateShortCode();
  const { data, error } = await db()
    .from("saved_profiles")
    .insert({
      short_code: shortCode,
      customer_name: name,
      refund_amount: amount,
      status: "active",
      expires_at: new Date(Date.now() + minutes * 60_000).toISOString(),
    })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  await auditLog("profile.created", actor, { profile_id: shortCode, ttl_minutes: minutes });
  return dto(data as Row);
}

export async function extendProfile(shortCode: string, actor: string): Promise<ProfileDto> {
  const minutes = await linkTtlMinutes();
  const { data, error } = await db()
    .from("saved_profiles")
    .update({ expires_at: new Date(Date.now() + minutes * 60_000).toISOString(), status: "active" })
    .eq("short_code", shortCode)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("profile_not_found");
  await auditLog("profile.extended", actor, { profile_id: shortCode, ttl_minutes: minutes });
  return dto(data as Row);
}

export async function cancelProfile(shortCode: string, actor: string): Promise<ProfileDto> {
  const { data, error } = await db()
    .from("saved_profiles")
    .update({ expires_at: new Date().toISOString(), status: "cancelled" })
    .eq("short_code", shortCode)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("profile_not_found");
  await auditLog("profile.cancelled", actor, { profile_id: shortCode });
  return dto(data as Row);
}

export async function deleteProfiles(codes: string[], actor: string): Promise<string[]> {
  const ids = codes.filter(isShortCode).slice(0, 200);
  if (ids.length === 0) return [];
  const { data, error } = await db().from("saved_profiles").delete().in("short_code", ids).select("short_code");
  if (error) throw error;
  const deleted = ((data ?? []) as { short_code: string }[]).map((row) => row.short_code);
  if (deleted.length > 0) {
    await auditLog("profile.deleted", actor, { profile_ids: deleted, count: deleted.length });
  }
  return deleted;
}

export async function getActiveProfile(shortCode: string): Promise<ProfileDto | null> {
  if (!isShortCode(shortCode)) return null;
  const { data, error } = await db()
    .from("saved_profiles")
    .select(COLUMNS)
    .eq("short_code", shortCode)
    .neq("status", "cancelled")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data ? dto(data as Row) : null;
}
