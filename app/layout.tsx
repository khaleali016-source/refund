import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "استرجاع الأموال | خدمة الاسترجاع الفوري",
  description: "اختر طريقة الاسترجاع المناسبة لك، وسنحوّل المبلغ إلى حسابك خلال ثوانٍ معدودة.",
  openGraph: {
    title: "استرجاع الأموال | خدمة الاسترجاع الفوري",
    description: "استرجاع فوري عبر BenefitPay أو الآيبان البحريني.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
