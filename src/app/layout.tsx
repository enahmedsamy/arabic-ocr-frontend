import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "استخراج النصوص العربية",
  description: "تطبيق متطور للتعرف الضوئي على النصوص العربية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
          precedence="default"
        />
      </head>
      <body className="font-['Baloo_Bhaijaan_2']">{children}</body>
    </html>
  );
}
