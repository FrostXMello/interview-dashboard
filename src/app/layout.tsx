import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DataProvider } from "@/context/DataProvider";

export const metadata: Metadata = {
  title: "Interview Dashboard Pro",
  description: "Interview Rating System",
  applicationName: "Interview Dashboard",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png" }]
  },
  appleWebApp: {
    capable: true,
    title: "Interview Dashboard",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#030712"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-gray-950 text-white min-h-dvh font-sans" suppressHydrationWarning>
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}
