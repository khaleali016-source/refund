import { z } from "zod";
import { adminOr401, fail, ok } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { settingSet, showAmountInput } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await adminOr401();
  if ("response" in auth) return auth.response;
  return ok({ enabled: await showAmountInput() });
}

export async function POST(request: Request) {
  const auth = await adminOr401();
  if ("response" in auth) return auth.response;
  const parsed = z.object({ enabled: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("قيمة غير صالحة.");
  await settingSet("show_customer_amount_input", parsed.data.enabled ? "1" : "0");
  await auditLog("ui_flag.amount_input_updated", auth.actor, { enabled: parsed.data.enabled });
  return ok({ enabled: parsed.data.enabled });
}
