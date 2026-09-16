import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/session";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (!(await currentAdmin())) redirect("/admin/login");
  return <SettingsClient />;
}
