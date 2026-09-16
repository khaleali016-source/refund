import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/session";
import { AdminHomeClient } from "./AdminHomeClient";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!(await currentAdmin())) redirect("/admin/login");
  return <AdminHomeClient />;
}
