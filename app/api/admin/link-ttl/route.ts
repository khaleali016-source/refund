import { z } from "zod";
import { adminOr401, fail, ok } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { linkTtlMinutes, settingSet } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await adminOr401();
  if ("response" in auth) return auth.response;
  return ok({ minutes: await linkTtlMinutes() });
}

export async function POST(request: Request) {
  const auth = await adminOr401();
  if ("response" in auth) return auth.response;
  const parsed = z
    .object({ minutes: z.number().int().min(5).max(10080) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("أدخل عدد دقائق صحيح بين 5 و10080.");
  await settingSet("link_ttl_minutes", String(parsed.data.minutes));
  await auditLog("link_ttl.updated", auth.actor, { minutes: parsed.data.minutes });
  return ok({ minutes: parsed.data.minutes });
}
