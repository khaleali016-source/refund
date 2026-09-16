import { adminOr401, ok } from "@/lib/api";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await adminOr401();
  if ("response" in auth) return auth.response;
  const { data } = await db()
    .from("admin_audit_logs")
    .select("id, action, actor, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  return ok({ logs: data ?? [] });
}

export async function DELETE() {
  const auth = await adminOr401();
  if ("response" in auth) return auth.response;
  await db().from("admin_audit_logs").delete().neq("action", "__never__");
  return ok({ ok: true, actor: auth.actor });
}
