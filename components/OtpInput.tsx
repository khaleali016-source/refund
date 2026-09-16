"use client";

import { useRef } from "react";

export function OtpInput({
  digits,
  onChange,
  disabled,
}: {
  digits: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(index: number, raw: string) {
    const value = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = value;
    onChange(next);
    if (value && index < digits.length - 1) refs.current[index + 1]?.focus();
  }

  return (
    <div dir="ltr" className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          aria-label={`رقم ${index + 1} من رمز التحقق`}
          onChange={(e) => setDigit(index, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus();
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, digits.length);
            if (!text) return;
            e.preventDefault();
            const next = digits.map((_, i) => text[i] ?? "");
            onChange(next);
            refs.current[Math.min(text.length, digits.length - 1)]?.focus();
          }}
          className="h-14 w-11 rounded-xl border border-input bg-background text-center text-xl font-bold text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/20 disabled:bg-muted sm:h-16 sm:w-14"
        />
      ))}
    </div>
  );
}
