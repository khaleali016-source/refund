import { NextResponse } from "next/server";
import { requireAdmin } from "./session";

export function ok<T extends object>(payload: T) {
  return NextResponse.json(payload);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

/** يعيد اسم المدير أو ردّ 401 جاهز. */
export async function adminOr401(): Promise<{ actor: string } | { response: NextResponse }> {
  try {
    return { actor: await requireAdmin() };
  } catch {
    return { response: fail("غير مصرح.", 401) };
  }
}
