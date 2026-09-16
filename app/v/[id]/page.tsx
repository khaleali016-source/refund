import { notFound } from "next/navigation";
import { getActiveProfile } from "@/lib/profiles";
import { ProfileClient } from "./ProfileClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "تفاصيل طلب الاسترجاع",
  description: "أكمل بيانات استلام مبلغ الاسترجاع عبر BenefitPay أو الآيبان.",
};

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getActiveProfile(id);
  if (!profile) notFound();
  return <ProfileClient id={profile.id} name={profile.name} amount={profile.amount} />;
}
