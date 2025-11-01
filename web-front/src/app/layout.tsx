import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";
import { ToastProvider } from "@/components/Toast";
import ScrollRestoration from "@/components/ScrollRestoration";
export const metadata: Metadata = {
  title: "SupplyGo",
  description: "Marketplace for better prices",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bgpage text-textmain min-h-screen flex flex-col">
        <ToastProvider>
          <Header />
          {/* ระบบจำตำแหน่ง scroll */}
          <ScrollRestoration />
          <main className="flex-1">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
