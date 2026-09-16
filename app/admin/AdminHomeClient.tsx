"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, ScrollText, Settings } from "lucide-react";
import { SavedProfilesTable } from "./SavedProfilesTable";
import { actionLabel } from "./labels";

type Log = { id: string; action: string; actor: string; created_at: string };

export function AdminHomeClient() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/admin/logs").then((r) => r.json()).catch(() => null);
    setLogs(res?.logs ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function clearLogs() {
    setClearing(true);
    await fetch("/api/admin/logs", { method: "DELETE" });
    setClearing(false);
    setConfirm(false);
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold sm:text-2xl">نظرة عامة</h1>
          <p className="mt-1 text-sm text-muted-foreground">تابع الإعدادات وآخر العمليات.</p>
        </div>
        <Link href="/admin/settings" className="btn-brand inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold">
          <Settings className="h-4 w-4" />
          فتح الإعدادات
        </Link>
      </div>

      <SavedProfilesTable />

      <div className="card-soft overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <ScrollText className="h-4 w-4" />
            آخر العمليات
          </h2>
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground"
          >
            مسح جميع العمليات
          </button>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">جارٍ التحميل...</p>
        ) : logs.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">لا توجد عمليات مسجّلة بعد.</p>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <span className="text-sm font-semibold">{actionLabel(log.action)}</span>
                <span className="text-xs text-muted-foreground">
                  {log.actor} · {new Date(log.created_at).toLocaleString("ar-BH")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card-soft w-full max-w-sm p-6 text-center">
            <h3 className="text-base font-extrabold">تأكيد الحذف</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              هل أنت تأكد من رغبتك في حذف جميع سجلات العمليات؟
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={clearLogs}
                disabled={clearing}
                className="flex-1 rounded-xl bg-destructive px-4 py-3 text-sm font-bold text-destructive-foreground disabled:opacity-60"
              >
                {clearing ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "حذف"}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
