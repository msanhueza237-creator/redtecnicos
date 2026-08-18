import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/app-chrome";
import { getAppSession } from "@/lib/auth/session";
import { isSearchIndexingEnabled } from "@/lib/seo";
import { getPublicSiteOrigin } from "@/lib/site-url";
import { getAppDataSource, getAuthDataSource } from "@/lib/supabase/config";

const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-public-sans",
});

export function generateMetadata(): Metadata {
  const indexingEnabled = isSearchIndexingEnabled();

  return {
    metadataBase: new URL(getPublicSiteOrigin()),
    applicationName: "Red Técnicos Chile",
    title: {
      default: "Red Técnicos Chile",
      template: "%s | Red Técnicos Chile",
    },
    description:
      "Directorio de técnicos y empresas de refrigeración y climatización registrados voluntariamente en Chile.",
    openGraph: {
      type: "website",
      locale: "es_CL",
      siteName: "Red Técnicos Chile",
      title: "Red Técnicos Chile",
      description:
        "Busca técnicos y empresas de refrigeración y climatización por servicio y ubicación en Chile.",
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title: "Red Técnicos Chile",
      description:
        "Busca técnicos y empresas de refrigeración y climatización por servicio y ubicación en Chile.",
    },
    robots: {
      index: indexingEnabled,
      follow: indexingEnabled,
      googleBot: indexingEnabled
        ? {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          }
        : { index: false, follow: false },
    },
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
      : {}),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getAppSession();
  const dataSource = getAppDataSource();
  const authSource = getAuthDataSource();

  return (
    <html lang="es-CL" className={publicSans.variable} data-scroll-behavior="smooth">
      <body>
        <AppChrome
          authSource={authSource}
          dataSource={dataSource}
          sessionRole={session?.role ?? null}
        >
          {children}
        </AppChrome>
      </body>
    </html>
  );
}
