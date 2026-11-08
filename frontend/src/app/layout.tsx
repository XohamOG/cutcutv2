import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Sofia_Sans } from "next/font/google";
import "./globals.css";

const display = Sofia_Sans({ subsets: ["latin"], weight: ["800"], variable: "--font-display" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://viralbits.xyz"),
  title: "viralbits",
  description: "Turn your stream into clips.",
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
      <body>{children}</body>
    </html>
  );
}
