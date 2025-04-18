import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arabic Books OCR",
  description: "Extract text from Arabic books and documents easily",
  icons: {
    icon: "https://res.cloudinary.com/dflkfh5eu/image/upload/v1744937747/sk1lwdly7vbxcxl34mhg.png",
  }
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
        <link rel="icon" href="https://res.cloudinary.com/dflkfh5eu/image/upload/v1744937747/sk1lwdly7vbxcxl34mhg.png" />
      </head>
      <body className="font-['Baloo_Bhaijaan_2']">{children}</body>
    </html>
  );
}
