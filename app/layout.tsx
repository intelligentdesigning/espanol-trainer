import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/locale";
import { Nav } from "@/components/Nav";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Español Trainer",
  description: "Spanisch lernen: Vokabeln & Grammatik",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${geist.variable} ${fraunces.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <div aria-hidden className="atmosphere pointer-events-none fixed inset-0 z-0" />
        <LocaleProvider>
          <Nav />
          <main className="relative z-[1] flex-1 w-full mx-auto max-w-3xl px-4 py-6 sm:py-10">{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
