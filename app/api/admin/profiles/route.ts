import { z } from "zod";
import { adminOr401, fail, ok } from "@/lib/api";
import {
  cancelProfile,
  createProfile,
  deleteProfiles,
  extendProfile,
  isShortCode,
  listProfiles,
} from "@/lib/profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await adminOr401();
  if ("response" in auth) return auth.response;
  return ok({ profiles: await listProfiles() });
}

export async function POST(request: Request) {
  const auth = await adminOr401();
  if ("response" in auth) return auth.response;
  const parsed = z
    .object({
      customerName: z.string().trim().min(1).max(120),
      refundAmount: z.number().positive().max(999_999_999.999),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("أدخل اسم العميل ومبلغاً صحيحاً.");
  const profile = await createProfile(parsed.data.customerName, parsed.data.refundAmount, auth.actor);
  return ok({ profile });
}

export async function PATCH(request: Request) {
  const auth = await adminOr401();
  if ("response" in auth) return auth.response;
  const parsed = z
    .object({ id: z.string().regex(/^\d{5}$/), action: z.enum(["extend", "cancel"]) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("طلب غير صالح.");
  try {
    const profile =
      parsed.data.action === "extend"
        ? await extendProfile(parsed.data.id, auth.actor)
        : await cancelProfile(parsed.data.id, auth.actor);
    return ok({ profile });
  } catch {
    return fail("لم يتم العثور على الملف.", 404);
  }
}

export async function DELETE(request: Request) {
  const auth = await adminOr401();
  if ("response" in auth) return auth.response;
  const parsed = z
    .object({ ids: z.array(z.string()).min(1).max(200) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.ids.every(isShortCode)) return fail("قائمة غير صالحة.");
  return ok({ deleted: await deleteProfiles(parsed.data.ids, auth.actor) });
}
