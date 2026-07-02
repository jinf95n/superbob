import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SUPERBOB",
  description: "Profesionales recomendados en tu zona.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="light" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSans.variable} antialiased`}>
        <NavigationProgress />
        <ToastProvider>{children}</ToastProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
