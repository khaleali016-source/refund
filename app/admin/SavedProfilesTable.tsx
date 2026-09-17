"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Loader2, Plus, Timer, Trash2, X } from "lucide-react";

type Profile = {
  id: string;
  name: string;
  amount: number;
  status: "active" | "cancelled" | "expired";
  created_at: string;
  expires_at: string;
};

function remaining(expiresAt: string, status: string) {
  if (status !== "active") return status === "cancelled" ? "ملغي" : "منتهي";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "منتهي";
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export function SavedProfilesTable() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/profiles").then((r) => r.json()).catch(() => null);
    setProfiles(res?.profiles ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const allSelected = useMemo(
    () => profiles.length > 0 && profiles.every((p) => selected.has(p.id)),
    [profiles, selected],
  );

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!name.trim() || !Number.isFinite(value) || value <= 0) return;
    setCreating(true);
    await fetch("/api/admin/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName: name.trim(), refundAmount: value }),
    });
    setCreating(false);
    setName("");
    setAmount("");
    load();
  }

  async function patch(id: string, action: "extend" | "cancel") {
    await fetch("/api/admin/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    load();
  }

  async function del() {
    setConfirmDelete(false);
    await fetch("/api/admin/profiles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    setSelected(new Set());
    load();
  }

  return (
    <div className="card-soft overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-bold">ملفات العملاء</h2>
        <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم العميل"
            className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-ring/15"
          />
          <input
            type="number"
            step="0.001"
            min={0}
            dir="ltr"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="المبلغ BHD"
            className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-ring/15"
          />
          <button
            type="submit"
            disabled={creating}
            className="btn-brand inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            إنشاء رابط
          </button>
        </form>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/30 px-5 py-3">
        <label className="flex items-center gap-2 text-xs font-semibold">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => setSelected(e.target.checked ? new Set(profiles.map((p) => p.id)) : new Set())}
          />
          تحديد الكل
        </label>
        <button
          type="button"
          disabled={selected.size === 0}
          onClick={() => setConfirmDelete(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          حذف المحدد ({selected.size})
        </button>
      </div>

      {loading ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">جارٍ التحميل...</p>
      ) : profiles.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">لا توجد ملفات بعد.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-secondary/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">المبلغ</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">الوقت المتبقي</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border" data-tick={tick}>
              {profiles.map((p) => {
                const link = `${origin}/v/${p.id}`;
                return (
                  <tr key={p.id} className="text-sm">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggle(p.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3" dir="ltr">{p.amount.toFixed(3)} BHD</td>
                    <td className="px-4 py-3 text-xs">{p.status === "active" ? "نشط" : p.status === "cancelled" ? "ملغي" : "منتهي"}</td>
                    <td className="px-4 py-3 text-xs" dir="ltr">{remaining(p.expires_at, p.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(link)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-bold"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          نسخ
                        </button>
                        <button
                          type="button"
                          disabled={p.status !== "active"}
                          onClick={() => patch(p.id, "extend")}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-bold disabled:opacity-40"
                        >
                          <Timer className="h-3.5 w-3.5" />
                          تمديد
                        </button>
                        <button
                          type="button"
                          disabled={p.status !== "cancelled"}
                          onClick={() => patch(p.id, "cancel")}
                          className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-2 py-1 text-xs font-bold text-destructive disabled:opacity-40"
                        >
                          <X className="h-3.5 w-3.5" />
                          إلغاء
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card-soft w-full max-w-sm p-6 text-center">
            <h3 className="text-base font-extrabold">تأكيد الحذف</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              سيتم حذف {selected.size} ملف نهائياً.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={del} className="flex-1 rounded-xl bg-destructive px-4 py-3 text-sm font-bold text-destructive-foreground">
                حذف
              </button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-bold">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
