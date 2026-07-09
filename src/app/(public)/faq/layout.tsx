import type { Metadata } from "next";
import { buildFaqSchema, serializeSchemas } from "@/lib/seo";
import { faqs } from "./faqs";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Hire Car",
  description:
    "Answers to common questions about renting from and listing on Hire Car — how the marketplace works, payments, vendor verification, insurance, leads and pricing.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Frequently Asked Questions | Hire Car",
    description:
      "How renting and listing on Hire Car works — payments, verification, insurance, leads and pricing.",
    url: "/faq",
  },
};

// Flatten the grouped FAQs into FAQPage entries for the rich result.
const faqSchema = buildFaqSchema(
  faqs.flatMap((section) => section.questions.map((item) => ({ question: item.q, answer: item.a }))),
);

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchemas([faqSchema]) }}
      />
      {children}
    </>
  );
}
