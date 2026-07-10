import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { MobileStateProvider } from "@/components/mobile-state-provider";
import { MobileAnimationProvider } from "@/components/mobile-animation-provider";
import { ScrollToTop } from "@/components/scroll-to-top";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";
import { appleStartupImages } from "@/lib/pwa-splash";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// SRS §12.2: a modern grotesque with automotive character for headings (600–800).
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b5fff",
};

export const metadata: Metadata = {
  title: {
    default: "HireCar Marketplace — Premium car rental. Without the premium price.",
    template: "%s | HireCar Marketplace",
  },
  description:
    "Premium car rental. Without the premium price. Australia's trusted marketplace for verified car rental operators. Compare vehicles from independent fleet owners for your next journey.",
  keywords: ["car rental", "car hire", "Australia", "Sydney", "Melbourne", "Brisbane", "Perth", "rental marketplace"],
  metadataBase: new URL("https://www.hirecarmarketplace.com.au"),
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  applicationName: "HireCar",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icons/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HireCar",
    startupImage: appleStartupImages,
  },
  // Legacy iOS (< 16.4) reads the apple-prefixed flag for standalone launch;
  // Next emits the modern `mobile-web-app-capable`, so add the legacy one too.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://www.hirecarmarketplace.com.au",
    siteName: "HireCar Marketplace",
    title: "HireCar Marketplace — Premium car rental.",
    description:
      "Premium car rental. Without the premium price. Compare vehicles from verified Australian rental operators.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "HireCar Marketplace — Premium Car Rental in Australia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HireCar Marketplace — Premium car rental.",
    description:
      "Premium car rental. Without the premium price. Compare vehicles from verified Australian rental operators.",
    images: ["/og-image.jpg"],
    creator: "@hirecarau",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-AU"
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground font-sans tracking-tight">
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        <MobileStateProvider>
          <MobileAnimationProvider>
            {children}
            <WhatsAppFloat phone="61434930437" />
            <ScrollToTop />
            <PwaInstallBanner />
          </MobileAnimationProvider>
        </MobileStateProvider>
        <Toaster richColors position="top-right" />
        <Script id="sw-register" strategy="lazyOnload">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(function(err) {
                console.log('SW registration failed:', err);
              });
            }
          `}
        </Script>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
