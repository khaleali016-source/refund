"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Send, SlidersHorizontal, Timer } from "lucide-react";

const BOT_TOKEN_RE = /^\d{6,12}:[A-Za-z0-9_-]{30,50}$/;
const CHAT_ID_RE = /^-?\d{4,20}$|^@[A-Za-z0-9_]{4,32}$/;

type Settings = { configured: boolean; botTokenMasked: string; chatId: string; updatedAt: string | null };

export function SettingsClient() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [editing, setEditing] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/settings").then((r) => r.json());
    setSettings(res);
    setChatId(res?.chatId ?? "");
    if (!res?.configured) setEditing(true);
  }
  useEffect(() => { load(); }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setNotice("");
    if (!BOT_TOKEN_RE.test(botToken.trim()) || !CHAT_ID_RE.test(chatId.trim())) {
      setError("تحقّق من صيغة التوكن ومعرّف المحادثة."); return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botToken: botToken.trim(), chatId: chatId.trim() }),
    });
    setSaving(false);
    if (!res.ok) { setError("تعذّر الحفظ."); return; }
    setNotice("تم حفظ الإعدادات.");
    setBotToken(""); setEditing(false);
    load();
  }

  async function onTest() {
    setTesting(true);
    const res = await fetch("/api/admin/settings/test", { method: "POST" }).then((r) => r.json());
    setTesting(false);
    (res?.ok ? setNotice : setError)(res?.message ?? "");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold sm:text-2xl">الإعدادات</h1>
        <p className="mt-1 text-sm text-muted-foreground">إعدادات تكامل تيليجرام محفوظة بشكل مشفّر.</p>
      </div>

      <form onSubmit={onSave} className="card-soft p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold">تيليجرام</h2>
          {settings?.updatedAt && (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
              آخر تحديث: {new Date(settings.updatedAt).toLocaleString("ar-BH")}
            </span>
          )}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold">Telegram Bot Token</label>
            <input
              dir="ltr"
              type={editing ? "text" : "password"}
              value={editing ? botToken : settings?.botTokenMasked ?? ""}
              onChange={(e) => setBotToken(e.target.value)}
              disabled={!editing}
              placeholder="123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-ring/15 disabled:bg-muted"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold">Telegram Chat ID</label>
            <input
              dir="ltr"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              disabled={!editing}
              placeholder="-1001234567890 أو @channel_name"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-ring/15 disabled:bg-muted"
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
        {notice && <p className="mt-3 text-sm font-semibold text-primary">{notice}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          {editing ? (
            <button type="submit" disabled={saving} className="btn-brand inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ
            </button>
          ) : (
            <button type="button" onClick={() => { setEditing(true); setBotToken(""); }} className="btn-brand rounded-2xl px-5 py-3 text-sm font-bold">
              تعديل
            </button>
          )}
          <button
            type="button"
            onClick={onTest}
            disabled={testing || !settings?.configured}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-bold disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            اختبار الاتصال
          </button>
        </div>
      </form>

      <LinkTtlCard />
      <AmountToggleCard />
    </div>
  );
}

function LinkTtlCard() {
  const [minutes, setMinutes] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch("/api/admin/link-ttl").then((r) => r.json()).then((d) => setMinutes(String(d?.minutes ?? "")));
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(minutes);
    if (!Number.isInteger(value) || value < 5 || value > 10080) return;
    setSaving(true);
    await fetch("/api/admin/link-ttl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes: value }),
    });
    setSaving(false);
  }
  return (
    <form onSubmit={submit} className="card-soft p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold"><Timer className="h-4 w-4" />صلاحية روابط العملاء</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <input
          type="number" min={5} max={10080} dir="ltr"
          value={minutes} onChange={(e) => setMinutes(e.target.value)}
          className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-ring/15"
        />
        <button type="submit" disabled={saving} className="btn-brand inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ المدة
        </button>
      </div>
    </form>
  );
}

function AmountToggleCard() {
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch("/api/admin/amount-toggle").then((r) => r.json()).then((d) => setEnabled(Boolean(d?.enabled)));
  }, []);
  async function toggle() {
    setSaving(true);
    const next = !enabled;
    await fetch("/api/admin/amount-toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    setEnabled(next);
    setSaving(false);
  }
  return (
    <div className="card-soft p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <SlidersHorizontal className="h-4 w-4" />
        حقل مبلغ الاسترجاع في صفحة العميل
      </h2>
      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-sm font-semibold">{enabled ? "مُفعّل — يظهر" : "مُعطّل — مخفي"}</span>
        <button
          type="button" onClick={toggle} disabled={saving}
          aria-pressed={enabled}
          className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-55 ${enabled ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-background shadow transition-all ${enabled ? "right-1" : "right-6"}`} />
        </button>
      </div>
    </div>
  );
}
