import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/app-chrome";
import { getAppSession } from "@/lib/auth/session";
import { getAppDataSource } from "@/lib/supabase/config";

const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Red Técnicos Chile",
    template: "%s | Red Técnicos Chile",
  },
  description:
    "Directorio de técnicos y empresas de refrigeración y climatización registrados voluntariamente en Chile.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getAppSession();
  const authMode = getAppDataSource();

  return (
    <html lang="es-CL" className={publicSans.variable} data-scroll-behavior="smooth">
      <body>
        <AppChrome authMode={authMode} sessionRole={session?.role ?? null}>{children}</AppChrome>
      </body>
    </html>
  );
}
