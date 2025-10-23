import type { Metadata } from "next";
import "./globals.css"

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
        {/* อันหลัก */}
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
