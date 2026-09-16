import Link from "next/link";
import { currentAdmin } from "@/lib/session";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const username = await currentAdmin();

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-lg font-extrabold">
              لوحة تحكم المدير
            </Link>
            {username && (
              <nav className="hidden gap-3 text-sm font-semibold text-muted-foreground sm:flex">
                <Link href="/admin" className="hover:text-foreground">نظرة عامة</Link>
                <Link href="/admin/settings" className="hover:text-foreground">الإعدادات</Link>
              </nav>
            )}
          </div>
          {username && <LogoutButton username={username} />}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
