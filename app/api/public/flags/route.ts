import { ok } from "@/lib/api";
import { showAmountInput } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return ok({ showCustomerAmountInput: await showAmountInput() });
}
