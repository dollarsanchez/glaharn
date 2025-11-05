import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BillProvider } from "@/context/BillContext";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Glaharn - แชร์บิลปาร์ตี้ง่ายๆ!!",
  description: "แอปแบ่งค่าใช้จ่ายในปาร์ตี้ที่ยุติธรรมและใช้งานง่าย ไม่ต้อง login",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <BillProvider>{children}</BillProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
