import { fail, ok } from "@/lib/api";
import { getActiveProfile } from "@/lib/profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const profile = await getActiveProfile(id);
  if (!profile) return fail("غير متوفر.", 404);
  return ok({ id: profile.id, name: profile.name, amount: profile.amount });
}
