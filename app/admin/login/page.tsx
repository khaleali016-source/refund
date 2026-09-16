"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.message ?? "بيانات الدخول غير صحيحة.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <form onSubmit={onSubmit} className="card-soft animate-fade-in p-6 sm:p-8">
        <h1 className="text-xl font-extrabold">تسجيل دخول المدير</h1>
        <p className="mt-1 text-sm text-muted-foreground">أدخل بيانات المدير للوصول للوحة التحكم.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-bold">اسم المستخدم</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/15"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-bold">كلمة المرور</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/15"
            />
          </div>
          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-extrabold"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
            تسجيل الدخول
          </button>
        </div>
      </form>
    </main>
  );
}
