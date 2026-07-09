import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Vehicles | Hire Car",
  description: "Search and filter through our nationwide inventory of verified rental vehicles.",
  // Filter UI: crawlable so bots follow links to indexable hubs, but kept out
  // of the index (query-string permutations would create thin/duplicate URLs).
  // Self-canonical collapses those permutations to the clean path.
  alternates: { canonical: "/search" },
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
