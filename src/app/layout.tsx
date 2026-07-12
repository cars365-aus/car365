import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
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
    default: "Car365 — Quality Used Cars, Honestly Inspected",
    template: "%s | Car365",
  },
  description:
    "Browse quality, inspected used cars for sale. Transparent pricing, finance available, trade-ins welcome, and a team that answers fast.",
  keywords: ["used cars", "cars for sale", "second hand cars", "used SUV", "used ute", "car finance", "trade-in"],
  metadataBase: new URL("https://www.car365.example"),
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  applicationName: "Car365",
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
    url: "https://www.car365.example",
    siteName: "Car365",
    title: "Car365 — Quality Used Cars, Honestly Inspected",
    description:
      "Quality, inspected used cars for sale with transparent pricing, finance, and trade-ins welcome.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Car365 — Quality Used Cars for Sale",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Car365 — Quality Used Cars, Honestly Inspected",
    description:
      "Quality, inspected used cars for sale with transparent pricing, finance, and trade-ins welcome.",
    images: ["/og-image.jpg"],
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
