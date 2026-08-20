import type { Metadata } from "next";
import "./globals.css";
import { DataProvider } from "@/context/DataProvider";

/**
 * WHY local font stack instead of next/font Google fetch:
 * Builds must succeed without outbound TLS to fonts.googleapis.com
 * (corporate proxies / offline CI). Visual identity stays dark App Router shell.
 */
export const metadata: Metadata = {
  title: "Interview Dashboard Pro",
  description: "Interview Rating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-gray-950 text-white min-h-screen font-sans" suppressHydrationWarning>
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}
