import './globals.css'
import { Noto_Naskh_Arabic } from 'next/font/google'

const notoNaskhArabic = Noto_Naskh_Arabic({
  weight: ['400', '500', '600', '700'],
  subsets: ['arabic'],
  variable: '--font-noto-naskh-arabic',
})

export const metadata = {
  title: 'Arabic OCR Processing',
  description: 'Extract Arabic text from PDF files using OCR technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <html lang="ar" dir="rtl">
      <body className={`${notoNaskhArabic.variable}`}>{children}</body>
    </html>
  )
}
