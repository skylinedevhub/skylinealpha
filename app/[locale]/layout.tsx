import type { Metadata } from "next";
import { Bebas_Neue, DM_Mono } from "next/font/google";
import { locales } from "@/i18n/config";
import "../globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["300", "400"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://skylinedevelopmenthub.com"),
  title: {
    default: "Skyline DevHub",
    template: "%s | Skyline DevHub",
  },
  description:
    "AI-native digital solutions and automation-first systems for businesses across Albania.",
  openGraph: {
    siteName: "Skyline DevHub",
    type: "website",
    locale: "sq_AL",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    languages: {
      sq: "/sq",
      en: "/en",
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale} className={`${bebasNeue.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
