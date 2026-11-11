import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import { siteUrl } from "@/lib/env";
import { RegisterServiceWorker } from "@/components/register-sw";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "CreatorLoop — Local content that brings people in",
    template: "%s · CreatorLoop",
  },
  description:
    "CreatorLoop connects Goa's cafés, restaurants, hotels and shops with local creators who make reels that bring real customers through the door.",
  applicationName: "CreatorLoop",
  openGraph: {
    type: "website",
    siteName: "CreatorLoop",
    title: "CreatorLoop — Local creators. Real customers.",
    description: "Reels for Goa's cafés, restaurants, hotels and shops, made by local creators. You approve every one.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "CreatorLoop" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  appleWebApp: { capable: true, title: "CreatorLoop", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdfaf4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
