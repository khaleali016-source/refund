import { createClient } from "@supabase/supabase-js";

/** عميل خادم بمفتاح service_role — لا يُستورد أبداً في كود العميل. */
export function db() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Supabase env vars are not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}
