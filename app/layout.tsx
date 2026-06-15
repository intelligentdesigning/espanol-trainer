import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/locale";
import { Nav } from "@/components/Nav";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Español Trainer",
  description: "Spanisch lernen: Vokabeln & Grammatik",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <LocaleProvider>
          <Nav />
          <main className="flex-1 w-full mx-auto max-w-3xl px-4 py-6 sm:py-10">{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
