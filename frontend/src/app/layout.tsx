import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Sofia_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import JsonLd from "@/components/JsonLd";
import { SEO, SITE_URL, STRUCTURED_DATA } from "@/lib/seo";
import "./globals.css";

const display = Sofia_Sans({ subsets: ["latin"], weight: ["800"], variable: "--font-display" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SEO.title, template: "%s · viralbits" },
  description: SEO.description,
  keywords: SEO.keywords,
  applicationName: SEO.shortTitle,
  category: "video",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SEO.shortTitle, url: SITE_URL, title: SEO.title, description: SEO.description, locale: "en_US" },
  twitter: { card: "summary_large_image", title: SEO.title, description: SEO.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#a5d3d4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <JsonLd data={STRUCTURED_DATA} />
        {children}
        {/* Page views only: no cookies, and nothing about the videos people clip. */}
        <Analytics />
      </body>
    </html>
  );
}
