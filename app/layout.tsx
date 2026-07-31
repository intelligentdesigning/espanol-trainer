import type { Metadata } from "next";
import { Geist, Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/locale";
import { LangProvider } from "@/lib/lang";
import { Nav } from "@/components/Nav";
import { ProfileGate } from "@/components/ProfileGate";
import { BackupWarning } from "@/components/BackupWarning";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap" });
// display face for the German mode (geometric, precise — contrast to the Spanish serif)
const space = Space_Grotesk({ variable: "--font-space", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Español Trainer",
  description: "Spanisch lernen: Vokabeln & Grammatik",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${geist.variable} ${fraunces.variable} ${space.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* apply the learned-language theme before paint (no colour flash) */}
        <script dangerouslySetInnerHTML={{ __html: `try{var l=localStorage.getItem('learn-lang');if(l==='de')document.documentElement.setAttribute('data-lang','de')}catch(e){}` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <div aria-hidden className="atmosphere pointer-events-none fixed inset-0 z-0" />
        <LangProvider>
          <LocaleProvider>
            <Nav />
            <ProfileGate />
            <main className="relative z-[1] flex-1 w-full mx-auto max-w-3xl px-4 py-6 sm:py-10">
              <BackupWarning />
              {children}
            </main>
          </LocaleProvider>
        </LangProvider>
      </body>
    </html>
  );
}
