import "./globals.css";
import type { Metadata } from "next";
import { BrandColorProvider } from "@/components/providers/BrandColorProvider";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { InitialBrandColorsProvider } from "@/components/providers/InitialBrandColorsProvider";
import { TelemetryGate } from "@/components/telemetry/TelemetryGate";
import { getSEOSettings, getSiteSettings } from "@/lib/get-settings";
import {
  Be_Vietnam_Pro,
  Geist,
  Geist_Mono,
  Roboto,
  Noto_Sans,
  Nunito,
  Source_Sans_3,
  Merriweather,
  Lora,
  Montserrat,
  Roboto_Slab,
  Noto_Serif,
} from "next/font/google";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "optional",
});

const vietnameseSans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  weight: ["400", "500", "600", "700"],
  display: "optional",
  adjustFontFallback: true,
});

const robotoSans = Roboto({
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSans = Noto_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-noto-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const nunitoSans = Nunito({
  subsets: ["latin", "vietnamese"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const sourceSans = Source_Sans_3({
  subsets: ["latin", "vietnamese"],
  variable: "--font-source-sans-3",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const merriweather = Merriweather({
  subsets: ["latin", "vietnamese"],
  variable: "--font-merriweather",
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const lora = Lora({
  subsets: ["latin", "vietnamese"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto-slab",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const notoSerif = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  variable: "--font-noto-serif",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  preload: false,
});

const resolveMetadataBase = (): URL => {
  const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")
    || process.env.VERCEL_URL
    || "http://localhost:3000";
  const normalizedBaseUrl = rawBaseUrl.startsWith("http") ? rawBaseUrl : `https://${rawBaseUrl}`;
  return new URL(normalizedBaseUrl);
};

export const generateMetadata = async (): Promise<Metadata> => {
  const seo = await getSEOSettings();

  return {
    metadataBase: resolveMetadataBase(),
    verification: {
      google: seo.seo_google_verification || undefined,
      other: seo.seo_bing_verification
        ? { "msvalidate.01": seo.seo_bing_verification }
        : undefined,
    },
  };
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  const site = await getSiteSettings();
  const brandPrimary = site.site_brand_primary || '#3b82f6';
  const brandMode = site.site_brand_mode === 'single' ? 'single' : 'dual';
  const brandSecondary = brandMode === 'single'
    ? ''
    : (site.site_brand_secondary || '');
  const isDark = site.site_dark_mode === 'dark';

  return (
    <html
      lang="vi"
      className={isDark ? 'dark' : ''}
      style={{
        '--site-brand-primary': brandPrimary,
        '--site-brand-mode': brandMode,
        '--site-brand-secondary': brandSecondary,
        '--scrollbar-color': brandPrimary,
      } as React.CSSProperties}
    >
      <body
        className={`${vietnameseSans.variable} ${geistSans.variable} ${geistMono.variable} ${robotoSans.variable} ${notoSans.variable} ${nunitoSans.variable} ${sourceSans.variable} ${merriweather.variable} ${lora.variable} ${montserrat.variable} ${robotoSlab.variable} ${notoSerif.variable} antialiased`}
      >
        <ConvexClientProvider>
          <InitialBrandColorsProvider
            value={{
              mode: brandMode,
              primary: brandPrimary,
              secondary: brandSecondary,
            }}
          >
            <BrandColorProvider />
            {children}
            <TelemetryGate includeAnalytics includePageView />
          </InitialBrandColorsProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
