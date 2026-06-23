import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShittyAds",
  description: "A collection of shitty internet ads",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full bg-[#0f0f0f] text-[#f0f0f0]">{children}</body>
    </html>
  );
}
